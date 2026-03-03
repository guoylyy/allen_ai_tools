<template>
  <div class="workers-page">
    <div class="toolbar">
      <h2 class="page-title">👥 员工管理</h2>
      <button class="btn btn-primary" @click="openAddModal">+ 添加员工</button>
    </div>

    <!-- 员工列表 -->
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>部门</th>
            <th>职位</th>
            <th>电话</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="worker in workers" :key="worker.id">
            <td>
              <div class="worker-name">
                <span class="avatar">{{ worker.name[0] }}</span>
                {{ worker.name }}
              </div>
            </td>
            <td>{{ worker.department || '-' }}</td>
            <td>{{ worker.position || '-' }}</td>
            <td>{{ worker.phone || '-' }}</td>
            <td>
              <span :class="['tag', worker.status === 'active' ? 'tag-success' : 'tag-warning']">
                {{ worker.status === 'active' ? '在职' : '禁用' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn" @click="openEditModal(worker)">编辑</button>
                <button class="action-btn danger" @click="deleteWorker(worker)">
                  {{ worker.status === 'active' ? '禁用' : '启用' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!workers.length" class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p>暂无员工，请添加</p>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEdit ? '编辑员工' : '添加员工' }}</h3>
        <div class="form-group">
          <label>姓名 *</label>
          <input v-model="form.name" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label>部门</label>
          <select v-model="form.department">
            <option value="">请选择部门</option>
            <option value="生产部">生产部</option>
            <option value="质检部">质检部</option>
            <option value="仓储部">仓储部</option>
            <option value="技术部">技术部</option>
            <option value="管理部">管理部</option>
          </select>
        </div>
        <div class="form-group">
          <label>职位</label>
          <input v-model="form.position" placeholder="请输入职位" />
        </div>
        <div class="form-group">
          <label>电话</label>
          <input v-model="form.phone" placeholder="请输入电话号码" />
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveWorker" :disabled="!form.name">
            {{ isEdit ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchWorkers, addWorker, updateWorker, deleteWorker as delWorker } from '../api'

const workers = ref([])
const showModal = ref(false)
const isEdit = ref(false)
const form = ref({
  id: '',
  name: '',
  department: '',
  position: '',
  phone: '',
  status: 'active'
})

const loadWorkers = async () => {
  workers.value = await fetchWorkers()
}

const openAddModal = () => {
  isEdit.value = false
  form.value = { id: '', name: '', department: '', position: '', phone: '', status: 'active' }
  showModal.value = true
}

const openEditModal = (worker) => {
  isEdit.value = true
  form.value = { ...worker }
  showModal.value = true
}

const saveWorker = async () => {
  if (!form.value.name) return
  
  if (isEdit.value) {
    await updateWorker(form.value.id, form.value)
  } else {
    await addWorker({
      name: form.value.name,
      department: form.value.department,
      position: form.value.position,
      phone: form.value.phone
    })
  }
  showModal.value = false
  loadWorkers()
}

const deleteWorker = async (worker) => {
  const action = worker.status === 'active' ? '禁用' : '启用'
  if (confirm(`确认${action}该员工？`)) {
    await delWorker(worker.id)
    loadWorkers()
  }
}

onMounted(loadWorkers)
</script>

<style scoped>
.workers-page {
  max-width: 1200px;
}

.worker-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.worker-name .avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
