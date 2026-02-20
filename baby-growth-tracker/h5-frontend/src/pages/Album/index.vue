<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'

const router = useRouter()
const photos = ref([])
const isLoading = ref(false)
const isUploading = ref(false)

// 加载相册照片
async function loadPhotos() {
  isLoading.value = true
  try {
    const result = await api.getAlbumPhotos({})
    photos.value = result || []
  } catch (error) {
    console.error('加载照片失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 触发图片上传
function triggerUpload() {
  document.getElementById('photo-upload')?.click()
}

// 处理图片选择
async function handlePhotoSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  // 预览本地图片
  const reader = new FileReader()
  reader.onload = (e) => {
    photos.value.unshift({
      id: Date.now(),
      url: e.target.result,
      created_at: new Date().toISOString(),
      local: true
    })
  }
  reader.readAsDataURL(file)
  
  // 实际上传到服务器（七牛云）
  isUploading.value = true
  const formData = new FormData()
  formData.append('image', file)
  formData.append('description', '通过聊天记录上传')
  
  try {
    const result = await api.uploadImage(formData)
    // 更新本地图片信息
    const localPhoto = photos.value.find(p => p.local && p.id > Date.now() - 5000)
    if (localPhoto) {
      localPhoto.url = result.url
      localPhoto.local = false
      localPhoto.id = result.id
    }
  } catch (error) {
    console.error('上传失败:', error)
    // 移除上传失败的图片
    photos.value = photos.value.filter(p => !p.local)
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

// 格式化日期
function formatDate(date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  loadPhotos()
})
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- 头部 -->
    <header class="bg-white border-b sticky top-0 z-10">
      <div class="flex items-center p-4">
        <button @click="router.back()" class="text-gray-600">
          <span class="text-xl">←</span>
        </button>
        <h1 class="flex-1 text-center font-semibold">宝宝相册</h1>
        <button
          @click="triggerUpload"
          class="text-primary-600 font-medium"
          :disabled="isUploading"
        >
          {{ isUploading ? '上传中...' : '上传' }}
        </button>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handlePhotoSelect"
        />
      </div>
    </header>

    <!-- 相册说明 -->
    <div class="p-4 bg-blue-50">
      <p class="text-sm text-blue-700">
        💡 提示：在聊天记录中点击📷上传的照片会显示在这里，形成宝宝的成长相册。
      </p>
    </div>

    <!-- 照片网格 -->
    <div class="p-4">
      <div v-if="isLoading" class="flex justify-center py-20">
        <span class="text-gray-400">加载中...</span>
      </div>
      
      <div v-else-if="photos.length === 0" class="text-center py-20">
        <span class="text-6xl">📭</span>
        <p class="text-gray-500 mt-4">还没有照片</p>
        <p class="text-gray-400 text-sm mt-2">在聊天记录中上传宝宝的可爱照片吧</p>
      </div>
      
      <div v-else class="grid grid-cols-3 gap-2">
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <img 
            :src="photo.url" 
            class="w-full h-full object-cover"
            alt="宝宝照片"
          />
        </div>
      </div>
    </div>

    <!-- 上传入口提示 -->
    <div class="fixed bottom-4 right-4">
      <button
        @click="router.push('/chat-record')"
        class="w-14 h-14 rounded-full bg-primary-500 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-primary-600 transition-colors"
        title="去聊天记录上传照片"
      >
        💬
      </button>
    </div>
  </div>
</template>
