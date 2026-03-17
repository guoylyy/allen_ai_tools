<template>
  <div>
    <h2>生产工单</h2>
    <el-card style="margin-top: 20px">
      <el-table :data="workOrders" stripe>
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="product" label="产品" />
        <el-table-column prop="progress" label="进度">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.progress >= 100 ? 'success' : ''" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'in_progress'" type="primary">进行中</el-tag>
            <el-tag v-else type="success">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="expectedDate" label="计划完成" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="updateProgress(row)">更新进度</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { ElMessage } from 'element-plus'

const workOrders = ref([])

onMounted(async () => {
  workOrders.value = (await api.getWorkOrders()).data
})

const updateProgress = async (wo) => {
  const newProgress = Math.min(wo.progress + 10, 100)
  await api.updateWorkProgress(wo.id, newProgress)
  wo.progress = newProgress
  if (newProgress >= 100) {
    wo.status = 'completed'
    ElMessage.success('生产完成！')
  }
}
</script>
