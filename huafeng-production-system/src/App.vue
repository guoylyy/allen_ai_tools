<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-brand">🚍 华丰智造</div>
      <div class="navbar-menu">
        <router-link to="/" class="nav-item">📊 进度看板</router-link>
        <router-link to="/orders" class="nav-item">📋 生产排单</router-link>
        <router-link to="/report" class="nav-item">📝 扫码报工</router-link>
        <router-link to="/stats" class="nav-item">📈 效率统计</router-link>
        <router-link to="/boss" class="nav-item">📺 老板看板</router-link>
        <router-link to="/workers" class="nav-item">👥 员工管理</router-link>
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
@import './assets/huafeng.css';

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
