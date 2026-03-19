<template>
  <div>
    <h2>产品管理</h2>
    <el-card style="margin-top: 20px">
      <el-table :data="products" stripe>
        <el-table-column prop="name" label="产品名称" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="speed" label="速度" width="80" />
        <el-table-column prop="capacity" label="载重" width="80" />
        <el-table-column prop="floors" label="层数" width="60" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const products = ref([])
onMounted(async () => {
  products.value = (await api.getProducts()).data
})
</script>
