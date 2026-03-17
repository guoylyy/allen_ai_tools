<template>
  <div>
    <h2>工艺流程</h2>
    <el-card style="margin-top: 20px">
      <el-table :data="processes" stripe>
        <el-table-column prop="name" label="工序名称" width="120" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="duration" label="标准工时(分钟)" width="140" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'preparation'" type="info">准备</el-tag>
            <el-tag v-else-if="row.type === 'assembly'" type="warning">组装</el-tag>
            <el-tag v-else-if="row.type === 'finishing'" type="success">成品</el-tag>
            <el-tag v-else type="primary">测试</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const processes = ref([])
onMounted(async () => {
  processes.value = (await api.getProcesses()).data
})
</script>
