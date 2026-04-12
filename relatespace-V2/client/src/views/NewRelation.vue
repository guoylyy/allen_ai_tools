<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/" class="btn-secondary w-9 h-9 flex items-center justify-center">
            <i class="fas fa-arrow-left text-sm"></i>
          </router-link>
          <span class="font-semibold">新增关系人</span>
        </div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- 基本信息 -->
        <div class="card-shadow rounded-xl p-5">
          <h2 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <i class="fas fa-user text-gray-400"></i> 基本信息
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input v-model="form.name" type="text" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">职位</label>
                <input v-model="form.position" type="text" placeholder="CEO/总监/经理..."
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">公司</label>
                <input v-model="form.company" type="text" placeholder="公司名称"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input v-model="form.phone" type="tel" placeholder="138****8888"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input v-model="form.email" type="email" placeholder="email@example.com"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>
        </div>

        <!-- 标签 -->
        <div class="card-shadow rounded-xl p-5">
          <h2 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <i class="fas fa-tags text-gray-400"></i> 标签
          </h2>
          
          <div class="flex flex-wrap gap-2">
            <button type="button" v-for="tag in availableTags" :key="tag"
                    @click="toggleTag(tag)"
                    class="px-3 py-1.5 rounded-full text-sm transition-all"
                    :class="form.tags.includes(tag) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 重要性 -->
        <div class="card-shadow rounded-xl p-5">
          <h2 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <i class="fas fa-star text-gray-400"></i> 重要性
          </h2>
          
          <div class="flex gap-3">
            <button type="button" v-for="opt in importanceOptions" :key="opt.value"
                    @click="form.importance = opt.value"
                    class="flex-1 py-3 rounded-lg text-sm font-medium transition-all border-2"
                    :class="form.importance === opt.value ? opt.activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300'">
              <i :class="opt.icon" class="mr-1"></i>{{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="card-shadow rounded-xl p-5">
          <h2 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <i class="fas fa-info-circle text-gray-400"></i> 详细信息
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">背景</label>
              <textarea v-model="form.background" rows="2" placeholder="个人背景介绍..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">特点</label>
              <textarea v-model="form.features" rows="2" placeholder="性格特点、沟通风格..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">目标</label>
              <textarea v-model="form.goals" rows="2" placeholder="当前关注点、合作意向..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2focus:ring-blue-500"></textarea>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" :disabled="saving"
                class="w-full btn-primary py-3 text-base font-medium disabled:opacity-50">
          <i v-if="saving" class="fas fa-spinner fa-spin mr-2"></i>
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useRelationStore } from '../stores/relations'

const router = useRouter()
const store = useRelationStore()

const saving = ref(false)

const availableTags = ['客户', '供应商', '合作伙伴', '朋友', '员工', '投资人', '创业者', '政府关系']

const importanceOptions = [
  { value: 'high', label: '重要', icon: 'fas fa-star', activeClass: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { value: 'normal', label: '普通', icon: 'fas fa-user', activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'low', label: '冷淡', icon: 'fas fa-user-minus', activeClass: 'border-gray-400 bg-gray-100 text-gray-600' }
]

const form = reactive({
  name: '',
  position: '',
  company: '',
  phone: '',
  email: '',
  tags: [],
  importance: 'normal',
  background: '',
  features: '',
  goals: ''
})

function toggleTag(tag) {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  } else {
    form.tags.push(tag)
  }
}

async function handleSubmit() {
  if (!form.name.trim()) {
    alert('请输入姓名')
    return
  }
  
  saving.value = true
  try {
    const id = await store.createRelation({ ...form })
    router.push(`/relation/${id}`)
  } catch (err) {
    alert('保存失败: ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>
