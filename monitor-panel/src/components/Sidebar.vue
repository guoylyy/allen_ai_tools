<template>
  <div class="sidebar">
    <div class="logo">
      <span class="logo-icon">🖥️</span>
      <span class="logo-text">运维控制台</span>
    </div>
    <nav class="nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <span class="nav-icon">📊</span>
        <span class="nav-text">总览</span>
      </router-link>
      <router-link to="/servers" class="nav-item" :class="{ active: $route.path === '/servers' }">
        <span class="nav-icon">🖥️</span>
        <span class="nav-text">基础设施</span>
      </router-link>
      <router-link to="/apm" class="nav-item" :class="{ active: $route.path === '/apm' }">
        <span class="nav-icon">⚡</span>
        <span class="nav-text">应用性能</span>
      </router-link>
      <router-link to="/services" class="nav-item" :class="{ active: $route.path === '/services' }">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">服务</span>
      </router-link>
      <router-link to="/costs" class="nav-item" :class="{ active: $route.path === '/costs' }">
        <span class="nav-icon">💰</span>
        <span class="nav-text">成本</span>
      </router-link>
      <router-link to="/alerts" class="nav-item" :class="{ active: $route.path === '/alerts' }">
        <span class="nav-icon">🔔</span>
        <span class="nav-text">告警</span>
      </router-link>
      <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">配置</span>
      </router-link>
    </nav>
    
    <div class="sidebar-footer">
      <div class="version">v1.0.0</div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 200px;
  background: linear-gradient(180deg, #1a237e 0%, #283593 100%);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: bold;
}

.nav {
  padding: 16px 0;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
  margin: 2px 8px;
  border-radius: 8px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: rgba(255,255,255,0.2);
  color: white;
  border-left: none;
}

.nav-icon {
  margin-right: 12px;
  font-size: 18px;
}

.nav-text {
  font-size: 14px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.version {
  color: rgba(255,255,255,0.5);
  font-size: 12px;
}
</style>
