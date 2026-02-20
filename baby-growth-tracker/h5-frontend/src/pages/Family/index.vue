<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/api'

const router = useRouter()
const route = useRoute()

// 状态
const loading = ref(false)
const familyInfo = ref(null)
const familyMembers = ref([])
const isAdmin = ref(false)
const showAddModal = ref(false)
const showInviteModal = ref(false)
const showEditModal = ref(false)
const selectedMember = ref(null)

// 添加成员表单
const addForm = ref({
  phone: '',
  role: 'father',
  isAdmin: false
})

// 角色选项
const roleOptions = [
  { value: 'father', label: '父亲', avatar: '👨' },
  { value: 'mother', label: '母亲', avatar: '👩' },
  { value: 'grandpa', label: '爷爷', avatar: '👴' },
  { value: 'grandma', label: '奶奶', avatar: '👵' },
  { value: 'grandpa_m', label: '外公', avatar: '👴' },
  { value: 'grandma_m', label: '外婆', avatar: '👵' },
  { value: 'uncle', label: '叔叔/舅舅', avatar: '👨' },
  { value: 'aunt', label: '姑姑/姨姨', avatar: '👩' },
  { value: 'nanny', label: '育婴师', avatar: '👶' },
  { value: 'other', label: '其他', avatar: '👤' }
]

// 初始化
onMounted(async () => {
  await loadFamilyData()
})

