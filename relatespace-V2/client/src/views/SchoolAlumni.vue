<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="router.back()" class="btn-secondary w-9 h-9 flex items-center justify-center">
            <i class="fas fa-arrow-left text-sm"></i>
          </button>
          <span class="text-sm text-gray-500">返回</span>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-6" v-if="school">
      <!-- 学校信息卡片 -->
      <div class="card-shadow rounded-xl p-6 mb-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-university text-white text-2xl"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold">{{ school.name }}</h1>
            <p class="text-sm text-gray-500">
              <span class="mr-3">{{ getSchoolTypeName(school.type) }}</span>
              <span v-if="school.location"><i class="fas fa-map-marker-alt mr-1"></i>{{ school.location }}</span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">{{ alumni.length }}</div>
            <div class="text-xs text-gray-500">校友总数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">{{ degreeStats.bachelor }}</div>
            <div class="text-xs text-gray-500">本科</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">{{ degreeStats.master }}</div>
            <div class="text-xs text-gray-500">硕士</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">{{ degreeStats.doctoral }}</div>
            <div class="text-xs text-gray-500">博士</div>
          </div>
        </div>
      </div>

      <!-- 校友列表 -->
      <div class="mb-4">
        <h2 class="text-lg font-semibold mb-3">校友列表</h2>
      </div>

      <div class="space-y-3" v-if="alumni.length">
        <router-link
          v-for="person in alumni"
          :key="person.id"
          :to="`/relation/${person.id}`"
          class="relation-card block"
        >
          <div class="flex items-center gap-3">
            <div class="avatar w-12 h-12 text-lg" :style="getAvatarStyle(person.name)">
              {{ person.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">{{ person.name }}</h3>
                <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                  {{ getDegreeName(person.degree) }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ person.position }} · {{ person.company }}</p>
              <p v-if="person.major" class="text-xs text-gray-400 mt-1">
                <i class="fas fa-book mr-1"></i>{{ person.major }}
                <span v-if="person.startYear && person.endYear" class="ml-2">
                  {{ person.startYear }} - {{ person.endYear }}
                </span>
              </p>
            </div>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </router-link>
      </div>

      <div v-else class="text-center py-12 text-gray-400">
        <i class="fas fa-users text-4xl mb-3"></i>
        <p>暂无校友记录</p>
      </div>
    </main>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="flex items-center justify-center h-64">
      <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
    </div>

    <!-- 错误状态 -->
    <div v-else class="flex items-center justify-center h-64">
      <div class="text-center">
        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i>
        <p class="text-gray-500">{{ error || '学校不存在' }}</p>
        <button @click="router.back()" class="mt-4 btn-primary px-4 py-2">
          返回上一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { schoolsAPI } from '../api'

const route = useRoute()
const router = useRouter()

const school = ref(null)
const alumni = ref([])
const loading = ref(true)
const error = ref(null)

const schoolId = computed(() => route.params.schoolId)

const degreeStats = computed(() => {
  const stats = { bachelor: 0, master: 0, doctoral: 0, highSchool: 0, other: 0 }
  alumni.value.forEach(a => {
    if (a.degree && stats.hasOwnProperty(a.degree)) {
      stats[a.degree]++
    }
  })
  return stats
})

const avatarColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
]

function getAvatarStyle(name) {
  const index = name.charCodeAt(0) % avatarColors.length
  return { background: avatarColors[index] }
}

function getSchoolTypeName(type) {
  const names = { university: '大学', highSchool: '高中', other: '其他' }
  return names[type] || type || '学校'
}

function getDegreeName(degree) {
  const names = {
    highSchool: '高中',
    bachelor: '本科',
    master: '硕士',
    doctoral: '博士',
    other: '其他'
  }
  return names[degree] || degree || '学历'
}

async function fetchSchoolData() {
  loading.value = true
  error.value = null
  try {
    const res = await schoolsAPI.getSchoolDetail(schoolId.value)
    if (res.data.success) {
      school.value = res.data.data.school
      alumni.value = res.data.data.alumni
    } else {
      error.value = res.data.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSchoolData()
})
</script>

<style scoped>
/* 卡片 */
.card-shadow {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* 关系卡片 */
.relation-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e5e7eb;
}
.relation-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
  border-color: #d1d5db;
}

/* 头像 */
.avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
}
</style>
