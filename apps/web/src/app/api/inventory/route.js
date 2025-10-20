import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission, logActivity } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'inventory', 'read')) {
    return Response.json({ error: 'ليس لديك صلاحية لعرض المخزون' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const category = searchParams.get('category');
    const lowStock = searchParams.get('low_stock') === 'true';
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * limit;
    const user = authResult.user;

    let whereConditions = [`store_id = ${user.storeId}`];
    
    if (category) whereConditions.push(`category ILIKE '%${category}%'`);
    if (lowStock) whereConditions.push(`current_stock <= min_stock`);
    if (isActive !== null && isActive !== undefined) {
      whereConditions.push(`is_active = ${isActive === 'true'}`);
    }
    if (search) {
      whereConditions.push(`(name ILIKE '%${search}%' OR sku ILIKE '%${search}%' OR barcode ILIKE '%${search}%')`);
    }

    const whereClause = whereConditions.join(' AND ');

    const items = await sql`
      SELECT i.*, u.full_name as created_by_name
      FROM inventory_items i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE ${sql.raw(whereClause)}
      ORDER BY i.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countResult = await sql`
      SELECT COUNT(*) as total FROM inventory_items WHERE ${sql.raw(whereClause)}
    `;
    const total = parseInt(countResult[0].total);

    const stats = await sql`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN current_stock <= min_stock THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items,
        SUM(current_stock * cost_price) as total_inventory_value
      FROM inventory_items
      WHERE store_id = ${user.storeId} AND is_active = true
    `;

    return Response.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        stats: stats[0]
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    return Response.json({ error: 'خطأ في جلب بيانات المخزون' }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'inventory', 'create')) {
    return Response.json({ error: 'ليس لديك صلاحية لإضافة أصناف للمخزون' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    const { 
      sku, name, description, unit, category, min_stock = 0, current_stock = 0,
      cost_price = 0, selling_price = 0, currency, barcode, location, image_url, notes
    } = data;

    if (!sku || !name || !unit || !currency) {
      return Response.json({ error: 'الكود والاسم والوحدة والعملة مطلوبة' }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM inventory_items WHERE store_id = ${user.storeId} AND sku = ${sku}
    `;
    if (existing.length > 0) {
      return Response.json({ error: 'الكود موجود مسبقاً' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO inventory_items (
        store_id, sku, name, description, unit, category, min_stock, current_stock,
        cost_price, selling_price, currency, barcode, location, image_url, notes, created_by
      ) VALUES (
        ${user.storeId}, ${sku}, ${name}, ${description}, ${unit}, ${category}, ${min_stock},
        ${current_stock}, ${cost_price}, ${selling_price}, ${currency}, ${barcode},
        ${location}, ${image_url}, ${notes}, ${user.id}
      ) RETURNING *
    `;

    const item = result[0];
    await logActivity(user, 'create', 'inventory_item', item.id, null, item);

    return Response.json({
      success: true,
      data: item,
      message: 'تم إضافة الصنف للمخزون بنجاح'
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    return Response.json({ error: 'خطأ في إضافة الصنف للمخزون' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'inventory', 'update')) {
    return Response.json({ error: 'ليس لديك صلاحية لتعديل المخزون' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return Response.json({ error: 'معرف الصنف مطلوب' }, { status: 400 });
    }

    const data = await request.json();
    const user = authResult.user;

    const existing = await sql`
      SELECT * FROM inventory_items WHERE id = ${itemId} AND store_id = ${user.storeId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: 'الصنف غير موجود' }, { status: 404 });
    }

    const oldItem = existing[0];
    const { 
      sku, name, description, unit, category, min_stock, current_stock,
      cost_price, selling_price, currency, barcode, location, image_url, is_active, notes
    } = data;

    const result = await sql`
      UPDATE inventory_items SET
        sku = COALESCE(${sku}, sku),
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        unit = COALESCE(${unit}, unit),
        category = COALESCE(${category}, category),
        min_stock = COALESCE(${min_stock}, min_stock),
        current_stock = COALESCE(${current_stock}, current_stock),
        cost_price = COALESCE(${cost_price}, cost_price),
        selling_price = COALESCE(${selling_price}, selling_price),
        currency = COALESCE(${currency}, currency),
        barcode = COALESCE(${barcode}, barcode),
        location = COALESCE(${location}, location),
        image_url = COALESCE(${image_url}, image_url),
        is_active = COALESCE(${is_active}, is_active),
        notes = COALESCE(${notes}, notes)
      WHERE id = ${itemId} AND store_id = ${user.storeId}
      RETURNING *
    `;

    const updatedItem = result[0];
    await logActivity(user, 'update', 'inventory_item', itemId, oldItem, updatedItem);

    return Response.json({
      success: true,
      data: updatedItem,
      message: 'تم تحديث بيانات الصنف بنجاح'
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    return Response.json({ error: 'خطأ في تحديث بيانات الصنف' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (authResult.user.role !== 'store_owner') {
    return Response.json({ error: 'فقط مدير المتجر يمكنه حذف الأصناف' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return Response.json({ error: 'معرف الصنف مطلوب' }, { status: 400 });
    }

    const user = authResult.user;

    const existing = await sql`
      SELECT * FROM inventory_items WHERE id = ${itemId} AND store_id = ${user.storeId}
    `;

    if (existing.length === 0) {
      return Response.json({ error: 'الصنف غير موجود' }, { status: 404 });
    }

    await sql`DELETE FROM inventory_items WHERE id = ${itemId} AND store_id = ${user.storeId}`;

    await logActivity(user, 'delete', 'inventory_item', itemId, existing[0], null);

    return Response.json({
      success: true,
      message: 'تم حذف الصنف من المخزون بنجاح'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    return Response.json({ error: 'خطأ في حذف الصنف' }, { status: 500 });
  }
}

