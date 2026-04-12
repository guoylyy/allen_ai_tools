<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-users text-white text-sm"></i>
          </div>
          <h1 class="text-lg font-semibold">关系舱</h1>
        </div>
        <div class="flex items-center gap-3">
          <router-link to="/relation/new" class="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
            <i class="fas fa-plus"></i>
            <span>新增</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-6">
      <!-- 概览卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-gray-900">{{ relations.length }}</div>
          <div class="text-xs text-gray-500 mt-1">关系人总数</div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-red-500">{{ overdueCount }}</div>
          <div class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <i class="fas fa-exclamation-circle text-red-400"></i> 需要跟进
          </div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-orange-500">{{ promiseCount }}</div>
          <div class="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <i class="fas fa-handshake text-orange-400"></i> 待履行约定
          </div>
        </div>
        <div class="card-shadow rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-green-500">{{ recentCount }}</div>
          <div class="text-xs text-gray-500 mt-1">本周已维护</div>
        </div>
      </div>

      <!-- 关系人网格 -->
      <div class="relation-grid" v-if="!loading">
        <router-link 
          v-for="relation in relations" 
          :key="relation.id"
          :to="`/relation/${relation.id}`"
          class="relation-card"
          :class="{ 'warning': isOverdue(relation) }"
        >
          <div class="flex items-center gap-3">
            <div class="avatar w-11 h-11 text-lg" :style="getAvatarStyle(relation.name)">
              {{ relation.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h3 class="font-semibold">{{ relation.name }}</h3>
                <span v-if="isOverdue(relation)" class="text-xs text-red-500">⚠️ {{ getOverdueDays(relation) }}天未联系</span>
                <span v-else-if="isRecent(relation)" class="text-xs text-green-600 font-medium">今天互动</span>
                <span v-else class="text-xs text-gray-400">{{ getLastInteractionText(relation) }}</span>
              </div>
              <p class="text-xs text-gray-500">{{ relation.position }} · {{ relation.company }}</p>
              <div class="flex gap-1.5 mt-2 flex-wrap">
                <span v-for="tag in relation.tags" :key="tag" class="tag">{{ tag }}</span>
                <span v-if="relation.importance === 'high'" class="tag-highvalue">高价值</span>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- 加载状态 -->
      <div v-else class="text-center py-12 text-gray-500">
        <i class="fas fa-spinner fa-spin text-2xl"></i>
        <p class="mt-2">加载中...</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRelationStore } from '../stores/relations'

const store = useRelationStore()
const relations = computed(() => store.relations)
const loading = computed(() => store.loading)

const overdueCount = computed(() => store.overdueRelations.length)
const promiseCount = computed(() => 1)
const recentCount = computed(() => relations.value.filter(r => isRecent(r)).length)

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

function isOverdue(relation) {
  if (!relation.lastInteraction) return false
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = (now - last) / (1000 * 60 * 60 * 24)
  return diff > 14
}

function getOverdueDays(relation) {
  if (!relation.lastInteraction) return 0
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  return Math.floor((now - last) / (1000 * 60 * 60 * 24))
}

function isRecent(relation) {
  if (!relation.lastInteraction) return false
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = (now - last) / (1000 * 60 * 60 * 24)
  return diff < 1
}

function getLastInteractionText(relation) {
  if (!relation.lastInteraction) return '暂无记录'
  const last = new Date(relation.lastInteraction)
  const now = new Date()
  const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24))
  if (diff === 0) return '今天'
  if (diff === 1) return '昨天'
  if (diff < 7) return `${diff}天前`
  if (diff < 30) return `${Math.floor(diff / 7)}周前`
  return `${Math.floor(diff / 30)}月前`
}

onMounted(() => {
  store.fetchRelations()
})
</script>

<style scoped>
.relation-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;
}
@media (min-width: 640px) {
  .relation-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .relation-grid { grid-template-columns: repeat(3, 1fr); }
}

.relation-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}
.relation-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}
.relation-card.warning {
  border-left: 3px solid #ef4444;
  background: #fef2f2;
}
</style>
