import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission, logActivity } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (!checkPermission(authResult.user, 'employees', 'read')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لعرض الموظفين' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // active, inactive, terminated
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;
    const user = authResult.user;

    // بناء الاستعلام الديناميكي
    let whereConditions = [`store_id = '${user.storeId}'`];
    let params = [];

    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }

    if (department) {
      whereConditions.push(`department ILIKE $${params.length + 1}`);
      params.push(`%${department}%`);
    }

    if (search) {
      whereConditions.push(`(
        full_name ILIKE $${params.length + 1} OR 
        employee_code ILIKE $${params.length + 1} OR 
        position ILIKE $${params.length + 1} OR
        phone ILIKE $${params.length + 1} OR
        email ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // الحصول على البيانات
    const employeesQuery = `
      SELECT 
        e.*,
        c.full_name as created_by_name
      FROM employees e
      LEFT JOIN users c ON e.created_by = c.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    const employees = await sql(employeesQuery, params);

    // عدد السجلات الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
      WHERE ${whereClause}
    `;
    const countParams = params.slice(0, -2); // إزالة limit و offset
    const countResult = await sql(countQuery, countParams);
    const total = parseInt(countResult[0].total);

    // الإحصائيات
    const statsQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'active' THEN base_salary ELSE 0 END) as total_active_salaries
      FROM employees e
      WHERE ${whereClause}
      GROUP BY status
    `;
    const stats = await sql(statsQuery, countParams);

    return Response.json({
      success: true,
      data: {
        employees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    return Response.json(
      { error: 'خطأ في جلب بيانات الموظفين' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (!checkPermission(authResult.user, 'employees', 'create')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لإنشاء موظفين جدد' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    // التحقق من البيانات المطلوبة
    const { 
      employee_code,
      full_name,
      position,
      department,
      hire_date,
      birth_date,
      national_id,
      phone,
      email,
      address,
      base_salary,
      currency,
      overtime_rate = 0,
      bank_account,
      emergency_contact,
      notes
    } = data;

    if (!full_name || !hire_date || !base_salary || !currency) {
      return Response.json(
        { error: 'الاسم وتاريخ التوظيف والراتب الأساسي والعملة مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من عدم تكرار كود الموظف
    if (employee_code) {
      const existingEmployee = await sql`
        SELECT id FROM employees 
        WHERE store_id = ${user.storeId} AND employee_code = ${employee_code}
      `;
      
      if (existingEmployee.length > 0) {
        return Response.json(
          { error: 'كود الموظف موجود مسبقاً' },
          { status: 400 }
        );
      }
    }

    // إنشاء الموظف
    const result = await sql`
      INSERT INTO employees (
        store_id, employee_code, full_name, position, department, hire_date,
        birth_date, national_id, phone, email, address, base_salary, currency,
        overtime_rate, bank_account, emergency_contact, notes, created_by
      ) VALUES (
        ${user.storeId}, ${employee_code}, ${full_name}, ${position}, ${department},
        ${hire_date}, ${birth_date}, ${national_id}, ${phone}, ${email}, ${address},
        ${base_salary}, ${currency}, ${overtime_rate}, ${bank_account},
        ${emergency_contact ? JSON.stringify(emergency_contact) : null}, ${notes}, ${user.id}
      ) RETURNING *
    `;

    const employee = result[0];

    // تسجيل النشاط
    await logActivity(
      user, 
      'create', 
      'employee', 
      employee.id,
      null,
      employee
    );

    return Response.json({
      success: true,
      data: employee,
      message: 'تم إنشاء الموظف بنجاح'
    });

  } catch (error) {
    console.error('Create employee error:', error);
    return Response.json(
      { error: 'خطأ في إنشاء الموظف' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (!checkPermission(authResult.user, 'employees', 'update')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لتعديل الموظفين' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');
    
    if (!employeeId) {
      return Response.json(
        { error: 'معرف الموظف مطلوب' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const user = authResult.user;

    const existingEmployee = await sql`
      SELECT * FROM employees 
      WHERE id = ${employeeId} AND store_id = ${user.storeId}
    `;

    if (existingEmployee.length === 0) {
      return Response.json(
        { error: 'الموظف غير موجود' },
        { status: 404 }
      );
    }

    const oldEmployee = existingEmployee[0];

    const { 
      employee_code, full_name, position, department, hire_date, termination_date,
      birth_date, national_id, phone, email, address, base_salary, currency,
      overtime_rate, bank_account, emergency_contact, status, notes
    } = data;

    const result = await sql`
      UPDATE employees SET
        employee_code = COALESCE(${employee_code}, employee_code),
        full_name = COALESCE(${full_name}, full_name),
        position = COALESCE(${position}, position),
        department = COALESCE(${department}, department),
        hire_date = COALESCE(${hire_date}, hire_date),
        termination_date = COALESCE(${termination_date}, termination_date),
        birth_date = COALESCE(${birth_date}, birth_date),
        national_id = COALESCE(${national_id}, national_id),
        phone = COALESCE(${phone}, phone),
        email = COALESCE(${email}, email),
        address = COALESCE(${address}, address),
        base_salary = COALESCE(${base_salary}, base_salary),
        currency = COALESCE(${currency}, currency),
        overtime_rate = COALESCE(${overtime_rate}, overtime_rate),
        bank_account = COALESCE(${bank_account}, bank_account),
        emergency_contact = COALESCE(${emergency_contact ? JSON.stringify(emergency_contact) : null}, emergency_contact),
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes)
      WHERE id = ${employeeId} AND store_id = ${user.storeId}
      RETURNING *
    `;

    const updatedEmployee = result[0];

    await logActivity(user, 'update', 'employee', employeeId, oldEmployee, updatedEmployee);

    return Response.json({
      success: true,
      data: updatedEmployee,
      message: 'تم تحديث بيانات الموظف بنجاح'
    });

  } catch (error) {
    console.error('Update employee error:', error);
    return Response.json(
      { error: 'خطأ في تحديث بيانات الموظف' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (authResult.user.role !== 'store_owner') {
    return Response.json(
      { error: 'فقط مدير المتجر يمكنه حذف الموظفين' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('id');
    
    if (!employeeId) {
      return Response.json(
        { error: 'معرف الموظف مطلوب' },
        { status: 400 }
      );
    }

    const user = authResult.user;

    const existingEmployee = await sql`
      SELECT * FROM employees 
      WHERE id = ${employeeId} AND store_id = ${user.storeId}
    `;

    if (existingEmployee.length === 0) {
      return Response.json(
        { error: 'الموظف غير موجود' },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM employees 
      WHERE id = ${employeeId} AND store_id = ${user.storeId}
    `;

    await logActivity(user, 'delete', 'employee', employeeId, existingEmployee[0], null);

    return Response.json({
      success: true,
      message: 'تم حذف الموظف بنجاح'
    });

  } catch (error) {
    console.error('Delete employee error:', error);
    return Response.json(
      { error: 'خطأ في حذف الموظف' },
      { status: 500 }
    );
  }
}