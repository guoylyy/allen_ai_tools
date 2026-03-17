<template>
  <div>
    <h2>员工管理</h2>
    <el-card style="margin-top: 20px">
      <el-table :data="workers" stripe>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="role" label="职位" width="100" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="joinDate" label="入职日期" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'active'" type="success">在职</el-tag>
            <el-tag v-else type="info">离职</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const workers = ref([])
onMounted(async () => {
  workers.value = (await api.getWorkers()).data
})
</script>
