<script setup>
import { computed, onMounted, onUnmounted, ref, h } from 'vue'
import {
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ExpandOutlined,
  CloseOutlined,
  MinusOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { checkSrv, getServiceStatus } from '@/api/status.js'
import { useRoute } from 'vue-router'
import { logout } from '@/api/login.js'
import { flushUser, isLogin, user } from '@/api/app.js'
import { goPage } from './router/jump'
import { getCurrentWindow } from '@tauri-apps/api/window'

const route = useRoute()
const isActive = (path) => route.path === path // 判断当前显示的页面

const serviceStatus = ref(new Map()) // 服务状态
// 所有服务是否正常
const allServicesUp = computed(() => {
  return Array.from(serviceStatus.value.values()).every((status) => status)
})

onMounted(() => {
  flushUser()
  getServiceStatus(serviceStatus)
  const intervalId = setInterval(() => getServiceStatus(serviceStatus), 60000) // 60s执行一次
  onUnmounted(() => clearInterval(intervalId))
})

// 窗口操作
const appWindow = getCurrentWindow()

const minimize = () => {
  appWindow.minimize()
}
const toggleMaximize = () => {
  appWindow.toggleMaximize()
}
const close = () => {
  appWindow.close()
}

// 刷新页面
const flushPage = () => {
  location.reload()
}
</script>

<template>
  <!--顶部导航栏-->
  <div class="top-navbar" data-tauri-drag-region>
    <div class="bread-navbar">
      <a-breadcrumb separator=" ">
        <!--首页-->
        <a-breadcrumb-item>
          <router-link to="/" :class="['route-link', { active: isActive('/') }]">
            <home-outlined />
            首页
          </router-link>
        </a-breadcrumb-item>
        <!--登录-->
        <a-breadcrumb-item>
          <router-link to="/user" :class="['route-link', { active: isActive('/user') }]">
            <user-outlined />
            <span v-if="isLogin"> 你好,{{ user.username }} </span>
            <span v-else>
              <router-link to="/login" :class="['route-link', { active: isActive('/login') }]">&nbsp;请登录
              </router-link>
            </span>
          </router-link>
        </a-breadcrumb-item>

        <!--注册-->
        <a-breadcrumb-item v-if="!isLogin">
          <router-link to="" :class="['route-link']">
            <span>注册</span>
          </router-link>
        </a-breadcrumb-item>

        <!--搜索商品-->
        <a-breadcrumb-item>
          <router-link to="/search" :class="['route-link', { active: isActive('/search') }]">
            <SearchOutlined />
            搜索商品
          </router-link>
        </a-breadcrumb-item>

        <!--购物车-->
        <a-breadcrumb-item>
          <router-link to="/cart" :class="['route-link', { active: isActive('/cart') }]">
            <ShoppingCartOutlined />
            购物车
          </router-link>
        </a-breadcrumb-item>

        <!--我的订单-->
        <a-breadcrumb-item>
          <router-link to="/order-list" :class="['route-link', { active: isActive('/order-list') }]">
            <FileTextOutlined />
            我的订单
          </router-link>
        </a-breadcrumb-item>

        <!--退出登录-->
        <a-breadcrumb-item v-if="isLogin" class="logout" @click="logout('')">
          <LogoutOutlined />
          退出登录
        </a-breadcrumb-item>

        <!--服务状态-->
        <a-breadcrumb-item>
          <a-dropdown>
            <CheckCircleFilled style="color: #00b96b" v-if="allServicesUp" />
            <ExclamationCircleFilled style="color: #f30213" v-else />
            <template #overlay>
              <a-menu>
                <a-menu-item v-for="(status, service) in serviceStatus" :key="service">
                  <span @click="checkSrv(status[0])" :style="{ color: status[1] ? '#00b96b' : '#f30213' }">{{ status[0]
                    }}</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-breadcrumb-item>
      </a-breadcrumb>

    </div>

    <!-- 窗口操作 -->
    <div class="window-controls">
      <!--回退-->
      <a-button class="win-btn" @click="goPage(-1)" :icon="h(ArrowLeftOutlined)" />
      <!--前进-->
      <a-button class="win-btn" @click="goPage(1)" :icon="h(ArrowRightOutlined)" />
      <!--刷新-->
      <a-button class="win-btn" @click="flushPage" :icon="h(ReloadOutlined)" />
      <!--最小化-->
      <a-button class="win-btn" @click="minimize" :icon="h(MinusOutlined)" />
      <!--切换最大化-->
      <a-button class="win-btn" @click="toggleMaximize" :icon="h(ExpandOutlined)" />
      <!--关闭-->
      <a-button class="win-btn close" @click="close" :icon="h(CloseOutlined)" />
    </div>

  </div>



  <!--路由页面-->
  <a-config-provider :theme="{ token: { colorPrimary: '#00b96b' } }">
    <RouterView style="margin-top: 40px" />
    <a-back-top />
  </a-config-provider>
</template>

<style scoped lang="less">
@import '@/styles/var';

.top-navbar {
  display: flex;
  justify-content: space-between;
  height: auto;
  position: fixed;
  top: 0;
  background: white;
  width: 100%;
  z-index: 1000;
  border-bottom: @border;
}

.bread-navbar {
  padding: 5px 15px;
}

.route-link:hover,
a:hover {
  color: @primary-color !important;
}

.logout:hover {
  cursor: pointer;
  color: @red;
}


.active {
  color: @primary-color !important;
}

.win-btn {
  border: 0;
  font-size: 10px;
}

.win-btn:hover {
  background: #e0e0e0;
  color: @primary-color;
}

.win-btn.close:hover {
  background: @red;
}
</style>
