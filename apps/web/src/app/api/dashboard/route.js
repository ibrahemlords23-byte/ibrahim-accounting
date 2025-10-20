import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status },
    );
  }

  if (!checkPermission(authResult.user, "dashboard", "read")) {
    return Response.json(
      { error: "ليس لديك صلاحية لعرض لوحة التحكم" },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const user = authResult.user;

    // حساب التواريخ حسب الفترة
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "quarter":
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default: // month
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
    }
    endDate = new Date();

    const storeId = user.storeId;

    // إحصائيات الواردات والصادرات
    const [invoiceStats] = await sql.transaction([
      sql`
        SELECT 
          'in' as type,
          currency,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          SUM(paid_amount) as paid_amount,
          SUM(amount - paid_amount) as remaining_amount
        FROM invoices_in 
        WHERE store_id = ${storeId} 
          AND invoice_date >= ${startDate.toISOString().split("T")[0]}
          AND invoice_date <= ${endDate.toISOString().split("T")[0]}
        GROUP BY currency
        
        UNION ALL
        
        SELECT 
          'out' as type,
          currency,
          COUNT(*) as count,
          SUM(amount) as total_amount,
          SUM(paid_amount) as paid_amount,
          SUM(amount - paid_amount) as remaining_amount
        FROM invoices_out 
        WHERE store_id = ${storeId} 
          AND invoice_date >= ${startDate.toISOString().split("T")[0]}
          AND invoice_date <= ${endDate.toISOString().split("T")[0]}
        GROUP BY currency
      `,
    ]);

    // إحصائيات المخزون
    const inventoryStats = await sql`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
        SUM(current_stock * cost_price) as total_inventory_value
      FROM inventory_items 
      WHERE store_id = ${storeId} AND is_active = true
    `;

    // إحصائيات الموظفين
    const employeeStats = await sql`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        SUM(base_salary) as total_monthly_salaries
      FROM employees 
      WHERE store_id = ${storeId}
    `;

    // التنبيهات الحديثة
    const recentAlerts = await sql`
      SELECT id, type, title, message, severity, created_at
      FROM alerts 
      WHERE store_id = ${storeId} AND is_read = false
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    // معاملات الأسبوع الأخير (للمخطط)
    const weeklyTransactions = await sql`
      SELECT 
        DATE(invoice_date) as date,
        'in' as type,
        SUM(amount) as amount,
        currency
      FROM invoices_in 
      WHERE store_id = ${storeId} 
        AND invoice_date >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
      GROUP BY DATE(invoice_date), currency
      
      UNION ALL
      
      SELECT 
        DATE(invoice_date) as date,
        'out' as type,
        SUM(amount) as amount,
        currency
      FROM invoices_out 
      WHERE store_id = ${storeId} 
        AND invoice_date >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
      GROUP BY DATE(invoice_date), currency
      ORDER BY date DESC
    `;

    // أهم العملاء والموردين
    const topPartners = await sql`
      SELECT 
        p.id,
        p.name,
        p.type,
        COALESCE(SUM(CASE WHEN p.type IN ('customer', 'both') THEN io.amount ELSE 0 END), 0) as sales_amount,
        COALESCE(SUM(CASE WHEN p.type IN ('vendor', 'both') THEN ii.amount ELSE 0 END), 0) as purchase_amount
      FROM partners p
      LEFT JOIN invoices_out io ON p.id = io.customer_id AND io.invoice_date >= ${startDate.toISOString().split("T")[0]}
      LEFT JOIN invoices_in ii ON p.id = ii.vendor_id AND ii.invoice_date >= ${startDate.toISOString().split("T")[0]}
      WHERE p.store_id = ${storeId} AND p.is_active = true
      GROUP BY p.id, p.name, p.type
      HAVING (SUM(CASE WHEN p.type IN ('customer', 'both') THEN io.amount ELSE 0 END) > 0 
              OR SUM(CASE WHEN p.type IN ('vendor', 'both') THEN ii.amount ELSE 0 END) > 0)
      ORDER BY (sales_amount + purchase_amount) DESC
      LIMIT 10
    `;

    // تنظيم البيانات
    const incomingStats = invoiceStats.filter((stat) => stat.type === "in");
    const outgoingStats = invoiceStats.filter((stat) => stat.type === "out");

    // حساب صافي الربح لكل عملة
    const profitByCurrency = {};
    incomingStats.forEach((stat) => {
      if (!profitByCurrency[stat.currency]) {
        profitByCurrency[stat.currency] = { incoming: 0, outgoing: 0 };
      }
      profitByCurrency[stat.currency].incoming =
        parseFloat(stat.total_amount) || 0;
    });

    outgoingStats.forEach((stat) => {
      if (!profitByCurrency[stat.currency]) {
        profitByCurrency[stat.currency] = { incoming: 0, outgoing: 0 };
      }
      profitByCurrency[stat.currency].outgoing =
        parseFloat(stat.total_amount) || 0;
    });

    const profitData = Object.keys(profitByCurrency).map((currency) => ({
      currency,
      incoming: profitByCurrency[currency].incoming,
      outgoing: profitByCurrency[currency].outgoing,
      profit:
        profitByCurrency[currency].incoming -
        profitByCurrency[currency].outgoing,
    }));

    return Response.json({
      success: true,
      data: {
        period,
        summary: {
          incoming: incomingStats,
          outgoing: outgoingStats,
          profit: profitData,
        },
        inventory: inventoryStats[0] || {
          total_items: 0,
          low_stock_items: 0,
          out_of_stock_items: 0,
          total_inventory_value: 0,
        },
        employees: employeeStats[0] || {
          total_employees: 0,
          active_employees: 0,
          total_monthly_salaries: 0,
        },
        alerts: recentAlerts,
        weeklyTrend: weeklyTransactions,
        topPartners,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return Response.json(
      { error: "خطأ في جلب إحصائيات لوحة التحكم" },
      { status: 500 },
    );
  }
}
