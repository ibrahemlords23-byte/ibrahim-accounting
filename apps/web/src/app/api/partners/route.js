import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission, logActivity } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'partners', 'read')) {
    return Response.json({ error: 'ليس لديك صلاحية لعرض الشركاء' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type'); // customer, vendor, both
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * limit;
    const user = authResult.user;

    let whereConditions = [`store_id = ${user.storeId}`];
    
    if (type) whereConditions.push(`type = '${type}'`);
    if (isActive !== null && isActive !== undefined) {
      whereConditions.push(`is_active = ${isActive === 'true'}`);
    }
    if (search) {
      whereConditions.push(`(name ILIKE '%${search}%' OR code ILIKE '%${search}%' OR phone ILIKE '%${search}%')`);
    }

    const whereClause = whereConditions.join(' AND ');

    const partners = await sql`
      SELECT p.*, u.full_name as created_by_name
      FROM partners p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE ${sql.raw(whereClause)}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM partners WHERE ${sql.raw(whereClause)}
    `;
    const total = parseInt(countResult[0].total);

    return Response.json({
      success: true,
      data: {
        partners,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('Get partners error:', error);
    return Response.json({ error: 'خطأ في جلب بيانات الشركاء' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'partners', 'create')) {
    return Response.json({ error: 'ليس لديك صلاحية لإنشاء شركاء جدد' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    const { type, name, code, phone, email, address, tax_number, notes } = data;

    if (!type || !name) {
      return Response.json({ error: 'النوع والاسم مطلوبان' }, { status: 400 });
    }

    if (!['customer', 'vendor', 'both'].includes(type)) {
      return Response.json({ error: 'النوع يجب أن يكون: customer أو vendor أو both' }, { status: 400 });
    }

    if (code) {
      const existing = await sql`
        SELECT id FROM partners WHERE store_id = ${user.storeId} AND code = ${code}
      `;
      if (existing.length > 0) {
        return Response.json({ error: 'الكود موجود مسبقاً' }, { status: 400 });
      }
    }

    const result = await sql`
      INSERT INTO partners (
        store_id, type, name, code, phone, email, address, tax_number, notes, created_by
      ) VALUES (
        ${user.storeId}, ${type}, ${name}, ${code}, ${phone}, ${email}, 
        ${address}, ${tax_number}, ${notes}, ${user.id}
      ) RETURNING *
    `;

    const partner = result[0];
    await logActivity(user, 'create', 'partner', partner.id, null, partner);

    return Response.json({
      success: true,
      data: partner,
      message: 'تم إنشاء الشريك بنجاح'
    });
  } catch (error) {
    console.error('Create partner error:', error);
    return Response.json({ error: 'خطأ في إنشاء الشريك' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'partners', 'update')) {
    return Response.json({ error: 'ليس لديك صلاحية لتعديل الشركاء' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('id');
    
    if (!partnerId) {
      return Response.json({ error: 'معرف الشريك مطلوب' }, { status: 400 });
    }

    const data = await request.json();
    const user = authResult.user;

    const existing = await sql`
      SELECT * FROM partners WHERE id = ${partnerId} AND store_id = ${user.storeId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: 'الشريك غير موجود' }, { status: 404 });
    }

    const oldPartner = existing[0];
    const { type, name, code, phone, email, address, tax_number, notes, is_active } = data;

    const result = await sql`
      UPDATE partners SET
        type = COALESCE(${type}, type),
        name = COALESCE(${name}, name),
        code = COALESCE(${code}, code),
        phone = COALESCE(${phone}, phone),
        email = COALESCE(${email}, email),
        address = COALESCE(${address}, address),
        tax_number = COALESCE(${tax_number}, tax_number),
        notes = COALESCE(${notes}, notes),
        is_active = COALESCE(${is_active}, is_active)
      WHERE id = ${partnerId} AND store_id = ${user.storeId}
      RETURNING *
    `;

    const updatedPartner = result[0];
    await logActivity(user, 'update', 'partner', partnerId, oldPartner, updatedPartner);

    return Response.json({
      success: true,
      data: updatedPartner,
      message: 'تم تحديث بيانات الشريك بنجاح'
    });
  } catch (error) {
    console.error('Update partner error:', error);
    return Response.json({ error: 'خطأ في تحديث بيانات الشريك' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.user.role !== 'store_owner') {
    return Response.json({ error: 'فقط مدير المتجر يمكنه حذف الشركاء' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('id');
    
    if (!partnerId) {
      return Response.json({ error: 'معرف الشريك مطلوب' }, { status: 400 });
    }

    const user = authResult.user;

    const existing = await sql`
      SELECT * FROM partners WHERE id = ${partnerId} AND store_id = ${user.storeId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: 'الشريك غير موجود' }, { status: 404 });
    }

    await sql`DELETE FROM partners WHERE id = ${partnerId} AND store_id = ${user.storeId}`;

    await logActivity(user, 'delete', 'partner', partnerId, existing[0], null);

    return Response.json({
      success: true,
      message: 'تم حذف الشريك بنجاح'
    });
  } catch (error) {
    console.error('Delete partner error:', error);
    return Response.json({ error: 'خطأ في حذف الشريك' }, { status: 500 });
  }
}
