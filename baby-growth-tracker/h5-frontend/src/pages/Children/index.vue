<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 状态
const loading = ref(false)
const children = ref([])
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingChild = ref(null)
const currentChildId = ref(null)

// 添加表单
const addForm = ref({
  name: '',
  birthday: '',
  gender: 'male',
  avatar: ''
})

// 性别选项
const genderOptions = [
  { value: 'male', label: '男', icon: '👶🏻' },
  { value: 'female', label: '女', icon: '👶🏼' }
]

// 头像选项
const avatarOptions = ['👶🏻', '👦', '👧', '🧒', '🐰', '🐻', '🐼', '🦊', '🐯', '🦁']

// 初始化
onMounted(async () => {
  await loadChildren()
})

// 加载孩子列表
async function loadChildren() {
  loading.value = true
  try {
    children.value = await api.getChildren()
    console.log('孩子列表:', children.value)
  } catch (error) {
    console.error('加载孩子列表失败:', error)
    // 如果没有数据，显示空状态
    children.value = []
  } finally {
    loading.value = false
  }
}

// 计算年龄
function calculateAge(birthday) {
  if (!birthday) return '未知'
  
  const birth = new Date(birthday)
  const now = new Date()
  
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const days = now.getDate() - birth.getDate()
  
  let ageStr = ''
  if (years > 0) {
    ageStr += `${years}岁`
  }
  if (months > 0) {
    ageStr += `${months}个月`
  }
  if (days > 0 && years === 0) {
    ageStr += `${days}天`
  }
  
  return ageStr || '0岁'
}

// 获取性别图标
function getGenderIcon(gender) {
  const option = genderOptions.find(g => g.value === gender)
  return option ? option.icon : '👶'
}

// 添加孩子
async function handleAddChild() {
  if (!addForm.value.name) {
    alert('请输入孩子姓名')
    return
  }
  
  loading.value = true
  try {
    await api.addChild({
      name: addForm.value.name,
      birthday: addForm.value.birthday,
      gender: addForm.value.gender,
      avatar: addForm.value.avatar
    })
    
    alert('添加成功！')
    
    // 清空表单
    addForm.value = { name: '', birthday: '', gender: 'male', avatar: '' }
    showAddModal.value = false
    
    // 刷新列表
    await loadChildren()
  } catch (error) {
    alert(error.message || '添加失败')
  } finally {
    loading.value = false
  }
}

// 打开编辑弹窗
function openEditModal(child) {
  editingChild.value = { ...child }
  showEditModal.value = true
}

// 保存编辑
async function handleSaveChild() {
  if (!editingChild.value.name) {
    alert('请输入孩子姓名')
    return
  }
  
  loading.value = true
  try {
    await api.updateChild(editingChild.value.id, {
      name: editingChild.value.name,
      birthday: editingChild.value.birthday,
      gender: editingChild.value.gender,
      avatar: editingChild.value.avatar
    })
    
    alert('保存成功！')
    showEditModal.value = false
    editingChild.value = null
    
    // 刷新列表
    await loadChildren()
  } catch (error) {
    alert(error.message || '保存失败')
  } finally {
    loading.value = false
  }
}

// 删除孩子
async function handleDeleteChild(child) {
  if (!confirm(`确定要删除「${child.name}」吗？删除后无法恢复。`)) return
  
  loading.value = true
  try {
    await api.deleteChild(child.id)
    alert('删除成功')
    
    // 刷新列表
    await loadChildren()
  } catch (error) {
    alert(error.message || '删除失败')
  } finally {
    loading.value = false
  }
}

// 设置当前抚养的孩子
async function setCurrentChild(child) {
  try {
    await userStore.switchChild(child.id)
    currentChildId.value = child.id
    alert(`已切换为「${child.name}」的数据`)
  } catch (error) {
    alert(error.message || '切换失败')
  }
}

