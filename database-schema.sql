-- نظام إبراهيم للمحاسبة - Schema الكامل
-- Database: PostgreSQL على Neon
-- النظام: Multi-tenant (نظام متاجر)

-- ============================================
-- 1. جدول المتاجر (Stores)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) UNIQUE NOT NULL,
    owner_phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    subscription_plan VARCHAR(50) DEFAULT 'trial', -- trial, monthly, semi_annual, annual
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    settings JSONB DEFAULT '{
        "default_currency": "USD",
        "allowed_currencies": ["USD", "TRY", "SYP"],
        "locale": "ar",
        "timezone": "Asia/Damascus"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_is_active ON stores(is_active);
CREATE INDEX idx_stores_subscription_expires ON stores(subscription_expires_at);

-- ============================================
-- 2. جدول المستخدمين (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- store_owner, manager, accountant, data_entry, warehouse_keeper, viewer
    permissions JSONB DEFAULT '{}'::jsonb, -- صلاحيات مخصصة لكل مورد
    is_active BOOLEAN DEFAULT true,
    subscription_expires_at TIMESTAMP WITH TIME ZONE, -- يرث من المتجر أو مستقل
    locale VARCHAR(10) DEFAULT 'ar',
    dark_mode BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, username)
);

CREATE INDEX idx_users_store_id ON users(store_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 3. جدول العملات (Currencies)
-- ============================================
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY, -- USD, TRY, SYP
    name_ar VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    name_tr VARCHAR(50),
    symbol VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- إدراج العملات الأساسية
INSERT INTO currencies (code, name_ar, name_en, name_tr, symbol) VALUES
('USD', 'دولار أمريكي', 'US Dollar', 'Amerikan Doları', '$'),
('TRY', 'ليرة تركية', 'Turkish Lira', 'Türk Lirası', '₺'),
('SYP', 'ليرة سورية', 'Syrian Pound', 'Suriye Lirası', 'ل.س')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 4. جدول الشركاء (Partners - عملاء وموردين)
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- customer, vendor, both
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_number VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, code)
);

CREATE INDEX idx_partners_store_id ON partners(store_id);
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_is_active ON partners(is_active);
CREATE INDEX idx_partners_name ON partners(name);

-- ============================================
-- 5. جدول الواردات (Invoices In)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices_in (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100),
    vendor_id UUID REFERENCES partners(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    description TEXT NOT NULL,
    category VARCHAR(100), -- مشتريات، مصاريف، رواتب، إلخ
    invoice_date DATE NOT NULL,
    due_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    paid_amount DECIMAL(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    attachments JSONB DEFAULT '[]'::jsonb, -- مرفقات
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, invoice_number)
);

CREATE INDEX idx_invoices_in_store_id ON invoices_in(store_id);
CREATE INDEX idx_invoices_in_date ON invoices_in(invoice_date);
CREATE INDEX idx_invoices_in_vendor ON invoices_in(vendor_id);
CREATE INDEX idx_invoices_in_currency ON invoices_in(currency);
CREATE INDEX idx_invoices_in_category ON invoices_in(category);
CREATE INDEX idx_invoices_in_payment_status ON invoices_in(payment_status);
CREATE INDEX idx_invoices_in_created_at ON invoices_in(created_at);

-- ============================================
-- 6. جدول الصادرات (Invoices Out)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices_out (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100),
    customer_id UUID REFERENCES partners(id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    description TEXT NOT NULL,
    category VARCHAR(100), -- مبيعات، خدمات، إلخ
    invoice_date DATE NOT NULL,
    due_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid
    paid_amount DECIMAL(15, 2) DEFAULT 0 CHECK (paid_amount >= 0),
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, invoice_number)
);

CREATE INDEX idx_invoices_out_store_id ON invoices_out(store_id);
CREATE INDEX idx_invoices_out_date ON invoices_out(invoice_date);
CREATE INDEX idx_invoices_out_customer ON invoices_out(customer_id);
CREATE INDEX idx_invoices_out_currency ON invoices_out(currency);
CREATE INDEX idx_invoices_out_category ON invoices_out(category);
CREATE INDEX idx_invoices_out_payment_status ON invoices_out(payment_status);
CREATE INDEX idx_invoices_out_created_at ON invoices_out(created_at);

