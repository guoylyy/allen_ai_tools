-- =============================================
-- 家庭管理数据库操作脚本
-- =============================================

-- 场景1: 你还不知道自己的 openid，需要先查询
-- 执行此SQL查看所有用户，找到你自己的记录
SELECT id, openid, phone, nickname, is_admin, is_active, family_id 
FROM users;

-- =============================================

-- 场景2: 知道自己的 openid，直接把自己设为管理员
-- 把下面的 'your_openid_here' 替换成你的实际 openid
UPDATE users 
SET is_admin = 1 
WHERE openid = 'your_openid_here';

-- 或者根据手机号设置（如果已绑定手机号）
UPDATE users 
SET is_admin = 1 
WHERE phone = 'your_phone_number';

-- =============================================

-- 场景3: 完全从头开始（删除旧数据，重新创建）
-- 警告：此操作会删除所有数据，请谨慎使用！

-- 1. 删除表（如果需要重新创建）
DROP TABLE IF EXISTS family_members;
DROP TABLE IF EXISTS families;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS album_photos;

-- 2. 重新运行数据库迁移后，创建一个新用户作为管理员
INSERT INTO users (openid, phone, password, is_admin, is_active) 
VALUES ('your_openid', 'your_phone', '123456', 1, 1);

-- 3. 创建家庭
INSERT INTO families (name, invite_code) 
SELECT '我的家庭', UPPER(SUBSTRING(MD5(RAND()), 1, 8))
WHERE NOT EXISTS (SELECT 1 FROM families);

-- 4. 获取刚创建的家庭ID，并关联用户
UPDATE users u
JOIN families f ON 1=1
SET u.family_id = f.id
WHERE u.openid = 'your_openid';

-- 5. 创建孩子（如果还没有）
INSERT INTO children (name, birthday, gender) 
SELECT '郭路谦', '2026-01-01', 'male'
WHERE NOT EXISTS (SELECT 1 FROM children WHERE name = '郭路谦');

-- 6. 获取孩子ID，并添加到家庭成员
INSERT INTO family_members (family_id, user_id, child_id, role, is_admin, status)
SELECT u.family_id, u.id, c.id, 'father', 1, 'active'
FROM users u, children c
WHERE u.openid = 'your_openid'
AND NOT EXISTS (
    SELECT 1 FROM family_members 
    WHERE family_id = u.family_id AND user_id = u.id
);

-- =============================================

-- 查看当前家庭成员
SELECT 
    u.id,
    u.phone,
    u.is_admin,
    u.is_active,
    fm.role,
    fm.status,
    f.invite_code
FROM users u
LEFT JOIN family_members fm ON u.id = fm.user_id
LEFT JOIN families f ON u.family_id = f.id
WHERE u.family_id IS NOT NULL;

-- =============================================

-- 设置普通成员为管理员（需要知道该用户的ID）
-- 把 123 替换成要提升为管理员的用户ID
UPDATE family_members 
SET is_admin = 1 
WHERE id = 123;

-- 同时更新 users 表
UPDATE users 
SET is_admin = 1 
WHERE id = (
    SELECT user_id FROM family_members WHERE id = 123
);

-- 或者一起更新
UPDATE users u, family_members fm
SET u.is_admin = 1, fm.is_admin = 1
WHERE u.id = fm.user_id AND fm.id = 123;

-- =============================================

-- 快速设置：假设你的用户ID是1（通常是第一个用户）
UPDATE users SET is_admin = 1 WHERE id = 1;
UPDATE family_members SET is_admin = 1 WHERE user_id = 1;

-- =============================================
