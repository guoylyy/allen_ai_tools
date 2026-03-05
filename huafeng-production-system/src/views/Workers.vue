<template>
  <div class="workers-page">
    <h1 class="page-title">👥 员工管理</h1>

    <div class="card">
      <div class="toolbar">
        <h3 style="margin: 0; font-size: 16px;">员工列表</h3>
        <button class="btn btn-primary" @click="showModal = true">+ 添加员工</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>角色</th>
            <th>负责工艺</th>
            <th>手机号</th>
            <th>入职时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="worker in workers" :key="worker.id">
            <td><strong>{{ worker.name }}</strong></td>
            <td>
              <span :class="['role-tag', worker.role === '工艺组长' ? 'role-leader' : 'role-worker']">
                {{ worker.role }}
              </span>
            </td>
            <td>
              <div class="process-tags">
                <span v-for="proc in worker.processes" :key="proc" class="process-tag">{{ proc }}</span>
              </div>
            </td>
            <td>{{ worker.phone }}</td>
            <td>{{ worker.joinDate }}</td>
            <td>
              <span :class="['tag', worker.status === '在职' ? 'tag-success' : 'tag-warning']">
                {{ worker.status }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn" @click="editWorker(worker)">编辑</button>
                <button class="action-btn danger">{{ worker.status === '在职' ? '禁用' : '启用' }}</button>
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
      <div class="modal" style="max-width: 600px;">
        <h3>{{ isEdit ? '编辑员工' : '添加员工' }}</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="form.name" placeholder="请输入姓名" />
          </div>
          <div class="form-group">
            <label>手机号 *</label>
            <input v-model="form.phone" placeholder="请输入手机号" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>角色 *</label>
            <select v-model="form.role">
              <option value="">请选择角色</option>
              <option value="普通工人">普通工人</option>
              <option value="工艺组长">工艺组长</option>
            </select>
          </div>
          <div class="form-group">
            <label>入职时间</label>
            <input type="date" v-model="form.joinDate" />
          </div>
        </div>

        <div class="form-group">
          <label>负责工艺（可多选）</label>
          <div class="process-selector">
            <label v-for="proc in processOptions" :key="proc" class="proc-checkbox">
              <input type="checkbox" :value="proc" v-model="form.processes" />
              <span>{{ proc }}</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>备注</label>
          <textarea v-model="form.remark" placeholder="请输入备注" rows="2"></textarea>
        </div>

        <div class="form-actions">
          <button class="btn" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="saveWorker">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)
const isEdit = ref(false)

const processOptions = ['剪板', '数冲', '激光下料', '折弯', '角钢线', '切管机', '锯床', '钻床', '普冲', '焊接', '喷涂', '组装']

const form = ref({
  name: '',
  phone: '',
  role: '',
  joinDate: '',
  processes: [],
  remark: ''
})

const workers = ref([
  { 
    id: 1, 
    name: '张建国', 
    phone: '13800138001', 
    role: '工艺组长', 
    joinDate: '2020-03-15',
    processes: ['剪板', '数冲', '激光下料'],
    status: '在职',
    remark: '车间主任'
  },
  { 
    id: 2, 
    name: '李海峰', 
    phone: '13800138002', 
    role: '普通工人', 
    joinDate: '2021-06-20',
    processes: ['剪板'],
    status: '在职',
    remark: ''
  },
  { 
    id: 3, 
    name: '王志明', 
    phone: '13800138003', 
    role: '普通工人', 
    joinDate: '2021-08-10',
    processes: ['数冲', '激光下料'],
    status: '在职',
    remark: ''
  },
  { 
    id: 4, 
    name: '赵文斌', 
    phone: '13800138004', 
    role: '工艺组长', 
    joinDate: '2019-11-01',
    processes: ['折弯', '焊接', '喷涂'],
    status: '在职',
    remark: '焊接班组长'
  },
  { 
    id: 5, 
    name: '钱小明', 
    phone: '13800138005', 
    role: '普通工人', 
    joinDate: '2022-01-15',
    processes: ['折弯'],
    status: '在职',
    remark: ''
  },
  { 
    id: 6, 
    name: '孙建新', 
    phone: '13800138006', 
    role: '普通工人', 
    joinDate: '2022-04-20',
    processes: ['焊接', '喷涂'],
    status: '在职',
    remark: ''
  },
  { 
    id: 7, 
    name: '周伟', 
    phone: '13800138007', 
    role: '普通工人', 
    joinDate: '2023-02-10',
    processes: ['角钢线', '切管机'],
    status: '在职',
    remark: ''
  },
  { 
    id: 8, 
    name: '吴建华', 
    phone: '13800138008', 
    role: '工艺组长', 
    joinDate: '2018-09-01',
    processes: ['角钢线', '切管机', '锯床', '钻床', '普冲', '组装'],
    status: '在职',
    remark: '组装车间主任'
  }
])

const editWorker = (worker) => {
  isEdit.value = true
  form.value = { 
    name: worker.name,
    phone: worker.phone,
    role: worker.role,
    joinDate: worker.joinDate,
    processes: [...worker.processes],
    remark: worker.remark || ''
  }
  showModal.value = true
}

const saveWorker = () => {
  if (!form.value.name || !form.value.phone || !form.value.role) {
    alert('请填写必填项')
    return
  }
  alert(isEdit.value ? '员工信息已更新' : '员工添加成功')
  showModal.value = false
  // 重置表单
  form.value = { name: '', phone: '', role: '', joinDate: '', processes: [], remark: '' }
}
</script>

<style>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

.role-tag { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.role-leader { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.role-worker { background: #e9ecef; color: #495057; }

.process-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.process-tag { padding: 2px 8px; background: #e3f2fd; color: #1976d2; border-radius: 3px; font-size: 11px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }

.process-selector { display: flex; flex-wrap: wrap; gap: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px; }
.proc-checkbox { display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 13px; }
.proc-checkbox input { width: auto; }

.actions { display: flex; gap: 8px; }
.action-btn { padding: 4px 12px; font-size: 12px; background: var(--primary); color: #fff; border: none; border-radius: 4px; cursor: pointer; }
.action-btn.danger { background: #dc3545; }

.tag-warning { background: #ffc107; color: #000; }
</style>