-- ============================================
-- 7. جدول الدفعات (Payments)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    invoice_type VARCHAR(10) NOT NULL, -- 'in' or 'out'
    invoice_id UUID NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50), -- cash, bank_transfer, check, credit_card
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_store_id ON payments(store_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_type, invoice_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================
-- 8. جدول أصناف المخزون (Inventory Items)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL, -- قطعة، كرتون، كيلو، متر، إلخ
    category VARCHAR(100),
    min_stock DECIMAL(10, 2) DEFAULT 0,
    current_stock DECIMAL(10, 2) DEFAULT 0,
    cost_price DECIMAL(15, 2) DEFAULT 0,
    selling_price DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    barcode VARCHAR(100),
    location VARCHAR(100), -- موقع في المستودع
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, sku)
);

CREATE INDEX idx_inventory_items_store_id ON inventory_items(store_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_name ON inventory_items(name);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(store_id, current_stock, min_stock) WHERE current_stock <= min_stock;

-- ============================================
-- 9. جدول حركات المخزون (Inventory Movements)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'in' (إدخال) or 'out' (إخراج)
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    currency VARCHAR(3) REFERENCES currencies(code),
    reference_type VARCHAR(50), -- invoice_in, invoice_out, adjustment, transfer
    reference_id UUID, -- معرف الفاتورة أو الحركة المرجعية
    movement_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_store_id ON inventory_movements(store_id);
CREATE INDEX idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- ============================================
-- 10. جدول الموظفين (Employees)
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_code VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100), -- المنصب
    department VARCHAR(100), -- القسم
    hire_date DATE NOT NULL,
    termination_date DATE,
    birth_date DATE,
    national_id VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    base_salary DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    overtime_rate DECIMAL(10, 2) DEFAULT 0,
    bank_account VARCHAR(100),
    emergency_contact JSONB, -- {name, phone, relationship}
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, employee_code)
);

CREATE INDEX idx_employees_store_id ON employees(store_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_name ON employees(full_name);

-- ============================================
-- 11. جدول معاملات الموظفين (Employee Transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS employee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- advance (سلفة), absence (غياب), deduction (خصم), bonus (مكافأة), overtime (ساعات إضافية)
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    transaction_date DATE NOT NULL,
    description TEXT,
    is_processed BOOLEAN DEFAULT false, -- هل تم احتسابها في كشف الراتب
    payroll_id UUID, -- معرف كشف الراتب الذي تم فيه احتسابها
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employee_transactions_store_id ON employee_transactions(store_id);
CREATE INDEX idx_employee_transactions_employee_id ON employee_transactions(employee_id);
CREATE INDEX idx_employee_transactions_type ON employee_transactions(type);
CREATE INDEX idx_employee_transactions_date ON employee_transactions(transaction_date);
CREATE INDEX idx_employee_transactions_is_processed ON employee_transactions(is_processed);

-- ============================================
-- 12. جدول كشوف الرواتب (Payroll)
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2020),
    gross_salary DECIMAL(15, 2) NOT NULL DEFAULT 0, -- الراتب الأساسي
    total_advances DECIMAL(15, 2) DEFAULT 0, -- إجمالي السلف
    total_absences DECIMAL(15, 2) DEFAULT 0, -- إجمالي الغيابات
    total_deductions DECIMAL(15, 2) DEFAULT 0, -- إجمالي الخصومات
    total_bonuses DECIMAL(15, 2) DEFAULT 0, -- إجمالي المكافآت
    total_overtime DECIMAL(15, 2) DEFAULT 0, -- إجمالي الإضافي
    net_salary DECIMAL(15, 2) NOT NULL, -- الصافي
    currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    status VARCHAR(20) DEFAULT 'draft', -- draft, approved, paid
    notes TEXT,
    generated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, employee_id, period_month, period_year)
);

CREATE INDEX idx_payroll_store_id ON payroll(store_id);
CREATE INDEX idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(period_year, period_month);
CREATE INDEX idx_payroll_status ON payroll(status);

-- ============================================
-- 13. جدول التنبيهات (Alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- low_stock, invoice_due, subscription_expiring, payment_overdue, etc.
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50), -- invoice_in, invoice_out, inventory_item, employee, etc.
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_by UUID REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_store_id ON alerts(store_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- ============================================
-- 14. جدول سجل النشاطات (Audit Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_store_id ON audit_logs(store_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 15. جدول التقارير المخزنة (Reports Cache) - اختياري
-- ============================================
CREATE TABLE IF NOT EXISTS reports_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,
    params_hash VARCHAR(64) NOT NULL, -- MD5 hash of parameters
    data_json JSONB NOT NULL,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    UNIQUE(store_id, report_type, params_hash)
);

CREATE INDEX idx_reports_cache_store_id ON reports_cache(store_id);
CREATE INDEX idx_reports_cache_expires_at ON reports_cache(expires_at);

-- ============================================
-- 16. جدول الإعدادات (Settings)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, key)
);

