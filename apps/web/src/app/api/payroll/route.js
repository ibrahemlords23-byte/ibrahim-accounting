import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission, logActivity } from "@/app/api/middleware/auth";

// الحصول على كشوف الرواتب
export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'employees', 'read')) {
    return Response.json({ error: 'ليس لديك صلاحية لعرض كشوف الرواتب' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month'));
    const employeeId = searchParams.get('employee_id');
    const status = searchParams.get('status');

    const user = authResult.user;

    let whereConditions = [`store_id = '${user.storeId}'`];
    
    if (month) whereConditions.push(`period_month = ${month}`);
    if (year) whereConditions.push(`period_year = ${year}`);
    if (employeeId) whereConditions.push(`employee_id = '${employeeId}'`);
    if (status) whereConditions.push(`status = '${status}'`);

    const whereClause = whereConditions.join(' AND ');

    const payrolls = await sql`
      SELECT 
        p.*,
        e.full_name as employee_name,
        e.employee_code,
        e.department,
        g.full_name as generated_by_name,
        a.full_name as approved_by_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN users g ON p.generated_by = g.id
      LEFT JOIN users a ON p.approved_by = a.id
      WHERE ${sql.raw(whereClause)}
      ORDER BY p.period_year DESC, p.period_month DESC, e.full_name ASC
    `;

    return Response.json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    return Response.json({ error: 'خطأ في جلب كشوف الرواتب' }, { status: 500 });
  }
}

// توليد كشوف الرواتب لشهر معين
export async function POST(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'employees', 'create')) {
    return Response.json({ error: 'ليس لديك صلاحية لتوليد كشوف الرواتب' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    const { period_month, period_year, employee_ids } = data;

    if (!period_month || !period_year) {
      return Response.json({ error: 'الشهر والسنة مطلوبان' }, { status: 400 });
    }

    // الحصول على الموظفين
    let employees;
    if (employee_ids && employee_ids.length > 0) {
      employees = await sql`
        SELECT * FROM employees 
        WHERE store_id = ${user.storeId} 
        AND id = ANY(${employee_ids})
        AND status = 'active'
      `;
    } else {
      employees = await sql`
        SELECT * FROM employees 
        WHERE store_id = ${user.storeId} AND status = 'active'
      `;
    }

    const generatedPayrolls = [];

    for (const employee of employees) {
      // التحقق من عدم وجود كشف راتب مسبق
      const existing = await sql`
        SELECT id FROM payroll
        WHERE store_id = ${user.storeId}
        AND employee_id = ${employee.id}
        AND period_month = ${period_month}
        AND period_year = ${period_year}
      `;

      if (existing.length > 0) {
        continue; // تخطي إذا كان موجوداً
      }

      // حساب المعاملات (سلف، غيابات، خصومات، مكافآت)
      const transactions = await sql`
        SELECT 
          type,
          SUM(amount) as total
        FROM employee_transactions
        WHERE store_id = ${user.storeId}
        AND employee_id = ${employee.id}
        AND EXTRACT(MONTH FROM transaction_date) = ${period_month}
        AND EXTRACT(YEAR FROM transaction_date) = ${period_year}
        AND is_processed = false
        GROUP BY type
      `;

      let total_advances = 0;
      let total_absences = 0;
      let total_deductions = 0;
      let total_bonuses = 0;
      let total_overtime = 0;

      transactions.forEach(t => {
        const amount = parseFloat(t.total) || 0;
        if (t.type === 'advance') total_advances += amount;
        else if (t.type === 'absence') total_absences += amount;
        else if (t.type === 'deduction') total_deductions += amount;
        else if (t.type === 'bonus') total_bonuses += amount;
        else if (t.type === 'overtime') total_overtime += amount;
      });

      const gross_salary = parseFloat(employee.base_salary) || 0;
      const net_salary = gross_salary - total_advances - total_absences - total_deductions + total_bonuses + total_overtime;

      // إنشاء كشف الراتب
      const result = await sql`
        INSERT INTO payroll (
          store_id, employee_id, period_month, period_year, gross_salary,
          total_advances, total_absences, total_deductions, total_bonuses, total_overtime,
          net_salary, currency, status, generated_by
        ) VALUES (
          ${user.storeId}, ${employee.id}, ${period_month}, ${period_year}, ${gross_salary},
          ${total_advances}, ${total_absences}, ${total_deductions}, ${total_bonuses}, ${total_overtime},
          ${net_salary}, ${employee.currency}, 'draft', ${user.id}
        ) RETURNING *
      `;

      generatedPayrolls.push(result[0]);

      // تحديث المعاملات كمعالجة
      await sql`
        UPDATE employee_transactions
        SET is_processed = true, payroll_id = ${result[0].id}
        WHERE store_id = ${user.storeId}
        AND employee_id = ${employee.id}
        AND EXTRACT(MONTH FROM transaction_date) = ${period_month}
        AND EXTRACT(YEAR FROM transaction_date) = ${period_year}
        AND is_processed = false
      `;
    }

    return Response.json({
      success: true,
      data: generatedPayrolls,
      message: `تم توليد ${generatedPayrolls.length} كشف راتب بنجاح`
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return Response.json({ error: 'خطأ في توليد كشوف الرواتب' }, { status: 500 });
  }
}

// اعتماد كشف راتب
export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.user.role !== 'store_owner' && authResult.user.role !== 'manager') {
    return Response.json({ error: 'فقط المدير يمكنه اعتماد كشوف الرواتب' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const payrollId = searchParams.get('id');
    const action = searchParams.get('action'); // approve, reject, mark_paid
    
    if (!payrollId || !action) {
      return Response.json({ error: 'معرف الكشف والإجراء مطلوبان' }, { status: 400 });
    }

    const user = authResult.user;

    const existing = await sql`
      SELECT * FROM payroll WHERE id = ${payrollId} AND store_id = ${user.storeId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: 'كشف الراتب غير موجود' }, { status: 404 });
    }

    let result;
    let message;

    if (action === 'approve') {
      result = await sql`
        UPDATE payroll 
        SET status = 'approved', approved_by = ${user.id}, approved_at = NOW()
        WHERE id = ${payrollId} AND store_id = ${user.storeId}
        RETURNING *
      `;
      message = 'تم اعتماد كشف الراتب بنجاح';
    } else if (action === 'reject') {
      result = await sql`
        UPDATE payroll 
        SET status = 'draft', approved_by = NULL, approved_at = NULL
        WHERE id = ${payrollId} AND store_id = ${user.storeId}
        RETURNING *
      `;
      message = 'تم رفض الاعتماد';
    } else if (action === 'mark_paid') {
      result = await sql`
        UPDATE payroll 
        SET status = 'paid', paid_at = NOW()
        WHERE id = ${payrollId} AND store_id = ${user.storeId}
        RETURNING *
      `;
      message = 'تم تحديث الحالة كمدفوع';
    } else {
      return Response.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const updatedPayroll = result[0];
    await logActivity(user, 'update', 'payroll', payrollId, existing[0], updatedPayroll);

    return Response.json({
      success: true,
      data: updatedPayroll,
      message
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    return Response.json({ error: 'خطأ في تحديث كشف الراتب' }, { status: 500 });
  }
}

