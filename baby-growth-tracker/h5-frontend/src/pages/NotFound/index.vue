<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <div class="text-8xl mb-4">404</div>
    <h1 class="text-xl font-semibold mb-2">页面不存在</h1>
    <p class="text-gray-500 text-center mb-6">
      您访问的页面不存在或已被移除
    </p>
    <button
      @click="router.push('/')"
      class="btn btn-primary"
    >
      返回首页
    </button>
  </div>
</template>
