<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 -->
    <header class="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="router.back()" class="btn-secondary w-9 h-9 flex items-center justify-center">
            <i class="fas fa-arrow-left text-sm"></i>
          </button>
          <span class="text-sm text-gray-500">返回</span>
        </div>
        <h1 class="text-base font-semibold">批量导入</h1>
        <div class="w-20"></div>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-6">
      <!-- 步骤指示器 -->
      <div class="flex items-center justify-center mb-8">
        <div class="flex items-center">
          <div class="step-item" :class="{ active: step >= 1, completed: step > 1 }">
            <div class="step-circle">
              <i v-if="step > 1" class="fas fa-check"></i>
              <span v-else>1</span>
            </div>
            <span class="step-label">选择文件</span>
          </div>
          <div class="step-line" :class="{ active: step >= 2 }"></div>
          <div class="step-item" :class="{ active: step >= 2, completed: step > 2 }">
            <div class="step-circle">
              <i v-if="step > 2" class="fas fa-check"></i>
              <span v-else>2</span>
            </div>
            <span class="step-label">预览确认</span>
          </div>
          <div class="step-line" :class="{ active: step >= 3 }"></div>
          <div class="step-item" :class="{ active: step >= 3 }">
            <div class="step-circle">3</div>
            <span class="step-label">完成</span>
          </div>
        </div>
      </div>

      <!-- 步骤1: 选择文件 -->
      <div v-if="step === 1" class="space-y-6">
        <!-- 下载模板卡片 -->
        <div class="card-shadow rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <i class="fas fa-file-excel text-2xl text-green-600"></i>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-1">下载导入模板</h3>
              <p class="text-sm text-gray-500 mb-3">请先下载标准模板，填写后再上传。支持 .xlsx 和 .xls 格式。</p>
              <button @click="downloadTemplate" class="btn-primary px-4 py-2 flex items-center gap-2">
                <i class="fas fa-download"></i>
                <span>下载模板</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 上传区域 -->
        <div
          class="upload-area"
          :class="{ 'dragover': isDragover, 'has-file': selectedFile }"
          @dragover.prevent="isDragover = true"
          @dragleave="isDragover = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls"
            @change="handleFileSelect"
            class="hidden"
          />

          <div v-if="!selectedFile" class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <i class="fas fa-cloud-upload-alt text-3xl text-gray-400"></i>
            </div>
            <p class="text-gray-600 font-medium mb-1">拖拽文件到此处，或点击选择文件</p>
            <p class="text-sm text-gray-400">支持 .xlsx, .xls 格式，最大 10MB</p>
          </div>

          <div v-else class="text-center py-4">
            <div class="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
              <i class="fas fa-file-excel text-xl text-green-600"></i>
            </div>
            <p class="font-medium text-gray-900 mb-1">{{ selectedFile.name }}</p>
            <p class="text-sm text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
            <button @click.stop="clearFile" class="mt-3 text-sm text-red-500 hover:text-red-600">
              <i class="fas fa-times mr-1"></i>移除文件
            </button>
          </div>
        </div>

        <!-- 下一步按钮 -->
        <button
          @click="previewImport"
          :disabled="!selectedFile || loading"
          class="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <span v-else>预览导入数据</span>
        </button>
      </div>

      <!-- 步骤2: 预览确认 -->
      <div v-if="step === 2" class="space-y-6">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="card-shadow rounded-xl p-4 text-center bg-green-50">
            <div class="text-2xl font-bold text-green-600">{{ previewData.totalCount }}</div>
            <div class="text-xs text-gray-500">待导入</div>
          </div>
          <div class="card-shadow rounded-xl p-4 text-center bg-blue-50">
            <div class="text-2xl font-bold text-blue-600">{{ previewData.validCount || previewData.totalCount }}</div>
            <div class="text-xs text-gray-500">有效数据</div>
          </div>
          <div class="card-shadow rounded-xl p-4 text-center bg-red-50">
            <div class="text-2xl font-bold text-red-600">{{ previewData.errorCount || 0 }}</div>
            <div class="text-xs text-gray-500">无效数据</div>
          </div>
        </div>

        <!-- 数据预览表格 -->
        <div class="card-shadow rounded-xl overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 border-b">
            <h3 class="font-semibold text-sm">数据预览（仅显示前10条）</h3>
          </div>
          <div class="overflow-x-auto max-h-80">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">姓名</th>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">公司</th>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">职位</th>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">标签</th>
                  <th class="px-3 py-2 text-left text-gray-500 font-medium">重要性</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in previewData.records.slice(0, 10)" :key="index"
                    class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-3 py-2 font-medium">{{ item.name }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ item.company || '-' }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ item.position || '-' }}</td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="tag in (item.tags || []).slice(0, 2)" :key="tag" class="tag text-xs">{{ tag }}</span>
                      <span v-if="(item.tags || []).length > 2" class="text-xs text-gray-400">+{{ item.tags.length - 2 }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <span class="text-xs px-2 py-0.5 rounded" :class="getImportanceClass(item.importance)">
                      {{ getImportanceText(item.importance) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="previewData.records.length > 10" class="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
            还有 {{ previewData.records.length - 10 }} 条数据...
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="previewData.errors && previewData.errors.length > 0" class="card-shadow rounded-xl overflow-hidden">
          <div class="px-4 py-3 bg-red-50 border-b border-red-100">
            <h3 class="font-semibold text-sm text-red-700">
              <i class="fas fa-exclamation-circle mr-1"></i>
              数据问题（这些数据将跳过）
            </h3>
          </div>
          <div class="max-h-40 overflow-y-auto">
            <div v-for="(error, index) in previewData.errors.slice(0, 5)" :key="index"
                 class="px-4 py-2 text-sm border-b border-red-50">
              <span class="text-red-600">第{{ error.row }}行:</span>
              <span class="text-gray-600 ml-2">{{ error.name || '(空)' }} - {{ error.error }}</span>
            </div>
            <div v-if="previewData.errors.length > 5" class="px-4 py-2 text-sm text-gray-500">
              还有 {{ previewData.errors.length - 5 }} 条错误...
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button @click="step = 1" class="flex-1 py-3 border rounded-xl text-gray-600">
            返回重新选择
          </button>
          <button @click="executeImport" :disabled="loading" class="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span v-else>确认导入</span>
          </button>
        </div>
      </div>

      <!-- 步骤3: 完成 -->
      <div v-if="step === 3" class="text-center py-8">
        <div class="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
             :class="importResult.failedCount > 0 ? 'bg-yellow-100' : 'bg-green-100'">
          <i class="fas fa-check text-4xl" :class="importResult.failedCount > 0 ? 'text-yellow-600' : 'text-green-600'"></i>
        </div>

        <h2 class="text-xl font-bold mb-2">导入完成</h2>
        <p class="text-gray-500 mb-6">
          成功导入 {{ importResult.importedCount }} 条数据
          <span v-if="importResult.skippedCount > 0">，跳过 {{ importResult.skippedCount }} 条重复</span>
          <span v-if="importResult.failedCount > 0">，失败 {{ importResult.failedCount }} 条</span>
        </p>

        <!-- 导入结果详情 -->
        <div class="card-shadow rounded-xl text-left mb-6 max-h-60 overflow-y-auto">
          <div v-if="importResult.imported && importResult.imported.length > 0">
            <div class="px-4 py-2 bg-green-50 text-sm font-medium text-green-700">
              <i class="fas fa-check-circle mr-1"></i>成功导入 ({{ importResult.importedCount }})
            </div>
            <div v-for="item in importResult.imported" :key="item.id" class="px-4 py-2 border-b text-sm">
              {{ item.name }} <span class="text-gray-400">@ {{ item.company || '无公司' }}</span>
            </div>
          </div>
          <div v-if="importResult.skipped && importResult.skipped.length > 0">
            <div class="px-4 py-2 bg-yellow-50 text-sm font-medium text-yellow-700">
              <i class="fas fa-exclamation-circle mr-1"></i>跳过 ({{ importResult.skippedCount }})
            </div>
            <div v-for="item in importResult.skipped" :key="item.name" class="px-4 py-2 border-b text-sm">
              {{ item.name }} <span class="text-gray-400">- {{ item.reason }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button @click="reset" class="flex-1 py-3 border rounded-xl text-gray-600">
            继续导入
          </button>
          <button @click="router.push('/')" class="flex-1 btn-primary py-3">
            返回首页
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { importAPI } from '../api'
import { useRelationStore } from '../stores/relations'

const router = useRouter()
const store = useRelationStore()

const step = ref(1)
const loading = ref(false)
const isDragover = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)

const previewData = reactive({
  records: [],
  totalCount: 0,
  errorCount: 0,
  errors: [],
  validCount: 0
})

const importResult = reactive({
  importedCount: 0,
  skippedCount: 0,
  failedCount: 0,
  imported: [],
  skipped: [],
  failed: []
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

function handleDrop(event) {
  isDragover.value = false
  const file = event.dataTransfer.files[0]
  if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.ms-excel')) {
    selectedFile.value = file
  }
}

function clearFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function downloadTemplate() {
  try {
    const response = await importAPI.getTemplate()
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relatespace_import_template.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    alert('下载模板失败: ' + err.message)
  }
}

async function previewImport() {
  if (!selectedFile.value) return

  loading.value = true
  try {
    const response = await importAPI.preview(selectedFile.value)
    if (response.data.success) {
      previewData.records = response.data.data.records
      previewData.totalCount = response.data.data.totalCount
      previewData.errorCount = response.data.data.errorCount
      previewData.errors = response.data.data.errors || []
      previewData.validCount = previewData.totalCount - previewData.errorCount
      step.value = 2
    } else {
      alert(response.data.message || '预览失败')
    }
  } catch (err) {
    alert('预览失败: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

async function executeImport() {
  loading.value = true
  try {
    const response = await importAPI.execute(selectedFile.value)
    if (response.data.success) {
      importResult.importedCount = response.data.data.importedCount
      importResult.skippedCount = response.data.data.skippedCount
      importResult.failedCount = response.data.data.failedCount
      importResult.imported = response.data.data.imported || []
      importResult.skipped = response.data.data.skipped || []
      importResult.failed = response.data.data.failed || []
      step.value = 3
      // 刷新关系人列表
      store.fetchRelations()
    } else {
      alert(response.data.message || '导入失败')
    }
  } catch (err) {
    alert('导入失败: ' + (err.response?.data?.message || err.message))
  } finally {
    loading.value = false
  }
}

function reset() {
  step.value = 1
  selectedFile.value = null
  clearFile()
  previewData.records = []
  previewData.totalCount = 0
  previewData.errorCount = 0
  previewData.errors = []
}

function getImportanceClass(importance) {
  const classes = {
    high: 'bg-red-100 text-red-600',
    normal: 'bg-blue-100 text-blue-600',
    low: 'bg-gray-100 text-gray-600'
  }
  return classes[importance] || classes.normal
}

function getImportanceText(importance) {
  const texts = {
    high: '重要',
    normal: '普通',
    low: '一般'
  }
  return texts[importance] || '普通'
}
</script>

<style scoped>
/* 步骤指示器 */
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}
.step-item.active .step-circle {
  background: #4f46e5;
  color: white;
}
.step-item.completed .step-circle {
  background: #10b981;
  color: white;
}
.step-label {
  font-size: 12px;
  color: #6b7280;
}
.step-item.active .step-label {
  color: #4f46e5;
  font-weight: 500;
}
.step-line {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
  margin-bottom: 24px;
  transition: all 0.3s;
}
.step-line.active {
  background: #4f46e5;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.upload-area:hover {
  border-color: #667eea;
  background: #f5f5ff;
}
.upload-area.dragover {
  border-color: #667eea;
  background: #eef2ff;
}
.upload-area.has-file {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

/* 表格 */
table {
  border-collapse: collapse;
}
th, td {
  white-space: nowrap;
}
</style>
