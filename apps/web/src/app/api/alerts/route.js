import sql from "@/app/api/utils/sql";
import { verifyAuth } from "@/app/api/middleware/auth";

// الحصول على التنبيهات
export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit')) || 50;

    const user = authResult.user;

    let whereConditions = [`store_id = '${user.storeId}'`];
    
    if (unreadOnly) whereConditions.push(`is_read = false`);
    if (severity) whereConditions.push(`severity = '${severity}'`);

    const whereClause = whereConditions.join(' AND ');

    const alerts = await sql`
      SELECT * FROM alerts
      WHERE ${sql.raw(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const unreadCount = await sql`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE store_id = ${user.storeId} AND is_read = false
    `;

    return Response.json({
      success: true,
      data: {
        alerts,
        unread_count: parseInt(unreadCount[0].count)
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    return Response.json({ error: 'خطأ في جلب التنبيهات' }, { status: 500 });
  }
}

// إنشاء تنبيه جديد
export async function POST(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    const { type, severity = 'info', title, message, entity_type, entity_id } = data;

    if (!type || !title || !message) {
      return Response.json({ error: 'النوع والعنوان والرسالة مطلوبة' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO alerts (store_id, type, severity, title, message, entity_type, entity_id)
      VALUES (${user.storeId}, ${type}, ${severity}, ${title}, ${message}, ${entity_type}, ${entity_id})
      RETURNING *
    `;

    return Response.json({
      success: true,
      data: result[0],
      message: 'تم إنشاء التنبيه بنجاح'
    });
  } catch (error) {
    console.error('Create alert error:', error);
    return Response.json({ error: 'خطأ في إنشاء التنبيه' }, { status: 500 });
  }
}

// تحديث تنبيه (وضع علامة مقروء)
export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const markAllRead = searchParams.get('mark_all_read') === 'true';
    
    const user = authResult.user;

    if (markAllRead) {
      // وضع علامة مقروء على جميع التنبيهات
      await sql`
        UPDATE alerts
        SET is_read = true, read_by = ${user.id}, read_at = NOW()
        WHERE store_id = ${user.storeId} AND is_read = false
      `;

      return Response.json({
        success: true,
        message: 'تم وضع علامة مقروء على جميع التنبيهات'
      });
    }

    if (!alertId) {
      return Response.json({ error: 'معرف التنبيه مطلوب' }, { status: 400 });
    }

    const result = await sql`
      UPDATE alerts
      SET is_read = true, read_by = ${user.id}, read_at = NOW()
      WHERE id = ${alertId} AND store_id = ${user.storeId}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: result[0],
      message: 'تم تحديث التنبيه بنجاح'
    });
  } catch (error) {
    console.error('Update alert error:', error);
    return Response.json({ error: 'خطأ في تحديث التنبيه' }, { status: 500 });
  }
}

// حذف تنبيه
export async function DELETE(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const deleteAllRead = searchParams.get('delete_all_read') === 'true';
    
    const user = authResult.user;

    if (deleteAllRead) {
      // حذف جميع التنبيهات المقروءة
      await sql`
        DELETE FROM alerts
        WHERE store_id = ${user.storeId} AND is_read = true
      `;

      return Response.json({
        success: true,
        message: 'تم حذف جميع التنبيهات المقروءة'
      });
    }

    if (!alertId) {
      return Response.json({ error: 'معرف التنبيه مطلوب' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM alerts
      WHERE id = ${alertId} AND store_id = ${user.storeId}
      RETURNING id
    `;

    if (result.length === 0) {
      return Response.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: 'تم حذف التنبيه بنجاح'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    return Response.json({ error: 'خطأ في حذف التنبيه' }, { status: 500 });
  }
}

// دالة مساعدة لإنشاء تنبيهات تلقائية
export async function createAutoAlert(storeId, type, severity, title, message, entityType = null, entityId = null) {
  try {
    await sql`
      INSERT INTO alerts (store_id, type, severity, title, message, entity_type, entity_id)
      VALUES (${storeId}, ${type}, ${severity}, ${title}, ${message}, ${entityType}, ${entityId})
    `;
  } catch (error) {
    console.error('Create auto alert error:', error);
  }
}

