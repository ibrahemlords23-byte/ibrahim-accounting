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

  if (!checkPermission(authResult.user, 'invoices', 'read')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لعرض الواردات' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const currency = searchParams.get('currency');
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendor_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const paymentStatus = searchParams.get('payment_status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;
    const user = authResult.user;

    // بناء الاستعلام الديناميكي
    let whereConditions = [`store_id = '${user.storeId}'`];
    let params = [];

    if (currency) {
      whereConditions.push(`currency = $${params.length + 1}`);
      params.push(currency);
    }

    if (category) {
      whereConditions.push(`category ILIKE $${params.length + 1}`);
      params.push(`%${category}%`);
    }

    if (vendorId) {
      whereConditions.push(`vendor_id = $${params.length + 1}`);
      params.push(vendorId);
    }

    if (dateFrom) {
      whereConditions.push(`invoice_date >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push(`invoice_date <= $${params.length + 1}`);
      params.push(dateTo);
    }

    if (paymentStatus) {
      whereConditions.push(`payment_status = $${params.length + 1}`);
      params.push(paymentStatus);
    }

    if (search) {
      whereConditions.push(`(
        description ILIKE $${params.length + 1} OR 
        invoice_number ILIKE $${params.length + 1} OR 
        notes ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // الحصول على البيانات
    const invoicesQuery = `
      SELECT 
        i.*,
        p.name as vendor_name,
        c.name as created_by_name
      FROM invoices_in i
      LEFT JOIN partners p ON i.vendor_id = p.id
      LEFT JOIN users c ON i.created_by = c.id
      WHERE ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    const invoices = await sql(invoicesQuery, params);

    // عدد السجلات الإجمالي
    const countQuery = `
      SELECT COUNT(*) as total
      FROM invoices_in i
      WHERE ${whereClause}
    `;
    const countParams = params.slice(0, -2); // إزالة limit و offset
    const countResult = await sql(countQuery, countParams);
    const total = parseInt(countResult[0].total);

    // الإحصائيات
    const statsQuery = `
      SELECT 
        currency,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(amount - paid_amount) as total_remaining
      FROM invoices_in i
      WHERE ${whereClause}
      GROUP BY currency
    `;
    const stats = await sql(statsQuery, countParams);

    return Response.json({
      success: true,
      data: {
        invoices,
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
    console.error('Get invoices-in error:', error);
    return Response.json(
      { error: 'خطأ في جلب بيانات الواردات' },
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

  if (!checkPermission(authResult.user, 'invoices', 'create')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لإنشاء واردات جديدة' },
      { status: 403 }
    );
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    // التحقق من البيانات المطلوبة
    const { 
      amount, 
      currency, 
      description, 
      invoice_date,
      vendor_id,
      category,
      due_date,
      tax_amount = 0,
      discount_amount = 0,
      attachments = [],
      notes,
      invoice_number
    } = data;

    if (!amount || !currency || !description || !invoice_date) {
      return Response.json(
        { error: 'البيانات الأساسية مطلوبة: المبلغ، العملة، البيان، التاريخ' },
        { status: 400 }
      );
    }

    // إنشاء الوارد
    const result = await sql`
      INSERT INTO invoices_in (
        store_id, invoice_number, vendor_id, amount, currency, description,
        category, invoice_date, due_date, tax_amount, discount_amount,
        attachments, notes, created_by
      ) VALUES (
        ${user.storeId}, ${invoice_number}, ${vendor_id}, ${amount}, ${currency},
        ${description}, ${category}, ${invoice_date}, ${due_date}, ${tax_amount},
        ${discount_amount}, ${JSON.stringify(attachments)}, ${notes}, ${user.id}
      ) RETURNING *
    `;

    const invoice = result[0];

    // تسجيل النشاط
    await logActivity(
      user, 
      'create', 
      'invoice_in', 
      invoice.id,
      null,
      invoice
    );

    return Response.json({
      success: true,
      data: invoice,
      message: 'تم إنشاء الوارد بنجاح'
    });

  } catch (error) {
    console.error('Create invoice-in error:', error);
    return Response.json(
      { error: 'خطأ في إنشاء الوارد' },
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

  if (!checkPermission(authResult.user, 'invoices', 'update')) {
    return Response.json(
      { error: 'ليس لديك صلاحية لتعديل الواردات' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');
    
    if (!invoiceId) {
      return Response.json(
        { error: 'معرف الوارد مطلوب' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const user = authResult.user;

    // التحقق من ملكية الفاتورة
    const existingInvoice = await sql`
      SELECT * FROM invoices_in 
      WHERE id = ${invoiceId} AND store_id = ${user.storeId}
    `;

    if (existingInvoice.length === 0) {
      return Response.json(
        { error: 'الوارد غير موجود' },
        { status: 404 }
      );
    }

    const oldInvoice = existingInvoice[0];

    // تحديث الوارد
    const { 
      amount, 
      currency, 
      description, 
      invoice_date,
      vendor_id,
      category,
      due_date,
      tax_amount,
      discount_amount,
      payment_status,
      paid_amount,
      attachments,
      notes,
      invoice_number
    } = data;

    const result = await sql`
      UPDATE invoices_in SET
        invoice_number = COALESCE(${invoice_number}, invoice_number),
        vendor_id = COALESCE(${vendor_id}, vendor_id),
        amount = COALESCE(${amount}, amount),
        currency = COALESCE(${currency}, currency),
        description = COALESCE(${description}, description),
        category = COALESCE(${category}, category),
        invoice_date = COALESCE(${invoice_date}, invoice_date),
        due_date = COALESCE(${due_date}, due_date),
        tax_amount = COALESCE(${tax_amount}, tax_amount),
        discount_amount = COALESCE(${discount_amount}, discount_amount),
        payment_status = COALESCE(${payment_status}, payment_status),
        paid_amount = COALESCE(${paid_amount}, paid_amount),
        attachments = COALESCE(${attachments ? JSON.stringify(attachments) : null}, attachments),
        notes = COALESCE(${notes}, notes)
      WHERE id = ${invoiceId} AND store_id = ${user.storeId}
      RETURNING *
    `;

    const updatedInvoice = result[0];

    // تسجيل النشاط
    await logActivity(
      user, 
      'update', 
      'invoice_in', 
      invoiceId,
      oldInvoice,
      updatedInvoice
    );

    return Response.json({
      success: true,
      data: updatedInvoice,
      message: 'تم تحديث الوارد بنجاح'
    });

  } catch (error) {
    console.error('Update invoice-in error:', error);
    return Response.json(
      { error: 'خطأ في تحديث الوارد' },
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

  // فقط مدير المتجر يمكنه حذف الواردات
  if (authResult.user.role !== 'store_owner') {
    return Response.json(
      { error: 'فقط مدير المتجر يمكنه حذف الواردات' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');
    
    if (!invoiceId) {
      return Response.json(
        { error: 'معرف الوارد مطلوب' },
        { status: 400 }
      );
    }

    const user = authResult.user;

    // التحقق من ملكية الفاتورة
    const existingInvoice = await sql`
      SELECT * FROM invoices_in 
      WHERE id = ${invoiceId} AND store_id = ${user.storeId}
    `;

    if (existingInvoice.length === 0) {
      return Response.json(
        { error: 'الوارد غير موجود' },
        { status: 404 }
      );
    }

    // حذف الوارد
    await sql`
      DELETE FROM invoices_in 
      WHERE id = ${invoiceId} AND store_id = ${user.storeId}
    `;

    // تسجيل النشاط
    await logActivity(
      user, 
      'delete', 
      'invoice_in', 
      invoiceId,
      existingInvoice[0],
      null
    );

    return Response.json({
      success: true,
      message: 'تم حذف الوارد بنجاح'
    });

  } catch (error) {
    console.error('Delete invoice-in error:', error);
    return Response.json(
      { error: 'خطأ في حذف الوارد' },
      { status: 500 }
    );
  }
}