// 判断是否是当前孩子
function isCurrentChild(child) {
  return currentChildId.value === child.id || userStore.currentChild?.id === child.id
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- 头部 -->
    <header class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
      <div class="flex items-center gap-3">
        <button @click="router.push('/profile')" class="text-white">
          <span class="text-xl">←</span>
        </button>
        <h1 class="text-xl font-bold">孩子管理</h1>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading && children.length === 0" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>

    <!-- 内容 -->
    <template v-else>
      <!-- 添加按钮 -->
      <section class="px-4 pt-4">
        <button
          @click="showAddModal = true"
          class="w-full py-3 bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>添加孩子</span>
        </button>
      </section>

      <!-- 孩子卡片列表 -->
      <section class="p-4">
        <h3 class="text-sm font-medium text-gray-500 mb-3">孩子列表 ({{ children.length }})</h3>
        
        <div class="grid grid-cols-1 gap-4">
          <div
            v-for="child in children"
            :key="child.id"
            class="card"
          >
            <!-- 卡片头部 -->
            <div class="flex items-start gap-4">
              <!-- 头像 -->
              <div 
                class="w-16 h-16 rounded-full bg-blue-100 text-4xl flex items-center justify-center flex-shrink-0"
              >
                {{ child.avatar || getGenderIcon(child.gender) }}
              </div>
              
              <!-- 信息 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-lg font-semibold">{{ child.name }}</h4>
                  <span class="text-sm text-gray-500">
                    {{ child.gender === 'male' ? '👦' : '👧' }}
                  </span>
                </div>
                
                <div class="mt-1 space-y-1 text-sm text-gray-500">
                  <p v-if="child.birthday">
                    生日: {{ child.birthday }} ({{ calculateAge(child.birthday) }})
                  </p>
                  <p v-else>
                    生日: 未设置
                  </p>
                </div>
              </div>
              
              <!-- 编辑按钮 -->
              <button
                @click="openEditModal(child)"
                class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <span class="text-xl">✏️</span>
              </button>
            </div>
            
            <!-- 当前孩子标识和设置 -->
            <div class="mt-4 pt-4 border-t">
              <div v-if="isCurrentChild(child)" class="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-600 rounded-lg mb-3">
                <span class="text-lg">✓</span>
                <span class="text-sm font-medium">当前抚养的孩子</span>
              </div>
              <div class="flex gap-3">
                <button
                  @click="setCurrentChild(child)"
                  class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                >
                  {{ isCurrentChild(child) ? '已设为当前' : '设为当前' }}
                </button>
                <button
                  @click="router.push(`/report?child_id=${child.id}`)"
                  class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                >
                  查看报表
                </button>
                <button
                  @click="router.push(`/record?child_id=${child.id}`)"
                  class="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                >
                  录入记录
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="children.length === 0" class="text-center py-16">
          <div class="text-6xl mb-4">👶</div>
          <p class="text-gray-500 mb-2">还没有添加孩子</p>
          <p class="text-sm text-gray-400">点击上方按钮添加孩子信息</p>
        </div>
      </section>
    </template>

    <!-- 添加孩子弹窗 -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-white rounded-t-xl w-full max-w-md p-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h3 class="font-semibold text-lg mb-4">添加孩子</h3>
        
        <!-- 姓名 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">姓名 *</label>
          <input
            v-model="addForm.name"
            type="text"
            placeholder="请输入孩子姓名"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- 性别 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-2">性别</label>
          <div class="flex gap-4">
            <button
              v-for="gender in genderOptions"
              :key="gender.value"
              @click="addForm.gender = gender.value"
              class="flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors"
              :class="addForm.gender === gender.value ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'"
            >
              <span class="text-2xl">{{ gender.icon }}</span>
              <span>{{ gender.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- 生日 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">生日</label>
          <input
            v-model="addForm.birthday"
            type="date"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- 头像选择 -->
        <div class="mb-6">
          <label class="block text-sm text-gray-600 mb-2">头像</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar"
              @click="addForm.avatar = avatar"
              class="w-12 h-12 rounded-full bg-gray-100 text-2xl flex items-center justify-center transition-colors"
              :class="addForm.avatar === avatar ? 'ring-2 ring-blue-500 bg-blue-50' : ''"
            >
              {{ avatar }}
            </button>
          </div>
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
            @click="handleAddChild"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {{ loading ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑孩子弹窗 -->
    <div
      v-if="showEditModal && editingChild"
      class="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
      @click.self="showEditModal = false"
    >
      <div class="bg-white rounded-t-xl w-full max-w-md p-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-lg">编辑孩子信息</h3>
          <button
            @click="handleDeleteChild(editingChild)"
            class="text-red-500 text-sm"
          >
            删除孩子
          </button>
        </div>
        
        <!-- 姓名 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">姓名 *</label>
          <input
            v-model="editingChild.name"
            type="text"
            placeholder="请输入孩子姓名"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- 性别 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-2">性别</label>
          <div class="flex gap-4">
            <button
              v-for="gender in genderOptions"
              :key="gender.value"
              @click="editingChild.gender = gender.value"
              class="flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-colors"
              :class="editingChild.gender === gender.value ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'"
            >
              <span class="text-2xl">{{ gender.icon }}</span>
              <span>{{ gender.label }}</span>
            </button>
          </div>
        </div>
        
        <!-- 生日 -->
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">生日</label>
          <input
            v-model="editingChild.birthday"
            type="date"
            class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <!-- 头像选择 -->
        <div class="mb-6">
          <label class="block text-sm text-gray-600 mb-2">头像</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="avatar in avatarOptions"
              :key="avatar"
              @click="editingChild.avatar = avatar"
              class="w-12 h-12 rounded-full bg-gray-100 text-2xl flex items-center justify-center transition-colors"
              :class="editingChild.avatar === avatar ? 'ring-2 ring-blue-500 bg-blue-50' : ''"
            >
              {{ avatar }}
            </button>
          </div>
        </div>
        
        <!-- 按钮 -->
        <div class="flex gap-3">
          <button
            @click="showEditModal = false"
            class="flex-1 px-4 py-2 border rounded-lg text-gray-600"
          >
            取消
          </button>
          <button
            @click="handleSaveChild"
            :disabled="loading"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
