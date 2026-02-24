<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import ExifReader from 'exifreader'

const router = useRouter()
const photos = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isUploading = ref(false)
const hasMore = ref(true)
const LIMIT = 30

// 图片预览弹窗
const showPreview = ref(false)
const previewUrl = ref('')

// 加载相册照片（首次加载）
async function loadPhotos() {
  isLoading.value = true
  hasMore.value = true
  try {
    const result = await api.getAlbumPhotos({})
    photos.value = result || []
    hasMore.value = result?.length >= LIMIT
  } catch (error) {
    console.error('加载照片失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 加载更多照片（无限滚动）
async function loadMorePhotos() {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  // 计算偏移量
  const offset = photos.value.length
  
  try {
    // 使用 offset 实现分页
    const result = await api.getAlbumPhotos({ limit: LIMIT, offset })
    const newPhotos = result || []
    
    if (newPhotos.length > 0) {
      // 过滤掉已存在的照片（根据ID去重）
      const existingIds = new Set(photos.value.map(p => p.id))
      const uniquePhotos = newPhotos.filter(p => !existingIds.has(p.id))
      photos.value = [...photos.value, ...uniquePhotos]
    }
    
    hasMore.value = newPhotos.length >= LIMIT
  } catch (error) {
    console.error('加载更多照片失败:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 监听滚动（带节流）
let isScrolling = false
function handleScroll() {
  if (isScrolling) return
  
  isScrolling = true
  setTimeout(() => {
    isScrolling = false
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // 距离底部 300px 时开始加载（移动端更容易触发）
    if (scrollTop + windowHeight >= documentHeight - 300) {
      loadMorePhotos()
    }
  }, 200)
}

// 刷新相册
async function refreshPhotos() {
  await loadPhotos()
}

// 触发图片上传
function triggerUpload() {
  document.getElementById('photo-upload')?.click()
}

// 压缩图片
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // 如果图片大于最大宽度，按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为 blob
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 读取照片的 EXIF 拍摄时间
async function getExifDate(file) {
  try {
    // 简单检查文件是否是图片
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return null
    }
    
    // 使用 ExifReader 读取 EXIF 数据
    const tags = await ExifReader.load(file)
    
    // 尝试获取拍摄时间
    let dateStr = null
    
    // 优先获取 DateTimeOriginal (拍摄时间)
    if (tags.DateTimeOriginal) {
      dateStr = tags.DateTimeOriginal.description
    } else if (tags.DateTime) {
      // 备用：获取 DateTime (修改时间)
      dateStr = tags.DateTime.description
    }
    
    if (dateStr) {
      // EXIF 日期格式: "2024:01:15 10:30:00"
      // 转换为 ISO 格式
      const converted = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
      console.log('EXIF 拍摄时间:', converted)
      return converted
    } else {
      console.log('未找到 EXIF 拍摄时间')
      return null
    }
  } catch (e) {
    console.log('EXIF 解析失败:', e.message)
    return null
  }
}

// 处理图片选择
async function handlePhotoSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  // 压缩图片
  isUploading.value = true
  let uploadFile = file
  let takenAt = null
  
  try {
    // 读取 EXIF 拍摄时间
    takenAt = await getExifDate(file)
    console.log('拍摄时间:', takenAt)
    
    // 如果文件大于 500KB，先压缩
    if (file.size > 500 * 1024) {
      console.log('图片过大，开始压缩...')
      uploadFile = await compressImage(file, 1200, 0.7)
      console.log(`压缩后大小: ${(uploadFile.size / 1024).toFixed(2)}KB`)
    }
    
    // 预览本地图片（使用原图预览）
    const reader = new FileReader()
    reader.onload = (e) => {
      photos.value.unshift({
        id: Date.now(),
        url: e.target.result,
        created_at: new Date().toISOString(),
        taken_at: takenAt,
        local: true
      })
    }
    reader.readAsDataURL(file)
    
    // 实际上传到服务器（七牛云）
    const formData = new FormData()
    formData.append('image', uploadFile)
    formData.append('description', '通过相册上传')
    if (takenAt) {
      formData.append('taken_at', takenAt)
    }
    
    const result = await api.uploadImage(formData)
    console.log('上传结果:', result)
    
    // 更新本地图片信息
    const localPhoto = photos.value.find(p => p.local && p.id > Date.now() - 5000)
    if (localPhoto) {
      localPhoto.url = result.url
      localPhoto.local = false
      localPhoto.id = result.id
    }
    
    // 刷新相册
    await loadPhotos()
  } catch (error) {
    console.error('上传失败:', error)
    // 移除上传失败的图片
    photos.value = photos.value.filter(p => !p.local)
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

// 打开图片预览
function openPreview(url) {
  previewUrl.value = url
  showPreview.value = true
  // 禁止背景滚动
  document.body.style.overflow = 'hidden'
}

// 关闭图片预览
function closePreview() {
  showPreview.value = false
  previewUrl.value = ''
  // 恢复滚动
  document.body.style.overflow = ''
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
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div style="min-height: 100vh; padding-bottom: 80px;">
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
          class="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
          @click="openPreview(photo.url)"
        >
          <img 
            :src="photo.url" 
            class="w-full h-full object-cover"
            alt="宝宝照片"
          />
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div v-if="hasMore && photos.length > 0" class="text-center py-4">
        <div v-if="isLoadingMore" class="inline-flex items-center gap-2 text-gray-400">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          <span>加载更多...</span>
        </div>
      </div>
      
      <!-- 没有更多了 -->
      <div v-else-if="!hasMore && photos.length > 0" class="text-center py-4 text-gray-400 text-sm">
        没有更多照片了
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

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div 
        v-if="showPreview" 
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        @click="closePreview"
      >
        <!-- 关闭按钮 -->
        <button 
          class="absolute top-4 right-4 text-white text-2xl z-10"
          @click="closePreview"
        >
          ✕
        </button>
        
        <!-- 图片 -->
        <img 
          :src="previewUrl" 
          class="max-w-full max-h-full object-contain"
          alt="预览图片"
          @click.stop
        />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
</style>