// 加载家庭数据
async function loadFamilyData() {
  loading.value = true
  try {
    // 获取家庭信息
    const info = await api.getFamilyInfo()
    familyInfo.value = info
    
    if (!info) {
      // 没有家庭，引导创建
      await createFamily()
      return
    }
    
    // 获取成员列表
    familyMembers.value = await api.getFamilyMembers()
    
    // 检查是否是管理员
    const adminCheck = await api.isFamilyAdmin()
    isAdmin.value = adminCheck?.isAdmin || false
    
  } catch (error) {
    console.error('加载家庭数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建家庭
async function createFamily() {
  try {
    await api.createFamily()
    await loadFamilyData()
  } catch (error) {
    console.error('创建家庭失败:', error)
  }
}

// 获取角色标签
function getRoleLabel(role) {
  const option = roleOptions.find(r => r.value === role)
  return option ? option.label : role
}

// 获取角色头像
function getRoleAvatar(role) {
  const option = roleOptions.find(r => r.value === role)
  return option ? option.avatar : '👤'
}

// 获取状态标签
function getStatusTag(status) {
  if (status === 'active') {
    return { text: '已激活', class: 'bg-green-100 text-green-600' }
  }
  return { text: '待激活', class: 'bg-yellow-100 text-yellow-600' }
}

// 获取权限标签
function getPermissionTag(isAdmin) {
  if (isAdmin) {
    return { text: '管理员', class: 'bg-purple-100 text-purple-600' }
  }
  return { text: '普通成员', class: 'bg-gray-100 text-gray-600' }
}

// 添加成员
async function handleAddMember() {
  if (!addForm.value.phone) {
    alert('请输入手机号')
    return
  }
  
  loading.value = true
  try {
    const result = await api.addFamilyMember(addForm.value)
    alert(`添加成功！\n手机号: ${addForm.value.phone}\n默认密码: ${result.defaultPassword}\n\n请将邀请链接发送给该成员`)
    
    // 清空表单
    addForm.value = { phone: '', role: 'father', isAdmin: false }
    showAddModal.value = false
    
    // 刷新列表
    familyMembers.value = await api.getFamilyMembers()
  } catch (error) {
    alert(error.message || '添加失败')
  } finally {
    loading.value = false
  }
}

// 生成邀请链接
async function handleGenerateInviteLink(phone) {
  loading.value = true
  try {
    const result = await api.generateInviteLink({ phone })
    
    // 显示邀请信息
    showInviteModal.value = true
    inviteInfo.value = result
  } catch (error) {
    alert(error.message || '生成邀请链接失败')
  } finally {
    loading.value = false
  }
}

// 邀请信息弹窗
const inviteInfo = ref(null)

// 复制邀请链接
function copyInviteLink() {
  navigator.clipboard.writeText(inviteInfo.value?.inviteLink)
  alert('已复制到剪贴板')
}

// 移除成员
async function handleRemoveMember(member) {
  if (!confirm(`确定要移除 ${member.phone} 吗？`)) return
  
  loading.value = true
  try {
    await api.removeMember(member.member_id)
    familyMembers.value = await api.getFamilyMembers()
    alert('移除成功')
  } catch (error) {
    alert(error.message || '移除失败')
  } finally {
    loading.value = false
  }
}

// 关闭邀请弹窗
function closeInviteModal() {
  showInviteModal.value = false
  inviteInfo.value = null
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- 头部 -->
    <header class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
      <div class="flex items-center gap-3">
        <button @click="router.push('/profile')" class="text-white">
          <span class="text-xl">←</span>
        </button>
        <h1 class="text-xl font-bold">家族成员管理</h1>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
    </div>

    <!-- 内容 -->
    <template v-else>
      <!-- 家庭信息 -->
      <section class="p-4">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold">我的家庭</h2>
              <p class="text-sm text-muted mt-1" v-if="familyInfo">
                邀请码: {{ familyInfo.invite_code }}
              </p>
            </div>
            <span 
              class="px-3 py-1 rounded-full text-sm"
              :class="isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'"
            >
              {{ isAdmin ? '管理员' : '普通成员' }}
            </span>
          </div>
        </div>
      </section>

      <!-- 管理员操作区 -->
      <section v-if="isAdmin" class="px-4 mb-4">
        <button
          @click="showAddModal = true"
          class="w-full py-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>添加家庭成员</span>
        </button>
      </section>

      <!-- 家庭成员列表 -->
      <section class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-3">家庭成员 ({{ familyMembers.length }})</h3>
        
        <div class="space-y-3">
          <div
            v-for="member in familyMembers"
            :key="member.member_id"
            class="card flex items-center gap-3"
          >
            <!-- 头像 -->
            <div class="w-12 h-12 rounded-full bg-gray-100 text-2xl flex items-center justify-center">
              {{ getRoleAvatar(member.role) }}
            </div>
            
            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium truncate">
                  {{ member.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}
                </p>
                <span 
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="getStatusTag(member.status).class"
                >
                  {{ getStatusTag(member.status).text }}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-sm text-gray-500">{{ getRoleLabel(member.role) }}</span>
                <span 
                  v-if="member.is_admin"
                  class="px-2 py-0.5 rounded-full text-xs"
                  :class="getPermissionTag(true).class"
                >
                  {{ getPermissionTag(true).text }}
                </span>
              </div>
            </div>
            
            <!-- 管理员操作 -->
            <div v-if="isAdmin && member.status === 'pending'" class="flex gap-2">
              <button
                @click="handleGenerateInviteLink(member.phone)"
                class="px-3 py-1 bg-green-500 text-white text-sm rounded"
              >
                邀请
              </button>
              <button
                @click="handleRemoveMember(member)"
                class="px-3 py-1 bg-red-500 text-white text-sm rounded"
              >
                移除
              </button>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="familyMembers.length === 0" class="text-center py-10 text-gray-500">
          <p>暂无家庭成员</p>
          <p class="text-sm mt-2">点击上方按钮添加家庭成员</p>
        </div>
      </section>

      <!-- 权限说明 -->
      <section class="p-4">
        <div class="card bg-blue-50 border border-blue-200">
          <h4 class="font-semibold text-blue-600 mb-2">权限说明</h4>
          <ul class="text-sm text-blue-600 space-y-1">
            <li>• <strong>管理员</strong>：可以添加/移除成员、录入记录、查看所有数据</li>
            <li>• <strong>普通成员</strong>：只能查看数据，不能邀请新人</li>
            <li>• 新成员需要通过邀请链接激活账号</li>
            <li>• 初始密码为 <strong>123456</strong>，首次登录后可修改</li>
          </ul>
        </div>
      </section>
    </template>

    <!-- 添加成员弹窗 -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-t-xl w-full max-w-md p-4 animate-slide-up">
        <h3 class="font-semibold text-lg mb-4">添加家庭成员</h3>
        
        <!-- 手机号 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">手机号</label>
          <input
            v-model="addForm.phone"
            type="tel"
            placeholder="请输入手机号"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <!-- 关系 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-2">与孩子关系</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              @click="addForm.role = role.value"
              class="flex flex-col items-center p-2 rounded-lg border transition-colors"
              :class="addForm.role === role.value ? 'border-green-500 bg-green-50' : 'border-gray-200'"
            >
              <span class="text-xl">{{ role.avatar }}</span>
              <span class="text-xs mt-1">{{ role.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- 权限 -->
        <div class="mb-6">
          <label class="flex items-center gap-3">
            <input
              v-model="addForm.isAdmin"
              type="checkbox"
              class="w-5 h-5 text-green-500"
            />
            <span>设为管理员</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">管理员可以添加/移除成员</p>
        </div>
        
        <!-- 按钮 -->
        <div class="flex gap-3">
          <button
            @click="showAddModal = false"
            class="flex-1 px-4 py-2 border rounded-lg text-gray-600"
          >
            取消
          </button>
          <button
            @click="handleAddMember"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          >
            {{ loading ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 邀请链接弹窗 -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="closeInviteModal"
    >
      <div class="bg-white rounded-xl w-full max-w-sm p-4">
        <h3 class="font-semibold text-lg mb-4">邀请链接</h3>
        
        <div class="bg-gray-100 rounded-lg p-3 mb-4">
          <p class="text-sm text-gray-600 mb-1">手机号</p>
          <p class="font-medium">{{ inviteInfo?.phone }}</p>
        </div>
        
        <div class="bg-gray-100 rounded-lg p-3 mb-4">
          <p class="text-sm text-gray-600 mb-1">默认密码</p>
          <p class="font-medium font-mono">{{ inviteInfo?.defaultPassword }}</p>
        </div>
        
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-green-600 mb-2">邀请链接（点击复制）</p>
          <button
            @click="copyInviteLink"
            class="text-xs text-green-700 break-all text-left hover:underline"
          >
            {{ inviteInfo?.inviteLink }}
          </button>
        </div>
        
        <p class="text-xs text-gray-500 mb-4">
          请将邀请链接发送给家庭成员，对方点击链接后使用手机号和密码登录即可激活账号。
        </p>
        
        <button
          @click="closeInviteModal"
          class="w-full px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          我知道了
        </button>
      </div>
    </div>
  </div>
</template>
