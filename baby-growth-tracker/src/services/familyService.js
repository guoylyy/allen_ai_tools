const crypto = require('crypto');

// 生成随机邀请码
const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// 默认密码
const DEFAULT_PASSWORD = '123456';

class FamilyService {
  constructor(db) {
    this.db = db;
  }

  // 辅助方法：执行查询
  async query(sql, params = []) {
    return await this.db.connection.query(sql, params);
  }

  // 创建或获取家庭
  async getOrCreateFamily(userId) {
    // 检查用户是否已有家庭
    const [families] = await this.query(
      'SELECT f.* FROM families f JOIN users u ON u.family_id = f.id WHERE u.id = ?',
      [userId]
    );

    if (families.length > 0) {
      return families[0];
    }

    // 创建新家庭
    const inviteCode = generateInviteCode();
    const [result] = await this.query(
      'INSERT INTO families (name, invite_code) VALUES (?, ?)',
      ['我的家庭', inviteCode]
    );

    // 更新用户的家庭ID并设为管理员
    await this.query(
      'UPDATE users SET family_id = ?, is_admin = 1 WHERE id = ?',
      [result.insertId, userId]
    );

    // 为没有家庭的孩子设置 family_id（如果有孩子的话）
    await this.query(
      'UPDATE children SET family_id = ? WHERE family_id IS NULL LIMIT 1',
      [result.insertId]
    );

    return { id: result.insertId, name: '我的家庭', invite_code: inviteCode };
  }

  // 获取用户家庭信息
  async getFamilyInfo(userId) {
    const [families] = await this.query(
      'SELECT f.*, u.is_admin FROM families f JOIN users u ON u.family_id = f.id WHERE u.id = ?',
      [userId]
    );
    return families[0] || null;
  }

  // 获取家庭成员列表
  async getFamilyMembers(userId) {
    const familyId = await this.getFamilyId(userId);
    if (!familyId) return [];

    const [members] = await this.query(
      `SELECT u.id, u.nickname, u.avatar, u.phone, u.is_admin, u.is_active,
       fm.role, fm.status, fm.id as member_id, fm.created_at
       FROM users u
       JOIN family_members fm ON u.id = fm.user_id
       WHERE fm.family_id = ?
       ORDER BY fm.created_at ASC`,
      [familyId]
    );

    return members;
  }

  // 添加家庭成员（通过手机号）
  async addFamilyMember(adminId, data) {
    const { phone, role, isAdmin = false } = data;
    const familyId = await this.getFamilyId(adminId);
    
    if (!familyId) {
      throw new Error('您还没有创建家庭');
    }

    // 检查操作者是否是管理员
    const [admins] = await this.query(
      'SELECT is_admin FROM users WHERE id = ? AND family_id = ?',
      [adminId, familyId]
    );
    
    if (!admins.length || !admins[0].is_admin) {
      throw new Error('只有管理员可以添加家庭成员');
    }

    // 检查手机号是否已存在
    const [existingUsers] = await this.query(
      'SELECT id, family_id FROM users WHERE phone = ?',
      [phone]
    );

    let userId;
    let isNewUser = false;

    if (existingUsers.length > 0) {
      // 用户已存在
      userId = existingUsers[0].id;
      
      if (existingUsers[0].family_id && existingUsers[0].family_id !== familyId) {
        throw new Error('该用户已加入其他家庭');
      }

      // 检查是否已在当前家庭
      const [existingMembers] = await this.query(
        'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (existingMembers.length > 0) {
        throw new Error('该用户已在家庭中');
      }
    } else {
      // 创建新用户（随机生成openid）
      const randomOpenid = 'user_' + Math.random().toString(36).substring(2, 15)
      const [result] = await this.query(
        'INSERT INTO users (openid, phone, password, invited_by, is_active) VALUES (?, ?, ?, ?, 0)',
        [randomOpenid, phone, DEFAULT_PASSWORD, adminId]
      );
      userId = result.insertId;
      isNewUser = true;
    }

    // 添加到家庭成员表
    const [result] = await this.query(
      'INSERT INTO family_members (family_id, user_id, role, is_admin, status) VALUES (?, ?, ?, ?, ?)',
      [familyId, userId, role, isAdmin ? 1 : 0, isNewUser ? 'pending' : 'active']
    );

    // 更新用户的家庭ID
    await this.query(
      'UPDATE users SET family_id = ? WHERE id = ?',
      [familyId, userId]
    );

    return {
      memberId: result.insertId,
      userId,
      isNewUser,
      defaultPassword: DEFAULT_PASSWORD
    };
  }

