import sql from "@/app/api/utils/sql";
import { verifyAuth, checkPermission, logActivity } from "@/app/api/middleware/auth";

export async function GET(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const user = authResult.user;

    // الحصول على إعدادات المتجر
    const store = await sql`
      SELECT * FROM stores WHERE id = ${user.storeId}
    `;

    if (store.length === 0) {
      return Response.json({ error: 'المتجر غير موجود' }, { status: 404 });
    }

    // الحصول على الإعدادات المخصصة
    const customSettings = await sql`
      SELECT key, value FROM settings WHERE store_id = ${user.storeId}
    `;

    const settings = {
      store: store[0],
      custom: customSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {})
    };

    return Response.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return Response.json({ error: 'خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

export async function PUT(request) {
  const authResult = await verifyAuth(request);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!checkPermission(authResult.user, 'settings', 'update')) {
    return Response.json({ error: 'ليس لديك صلاحية لتعديل الإعدادات' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const user = authResult.user;

    const { store_settings, custom_settings } = data;

    // تحديث إعدادات المتجر
    if (store_settings) {
      const { 
        name, owner_name, owner_phone, address, logo_url, settings: storeConfig
      } = store_settings;

      await sql`
        UPDATE stores SET
          name = COALESCE(${name}, name),
          owner_name = COALESCE(${owner_name}, owner_name),
          owner_phone = COALESCE(${owner_phone}, owner_phone),
          address = COALESCE(${address}, address),
          logo_url = COALESCE(${logo_url}, logo_url),
          settings = COALESCE(${storeConfig ? JSON.stringify(storeConfig) : null}, settings)
        WHERE id = ${user.storeId}
      `;
    }

    // تحديث الإعدادات المخصصة
    if (custom_settings && typeof custom_settings === 'object') {
      for (const [key, value] of Object.entries(custom_settings)) {
        await sql`
          INSERT INTO settings (store_id, key, value, updated_by)
          VALUES (${user.storeId}, ${key}, ${JSON.stringify(value)}, ${user.id})
          ON CONFLICT (store_id, key) 
          DO UPDATE SET 
            value = ${JSON.stringify(value)},
            updated_by = ${user.id},
            updated_at = NOW()
        `;
      }
    }

    await logActivity(user, 'update', 'settings', user.storeId, null, data);

    return Response.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}

