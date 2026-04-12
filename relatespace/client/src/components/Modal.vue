<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <!-- 遮罩 -->
      <div class="absolute inset-0 bg-black/50" @click="close"></div>
      
      <!-- 模态框内容 -->
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <!-- 头部 -->
        <div class="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h3 class="font-semibold text-lg">{{ title }}</h3>
          <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-gray-400"></i>
          </button>
        </div>
        
        <!-- 内容 -->
        <div class="p-5">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>