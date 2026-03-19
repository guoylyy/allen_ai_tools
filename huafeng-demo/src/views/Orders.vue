<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>订单管理</h2>
      <el-button type="primary" @click="showDialog = true">新建订单</el-button>
    </div>
    
    <el-card>
      <el-table :data="orders" stripe>
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="customer" label="客户" />
        <el-table-column prop="product" label="产品" />
        <el-table-column prop="floors" label="层数" width="60" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            ¥{{ row.amount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning">待生产</el-tag>
            <el-tag v-else-if="row.status === 'producing'" type="success">生产中</el-tag>
            <el-tag v-else type="info">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryDate" label="交货日期" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="startProduction(row)">开始生产</el-button>
            <el-button v-else size="small" @click="viewWorkOrder(row)">查看工单</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="showDialog" title="新建订单" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="客户">
          <el-input v-model="form.customer" />
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="form.product" style="width: 100%">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="层数">
          <el-input-number v-model="form.floors" :min="2" :max="40" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :step="10000" />
        </el-form-item>
        <el-form-item label="交货日期">
          <el-date-picker v-model="form.deliveryDate" type="date" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitOrder">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { ElMessage } from 'element-plus'

const orders = ref([])
const products = ref([])
const showDialog = ref(false)
const form = ref({
  customer: '',
  product: '',
  floors: 10,
  amount: 300000,
  deliveryDate: ''
})

onMounted(async () => {
  const [ordersRes, productsRes] = await Promise.all([api.getOrders(), api.getProducts()])
  orders.value = ordersRes.data
  products.value = productsRes.data
})

const submitOrder = async () => {
  if (!form.value.customer || !form.value.product) {
    ElMessage.warning('请填写完整信息')
    return
  }
  await api.addOrder(form.value)
  ElMessage.success('创建成功')
  showDialog.value = false
  orders.value = (await api.getOrders()).data
  form.value = { customer: '', product: '', floors: 10, amount: 300000, deliveryDate: '' }
}

const startProduction = async (order) => {
  await api.updateOrder(order.id, { status: 'producing' })
  await api.createWorkOrder(order.id, order)
  ElMessage.success('已创建生产工单')
  orders.value = (await api.getOrders()).data
}

const viewWorkOrder = (order) => {
  ElMessage.info('查看工单: ' + order.orderNo)
}
</script>
