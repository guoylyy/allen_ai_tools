<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-brand">🚀 华丰智造</div>
      <div class="navbar-menu">
        <router-link to="/" class="nav-item">📊 进度看板</router-link>
        <router-link to="/orders" class="nav-item">📋 生产排单</router-link>
        <router-link to="/workers" class="nav-item">👥 员工管理</router-link>
        <router-link to="/report" class="nav-item">📝 扫码报工</router-link>
        <router-link to="/stats" class="nav-item">📈 效率统计</router-link>
        <router-link to="/boss" class="nav-item" style="color: #ff00ff;">📺 老板看板</router-link>
      </div>
      <div class="navbar-user">
        <span>👤 管理员</span>
      </div>
    </nav>
    <main class="main-content">
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
</script>

<style>
@import './assets/cyberpunk.css';

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
}

.content {
  padding: 20px;
  min-height: calc(100vh - 60px);
}

.navbar-user {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .navbar-menu {
    gap: 0;
  }
  .nav-item {
    padding: 10px 12px;
    font-size: 13px;
  }
}
</style>