CREATE INDEX idx_settings_store_id ON settings(store_id);
CREATE INDEX idx_settings_key ON settings(key);

-- ============================================
-- Triggers لتحديث updated_at تلقائياً
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_in_updated_at BEFORE UPDATE ON invoices_in FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_out_updated_at BEFORE UPDATE ON invoices_out FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Trigger لتحديث المخزون تلقائياً عند الحركات
-- ============================================
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'in' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock + NEW.quantity
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'out' THEN
        UPDATE inventory_items 
        SET current_stock = current_stock - NEW.quantity
        WHERE id = NEW.item_id;
    END IF;
    
    -- إنشاء تنبيه إذا أصبح المخزون أقل من الحد الأدنى
    IF EXISTS (
        SELECT 1 FROM inventory_items 
        WHERE id = NEW.item_id 
        AND current_stock <= min_stock
    ) THEN
        INSERT INTO alerts (store_id, type, severity, title, message, entity_type, entity_id)
        SELECT 
            store_id,
            'low_stock',
            'warning',
            'مخزون منخفض',
            'الصنف ' || name || ' أصبح المخزون أقل من الحد الأدنى',
            'inventory_item',
            id
        FROM inventory_items
        WHERE id = NEW.item_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_after_movement 
AFTER INSERT ON inventory_movements 
FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

-- ============================================
-- بيانات تجريبية (Seed Data)
-- ============================================

-- إنشاء متجر تجريبي
INSERT INTO stores (name, owner_name, owner_email, owner_phone, subscription_plan, subscription_expires_at)
VALUES (
    'متجر التجربة',
    'إبراهيم أحمد',
    'systemibrahem@gmail.com',
    '+963994054027',
    'trial',
    NOW() + INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- إنشاء مستخدم تجريبي (admin)
-- كلمة المرور: admin123 (مشفرة بـ argon2)
INSERT INTO users (store_id, username, password_hash, full_name, email, role, permissions)
SELECT 
    id,
    'admin',
    '$argon2id$v=19$m=65536,t=3,p=4$random$hash', -- يجب تغييرها
    'مدير النظام',
    'admin@system.com',
    'store_owner',
    '{
        "dashboard": ["read"],
        "invoices": ["read", "create", "update", "delete"],
        "inventory": ["read", "create", "update", "delete"],
        "employees": ["read", "create", "update", "delete"],
        "partners": ["read", "create", "update", "delete"],
        "reports": ["read", "export"],
        "settings": ["read", "update"],
        "users": ["read", "create", "update", "delete"]
    }'::jsonb
FROM stores WHERE owner_email = 'systemibrahem@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================
-- Views مفيدة للتقارير
-- ============================================

-- عرض الأرصدة حسب العملة
CREATE OR REPLACE VIEW v_balance_by_currency AS
SELECT 
    store_id,
    currency,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as total_incoming,
    COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN amount - paid_amount ELSE 0 END), 0) as pending_incoming
FROM invoices_in
GROUP BY store_id, currency
UNION ALL
SELECT 
    store_id,
    currency,
    COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) as total_outgoing,
    COALESCE(SUM(CASE WHEN payment_status = 'unpaid' THEN amount - paid_amount ELSE 0 END), 0) as pending_outgoing
FROM invoices_out
GROUP BY store_id, currency;

-- عرض المخزون المنخفض
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
    i.*,
    s.name as store_name
FROM inventory_items i
JOIN stores s ON i.store_id = s.id
WHERE i.current_stock <= i.min_stock
AND i.is_active = true;

-- ============================================
-- Functions للحماية والأمان
-- ============================================

-- دالة للتحقق من صلاحية الاشتراك
CREATE OR REPLACE FUNCTION check_subscription_validity(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_expiry TIMESTAMP WITH TIME ZONE;
    v_is_active BOOLEAN;
BEGIN
    SELECT subscription_expires_at, is_active 
    INTO v_expiry, v_is_active
    FROM stores 
    WHERE id = p_store_id;
    
    IF NOT v_is_active THEN
        RETURN FALSE;
    END IF;
    
    IF v_expiry IS NULL OR v_expiry < NOW() THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS) للحماية
-- ============================================

-- تفعيل RLS على الجداول الحساسة
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- سياسة: كل متجر يرى بياناته فقط
CREATE POLICY store_isolation_policy ON users
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy ON invoices_in
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy ON invoices_out
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy ON inventory_items
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy ON employees
    USING (store_id = current_setting('app.current_store_id')::UUID);

CREATE POLICY store_isolation_policy ON partners
    USING (store_id = current_setting('app.current_store_id')::UUID);

-- ============================================
-- النهاية
-- ============================================