  // 生成邀请链接
  async generateInviteLink(adminId, phone) {
    const familyId = await this.getFamilyId(adminId);
    if (!familyId) {
      throw new Error('您还没有创建家庭');
    }

    // 检查是否是管理员
    const [admins] = await this.query(
      'SELECT is_admin FROM users WHERE id = ? AND family_id = ?',
      [adminId, familyId]
    );
    
    if (!admins.length || !admins[0].is_admin) {
      throw new Error('只有管理员可以生成邀请链接');
    }

    // 检查手机号是否存在
    const [users] = await this.query(
      'SELECT id FROM users WHERE phone = ? AND family_id = ?',
      [phone, familyId]
    );

    if (users.length === 0) {
      throw new Error('请先添加该家庭成员');
    }

    // 生成邀请码
    const inviteCode = generateInviteCode();
    await this.query(
      'UPDATE families SET invite_code = ? WHERE id = ?',
      [inviteCode, familyId]
    );

    // 加密手机号和密码（使用base64）
    const encodedPhone = Buffer.from(phone).toString('base64');
    
    // 获取用户密码
    const [userInfo] = await this.query(
      'SELECT password FROM users WHERE phone = ?',
      [phone]
    );

    const encodedPassword = userInfo.length > 0 
      ? Buffer.from(userInfo[0].password).toString('base64')
      : Buffer.from(DEFAULT_PASSWORD).toString('base64');

    const inviteLink = `https://yourapp.com/login?phone=${encodedPhone}&password=${encodedPassword}&invite=${inviteCode}`;

    return {
      inviteLink,
      inviteCode,
      phone,
      defaultPassword: DEFAULT_PASSWORD
    };
  }

  // 通过邀请链接激活用户
  async activateUserByInvite(phone, password, inviteCode) {
    // 验证邀请码
    const [families] = await this.query(
      'SELECT id FROM families WHERE invite_code = ?',
      [inviteCode]
    );

    if (families.length === 0) {
      throw new Error('邀请链接无效');
    }

    const familyId = families[0].id;

    // 验证用户
    const [users] = await this.query(
      'SELECT * FROM users WHERE phone = ? AND password = ?',
      [phone, password]
    );

    if (users.length === 0) {
      throw new Error('手机号或密码错误');
    }

    // 激活用户
    await this.query(
      'UPDATE users SET is_active = 1, family_id = ? WHERE id = ?',
      [familyId, users[0].id]
    );

    // 更新家庭成员状态
    await this.query(
      'UPDATE family_members SET status = ? WHERE user_id = ? AND family_id = ?',
      ['active', users[0].id, familyId]
    );

    return { success: true, message: '激活成功' };
  }

  // 检查用户是否是家庭管理员
  async isFamilyAdmin(userId) {
    const [result] = await this.query(
      'SELECT is_admin FROM users WHERE id = ? AND is_admin = 1',
      [userId]
    );
    return result.length > 0;
  }

  // 检查用户是否已激活
  async isUserActive(userId) {
    const [result] = await this.query(
      'SELECT is_active FROM users WHERE id = ?',
      [userId]
    );
    return result.length > 0 && result[0].is_active;
  }

  // 获取用户的家庭ID
  async getFamilyId(userId) {
    const [result] = await this.query(
      'SELECT family_id FROM users WHERE id = ?',
      [userId]
    );
    return result.length > 0 ? result[0].family_id : null;
  }

  // 用户用手机号密码登录
  async loginByPhone(phone, password) {
    const [users] = await this.query(
      'SELECT * FROM users WHERE phone = ? AND password = ?',
      [phone, password]
    );

    if (users.length === 0) {
      throw new Error('手机号或密码错误');
    }

    return users[0];
  }

  // 更新家庭成员角色
  async updateMemberRole(adminId, memberId, data) {
    const { role, isAdmin } = data;
    const familyId = await this.getFamilyId(adminId);

    // 检查是否是管理员
    const [admins] = await this.query(
      'SELECT is_admin FROM users WHERE id = ? AND family_id = ?',
      [adminId, familyId]
    );
    
    if (!admins.length || !admins[0].is_admin) {
      throw new Error('只有管理员可以修改成员权限');
    }

    await this.query(
      'UPDATE family_members SET role = ?, is_admin = ? WHERE id = ? AND family_id = ?',
      [role, isAdmin ? 1 : 0, memberId, familyId]
    );

    return { success: true };
  }

  // 移除家庭成员
  async removeMember(adminId, memberId) {
    const familyId = await this.getFamilyId(adminId);

    // 检查是否是管理员
    const [admins] = await this.query(
      'SELECT is_admin FROM users WHERE id = ? AND family_id = ?',
      [adminId, familyId]
    );
    
    if (!admins.length || !admins[0].is_admin) {
      throw new Error('只有管理员可以移除家庭成员');
    }

    // 不能移除自己
    const [members] = await this.query(
      'SELECT user_id FROM family_members WHERE id = ? AND family_id = ?',
      [memberId, familyId]
    );

    if (members.length > 0 && members[0].user_id === adminId) {
      throw new Error('不能移除自己');
    }

    await this.query(
      'DELETE FROM family_members WHERE id = ? AND family_id = ?',
      [memberId, familyId]
    );

    return { success: true };
  }

  // 获取用户的孩子列表（关联到家庭的）
  async getChildrenByFamily(userId) {
    const familyId = await this.getFamilyId(userId);
    if (!familyId) return [];

    // 直接从 children 表根据 family_id 查询
    const [children] = await this.query(
      'SELECT * FROM children WHERE family_id = ?',
      [familyId]
    );

    return children;
  }

  // 关联孩子到家庭
  async addChildToFamily(userId, childId) {
    const familyId = await this.getFamilyId(userId);
    if (!familyId) {
      throw new Error('您还没有家庭');
    }

    // 直接更新孩子的 family_id
    await this.query(
      'UPDATE children SET family_id = ? WHERE id = ?',
      [familyId, childId]
    );

    return { success: true };
  }
}

module.exports = FamilyService;
