<script setup>
import { onMounted, onUnmounted, h } from 'vue'
import { useRoute } from 'vue-router' // 新增 useRoute 导入
import {
  serviceStatus,
  allServicesUp,
  minimize,
  toggleMaximize,
  close,
  flushPage
} from '@/scripts/app'

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
import { logout } from '@/api/login.js'
import { flushUser, isLogin, user } from '@/api/app.js'
import { goPage } from './router/jump'


const route = useRoute()
// 修改 isActive 定义，避免 route 未定义时报错
const isActive = (path) => route?.path === path;

onMounted(() => {
  flushUser()
  getServiceStatus(serviceStatus)
  const intervalId = setInterval(() => getServiceStatus(serviceStatus), 60000) // 60s执行一次
  onUnmounted(() => clearInterval(intervalId))
})

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
          <router-link to="/" style="cursor: unset;" :class="['route-link', { active: isActive('/login') }]">
            <user-outlined />
            <span v-if="isLogin"> 你好,{{ user.username }} </span>
            <span v-else>
              <router-link to="/login" :class="['route-link']">&nbsp;请登录
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

      </a-breadcrumb>

    </div>

    <!-- 窗口操作 -->
    <div class="window-controls">
      <!--服务状态-->
      <a-dropdown>
        <a-button style="color: #00b96b" class="win-btn" v-if="allServicesUp" :icon="h(CheckCircleFilled)" />
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


<style src="@/assets/styles/app.scss" scoped lang="scss"></style>