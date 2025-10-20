import jwt from 'jsonwebtoken';
import sql from "@/app/api/utils/sql";

const JWT_SECRET = process.env.AUTH_SECRET || 'ibrahim-accounting-secret-key';

export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'رمز الوصول مفقود', status: 401 };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // التحقق من وجود المستخدم وحالة الاشتراك
    const users = await sql`
      SELECT u.*, s.is_active as store_active, 
             s.subscription_expires_at as store_subscription_expires_at
      FROM users u
      JOIN stores s ON u.store_id = s.id
      WHERE u.id = ${decoded.userId} AND u.is_active = true
    `;

    if (users.length === 0) {
      return { error: 'المستخدم غير موجود أو غير نشط', status: 401 };
    }

    const user = users[0];

    // التحقق من انتهاء الاشتراك
    const now = new Date();
    const userExpiry = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const storeExpiry = user.store_subscription_expires_at ? new Date(user.store_subscription_expires_at) : null;

    if (userExpiry && userExpiry < now) {
      return { error: 'انتهت صلاحية حسابك', status: 403 };
    }

    if (storeExpiry && storeExpiry < now) {
      return { error: 'انتهت صلاحية اشتراك المتجر', status: 403 };
    }

    if (!user.store_active) {
      return { error: 'المتجر غير نشط', status: 403 };
    }

    return { 
      user: {
        id: user.id,
        storeId: user.store_id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        fullName: user.full_name
      } 
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'انتهت صلاحية رمز الوصول', status: 401 };
    }
    if (error.name === 'JsonWebTokenError') {
      return { error: 'رمز وصول غير صالح', status: 401 };
    }
    console.error('Auth verification error:', error);
    return { error: 'خطأ في التحقق من المصادقة', status: 500 };
  }
}

export function checkPermission(user, resource, action) {
  // مالك المتجر له صلاحيات كاملة
  if (user.role === 'store_owner') {
    return true;
  }

  // التحقق من الصلاحيات المخصصة
  const permissions = user.permissions || {};
  const resourcePermissions = permissions[resource];
  
  if (!resourcePermissions) {
    return false;
  }

  // الصلاحيات الافتراضية حسب الدور
  const rolePermissions = {
    manager: ['read', 'create', 'update', 'delete'],
    accountant: ['read', 'create', 'update'],
    data_entry: ['read', 'create'],
    warehouse_keeper: ['read', 'create', 'update'],
    viewer: ['read']
  };

  const userRolePermissions = rolePermissions[user.role] || [];
  
  return resourcePermissions.includes(action) || userRolePermissions.includes(action);
}

export function requirePermission(resource, action) {
  return async function(request, { params = {} } = {}) {
    const authResult = await verifyAuth(request);
    if (authResult.error) {
      return Response.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    if (!checkPermission(authResult.user, resource, action)) {
      return Response.json(
        { error: 'ليس لديك صلاحية للقيام بهذا الإجراء' },
        { status: 403 }
      );
    }

    // إضافة بيانات المستخدم إلى الطلب
    request.user = authResult.user;
    request.params = params;
    
    return null; // لا يوجد خطأ
  };
}

export async function logActivity(user, action, entityType, entityId, oldData = null, newData = null) {
  try {
    await sql`
      INSERT INTO audit_logs (
        store_id, user_id, action, entity_type, entity_id, old_data, new_data
      ) VALUES (
        ${user.storeId}, ${user.id}, ${action}, ${entityType}, ${entityId},
        ${oldData ? JSON.stringify(oldData) : null},
        ${newData ? JSON.stringify(newData) : null}
      )
    `;
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}