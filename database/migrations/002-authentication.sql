CREATE SCHEMA IF NOT EXISTS security;

CREATE TABLE IF NOT EXISTS security.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name_en VARCHAR(150) NOT NULL,
    name_ar VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security.role_permissions (
    role_id UUID NOT NULL REFERENCES security.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES security.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS security.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name_en VARCHAR(150) NOT NULL,
    display_name_ar VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES security.roles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON security.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON security.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON security.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON security.users(LOWER(username));

INSERT INTO security.roles (code, name_en, name_ar, is_system)
VALUES
    ('admin', 'System Administrator', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…', TRUE),
    ('planner', 'Operational Planner', 'Ù…Ø®Ø·Ø· Ø¹Ù…Ù„ÙŠØ§Øª', TRUE),
    ('controller', 'Exercise Controller', 'Ù…Ø±Ø§Ù‚Ø¨ Ø§Ù„ØªÙ…Ø±ÙŠÙ†', TRUE),
    ('viewer', 'Read Only User', 'Ù…Ø³ØªØ®Ø¯Ù… Ù„Ù„Ø¹Ø±Ø¶ ÙÙ‚Ø·', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO security.permissions (code, name_en, name_ar)
VALUES
    ('system.manage', 'Manage system settings', 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù…'),
    ('users.manage', 'Manage users', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†'),
    ('projects.create', 'Create projects', 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª'),
    ('projects.read', 'View projects', 'Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª'),
    ('projects.update', 'Update projects', 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª'),
    ('projects.delete', 'Delete projects', 'Ø­Ø°Ù Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª'),
    ('map.edit', 'Edit map content', 'ØªØ¹Ø¯ÙŠÙ„ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©'),
    ('map.read', 'View map content', 'Ø¹Ø±Ø¶ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©')
ON CONFLICT (code) DO NOTHING;

INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
CROSS JOIN security.permissions p
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
JOIN security.permissions p ON p.code IN (
    'projects.create', 'projects.read', 'projects.update', 'map.edit', 'map.read'
)
WHERE r.code IN ('planner', 'controller')
ON CONFLICT DO NOTHING;

INSERT INTO security.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM security.roles r
JOIN security.permissions p ON p.code IN ('projects.read', 'map.read')
WHERE r.code = 'viewer'
ON CONFLICT DO NOTHING;