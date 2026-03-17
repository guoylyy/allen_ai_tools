<template>
  <div>
    <h2>数据概览</h2>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #409eff">{{ stats.totalOrders }}</div>
            <div style="color: #999">总订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #e6a23c">{{ stats.pendingOrders }}</div>
            <div style="color: #999">待生产</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #67c23a">{{ stats.producingOrders }}</div>
            <div style="color: #999">生产中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; font-weight: bold; color: #909399">{{ stats.completedOrders }}</div>
            <div style="color: #999">已完成</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>进行中的生产工单</span>
          </template>
          <el-table :data="workOrders" stripe>
            <el-table-column prop="orderNo" label="订单号" />
            <el-table-column prop="product" label="产品" />
            <el-table-column prop="progress" label="进度">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近生产记录</span>
          </template>
          <el-table :data="recentRecords" stripe>
            <el-table-column prop="process" label="工序" />
            <el-table-column prop="worker" label="员工" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="completedAt" label="完成时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const stats = ref({})
const workOrders = ref([])
const recentRecords = ref([])

onMounted(async () => {
  const [statsRes, woRes, recordsRes] = await Promise.all([
    api.getStats(),
    api.getWorkOrders(),
    api.getProductionRecords()
  ])
  stats.value = statsRes.data
  workOrders.value = woRes.data.filter(w => w.status === 'in_progress')
  recentRecords.value = recordsRes.data.slice(-5).reverse()
})
</script>
