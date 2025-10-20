import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'reports', 'read')) {
    return Response.json({ error: 'ليس لديك صلاحية لعرض التقارير' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const currency = searchParams.get('currency');
    
    const user = authResult.user;

    if (!reportType) {
      return Response.json({ error: 'نوع التقرير مطلوب' }, { status: 400 });
    }

    let reportData;

    switch (reportType) {
      case 'daily_movement':
        reportData = await getDailyMovementReport(user.storeId, dateFrom, dateTo, currency);
        break;
      case 'profit_loss':
        reportData = await getProfitLossReport(user.storeId, dateFrom, dateTo, currency);
        break;
      case 'receivables_payables':
        reportData = await getReceivablesPayablesReport(user.storeId, currency);
        break;
      case 'inventory_status':
        reportData = await getInventoryStatusReport(user.storeId);
        break;
      case 'employee_payroll':
        reportData = await getEmployeePayrollReport(user.storeId, dateFrom, dateTo);
        break;
      case 'partner_statement':
        const partnerId = searchParams.get('partner_id');
        reportData = await getPartnerStatementReport(user.storeId, partnerId, dateFrom, dateTo);
        break;
      default:
        return Response.json({ error: 'نوع تقرير غير صالح' }, { status: 400 });
    }

    return Response.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Get report error:', error);
    return Response.json({ error: 'خطأ في توليد التقرير' }, { status: 500 });
  }
}

// تقرير الحركة اليومية
async function getDailyMovementReport(storeId, dateFrom, dateTo, currency) {
  const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = dateTo || new Date().toISOString().split('T')[0];

  let currencyFilter = currency ? `AND currency = '${currency}'` : '';

  const movements = await sql`
    SELECT 
      DATE(invoice_date) as date,
      'incoming' as type,
      currency,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM(paid_amount) as total_paid,
      SUM(amount - paid_amount) as total_remaining
    FROM invoices_in
    WHERE store_id = ${storeId}
    AND invoice_date >= ${fromDate}
    AND invoice_date <= ${toDate}
    ${sql.raw(currencyFilter)}
    GROUP BY DATE(invoice_date), currency
    
    UNION ALL
    
    SELECT 
      DATE(invoice_date) as date,
      'outgoing' as type,
      currency,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      SUM(paid_amount) as total_paid,
      SUM(amount - paid_amount) as total_remaining
    FROM invoices_out
    WHERE store_id = ${storeId}
    AND invoice_date >= ${fromDate}
    AND invoice_date <= ${toDate}
    ${sql.raw(currencyFilter)}
    GROUP BY DATE(invoice_date), currency
    
    ORDER BY date DESC, type
  `;

  return { movements, period: { from: fromDate, to: toDate } };
}

// تقرير الأرباح والخسائر
async function getProfitLossReport(storeId, dateFrom, dateTo, currency) {
  const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = dateTo || new Date().toISOString().split('T')[0];

  let currencyFilter = currency ? `AND currency = '${currency}'` : '';

  const incoming = await sql`
    SELECT 
      currency,
      SUM(amount) as total_amount,
      SUM(paid_amount) as total_paid
    FROM invoices_in
    WHERE store_id = ${storeId}
    AND invoice_date >= ${fromDate}
    AND invoice_date <= ${toDate}
    ${sql.raw(currencyFilter)}
    GROUP BY currency
  `;

  const outgoing = await sql`
    SELECT 
      currency,
      SUM(amount) as total_amount,
      SUM(paid_amount) as total_paid
    FROM invoices_out
    WHERE store_id = ${storeId}
    AND invoice_date >= ${fromDate}
    AND invoice_date <= ${toDate}
    ${sql.raw(currencyFilter)}
    GROUP BY currency
  `;

  // حساب الأرباح/الخسائر
  const profitLoss = {};
  incoming.forEach(inc => {
    profitLoss[inc.currency] = {
      currency: inc.currency,
      total_incoming: parseFloat(inc.total_amount) || 0,
      total_outgoing: 0,
      net_profit: 0
    };
  });

  outgoing.forEach(out => {
    if (!profitLoss[out.currency]) {
      profitLoss[out.currency] = {
        currency: out.currency,
        total_incoming: 0,
        total_outgoing: 0,
        net_profit: 0
      };
    }
    profitLoss[out.currency].total_outgoing = parseFloat(out.total_amount) || 0;
  });

  Object.keys(profitLoss).forEach(curr => {
    profitLoss[curr].net_profit = profitLoss[curr].total_incoming - profitLoss[curr].total_outgoing;
  });

  return { 
    profitLoss: Object.values(profitLoss),
    period: { from: fromDate, to: toDate }
  };
}

// تقرير الذمم المدينة والدائنة
async function getReceivablesPayablesReport(storeId, currency) {
  let currencyFilter = currency ? `AND currency = '${currency}'` : '';

  const receivables = await sql`
    SELECT 
      currency,
      COUNT(*) as invoice_count,
      SUM(amount - paid_amount) as total_due
    FROM invoices_out
    WHERE store_id = ${storeId}
    AND payment_status != 'paid'
    ${sql.raw(currencyFilter)}
    GROUP BY currency
  `;

  const payables = await sql`
    SELECT 
      currency,
      COUNT(*) as invoice_count,
      SUM(amount - paid_amount) as total_due
    FROM invoices_in
    WHERE store_id = ${storeId}
    AND payment_status != 'paid'
    ${sql.raw(currencyFilter)}
    GROUP BY currency
  `;

  return { receivables, payables };
}

// تقرير حالة المخزون
async function getInventoryStatusReport(storeId) {
  const inventory = await sql`
    SELECT 
      category,
      COUNT(*) as total_items,
      COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
      SUM(current_stock * cost_price) as total_value,
      currency
    FROM inventory_items
    WHERE store_id = ${storeId} AND is_active = true
    GROUP BY category, currency
    ORDER BY category
  `;

  const lowStockItems = await sql`
    SELECT 
      sku, name, unit, current_stock, min_stock, currency
    FROM inventory_items
    WHERE store_id = ${storeId} 
    AND current_stock <= min_stock
    AND is_active = true
    ORDER BY current_stock ASC
  `;

  return { inventory, lowStockItems };
}

// تقرير كشف رواتب الموظفين
async function getEmployeePayrollReport(storeId, dateFrom, dateTo) {
  let dateFilter = '';
  if (dateFrom && dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    dateFilter = `AND (period_year * 12 + period_month) >= ${from.getFullYear() * 12 + from.getMonth() + 1}
                  AND (period_year * 12 + period_month) <= ${to.getFullYear() * 12 + to.getMonth() + 1}`;
  }

  const payrolls = await sql`
    SELECT 
      p.*,
      e.full_name as employee_name,
      e.employee_code,
      e.department
    FROM payroll p
    JOIN employees e ON p.employee_id = e.id
    WHERE p.store_id = ${storeId}
    ${sql.raw(dateFilter)}
    ORDER BY p.period_year DESC, p.period_month DESC, e.full_name ASC
  `;

  const summary = await sql`
    SELECT 
      currency,
      COUNT(*) as total_payrolls,
      SUM(gross_salary) as total_gross,
      SUM(net_salary) as total_net,
      SUM(total_deductions) as total_deductions,
      SUM(total_bonuses) as total_bonuses
    FROM payroll
    WHERE store_id = ${storeId}
    ${sql.raw(dateFilter)}
    GROUP BY currency
  `;

  return { payrolls, summary };
}

// تقرير كشف حساب شريك
async function getPartnerStatementReport(storeId, partnerId, dateFrom, dateTo) {
  if (!partnerId) {
    throw new Error('معرف الشريك مطلوب');
  }

  const fromDate = dateFrom || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const toDate = dateTo || new Date().toISOString().split('T')[0];

  const partner = await sql`
    SELECT * FROM partners WHERE id = ${partnerId} AND store_id = ${storeId}
  `;

  if (partner.length === 0) {
    throw new Error('الشريك غير موجود');
  }

  let transactions = [];

  if (partner[0].type === 'customer' || partner[0].type === 'both') {
    const sales = await sql`
      SELECT 
        'sale' as type,
        invoice_date as date,
        invoice_number,
        amount,
        paid_amount,
        amount - paid_amount as balance,
        currency,
        description
      FROM invoices_out
      WHERE store_id = ${storeId}
      AND customer_id = ${partnerId}
      AND invoice_date >= ${fromDate}
      AND invoice_date <= ${toDate}
    `;
    transactions = [...transactions, ...sales];
  }

  if (partner[0].type === 'vendor' || partner[0].type === 'both') {
    const purchases = await sql`
      SELECT 
        'purchase' as type,
        invoice_date as date,
        invoice_number,
        amount,
        paid_amount,
        amount - paid_amount as balance,
        currency,
        description
      FROM invoices_in
      WHERE store_id = ${storeId}
      AND vendor_id = ${partnerId}
      AND invoice_date >= ${fromDate}
      AND invoice_date <= ${toDate}
    `;
    transactions = [...transactions, ...purchases];
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { 
    partner: partner[0],
    transactions,
    period: { from: fromDate, to: toDate }
  };
}

