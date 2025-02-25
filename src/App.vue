<script setup>
import { ref, onMounted, onUnmounted, h } from 'vue'
import { useRoute } from 'vue-router'
import {
  serviceStatus,
  allServicesUp,
  minimize,
  toggleMaximize,
  close,
  flushPage,
  appWindow
} from '@/scripts/app'
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
dayjs.locale("zh-cn");
import {
  FileTextOutlined, HomeOutlined, LogoutOutlined, SearchOutlined, ShoppingCartOutlined, UserOutlined, CheckCircleFilled, ExclamationCircleFilled, ArrowLeftOutlined, ArrowRightOutlined, ExpandOutlined, CloseOutlined, MinusOutlined, ReloadOutlined, PayCircleOutlined, PieChartOutlined
} from '@ant-design/icons-vue'
import { checkSrv, getServiceStatus } from '@/api/status.js'
import { logout } from '@/api/login.js'
import { flushUser, isLogin, user } from '@/api/app.js'
import { goPage } from './router/jump'

const spinning = ref(false)
const route = useRoute()
// 修改 isActive 定义，避免 route 未定义时报错
const isActive = (path) => route?.path === path;

onMounted(() => {
  spinning.value = true
  flushUser()
  getServiceStatus(serviceStatus)
  const intervalId = setInterval(() => getServiceStatus(serviceStatus), 60000)
  onUnmounted(() => { clearInterval(intervalId) })
  spinning.value = false
})


</script>


<template>
  <a-spin :spinning="spinning">
    <!--顶部导航栏-->
    <div class="top-navbar" data-tauri-drag-region>
      <div class="bread-navbar">
        <a-breadcrumb separator=" ">
          <!--登录-->
          <a-breadcrumb-item>
            <span v-if="isLogin" style="padding: 5px;border-radius: 5px">
              <user-outlined />
              <span> 你好,{{ user.username ? (user.username.length > 6 ? user.username.substring(0, 6) + '...' :
                user.username) : '' }} </span>
            </span>
            <router-link v-else to="/login" :class="['route-link', { active: isActive('/login') }]">
              <user-outlined />
              请登录
            </router-link>
          </a-breadcrumb-item>

          <!--首页-->
          <a-breadcrumb-item>
            <router-link to="/" :class="['route-link', { active: isActive('/') }]">
              <home-outlined />
              首页
            </router-link>
          </a-breadcrumb-item>

          <!--商品-->
          <a-breadcrumb-item>
            <router-link to="/search" :class="['route-link', { active: isActive('/search') }]">
              <SearchOutlined />
              商品管理
            </router-link>
          </a-breadcrumb-item>

          <!--用户-->
          <a-breadcrumb-item>
            <router-link to="/user" :class="['route-link', { active: isActive('/user') }]">
              <user-outlined />
              用户管理
            </router-link>
          </a-breadcrumb-item>

          <!--订单管理-->
          <a-breadcrumb-item>
            <router-link to="/order-list" :class="['route-link', { active: isActive('/order-list') }]">
              <FileTextOutlined />
              订单管理
            </router-link>
          </a-breadcrumb-item>

          <!--统计-->
          <a-breadcrumb-item>
            <router-link to="/statistics" :class="['route-link', { active: isActive('/statistics') }]">
              <PieChartOutlined />
              统计
            </router-link>
          </a-breadcrumb-item>

          <!--关于-->
          <a-breadcrumb-item>
            <router-link to="/about" :class="['route-link', { active: isActive('/about') }]">
              关于
            </router-link>
          </a-breadcrumb-item>

          <!-- 设置 -->
          <a-breadcrumb-item>
            <router-link to="/config" :class="['route-link', { active: isActive('/config') }]">
              设置
            </router-link>
          </a-breadcrumb-item>

          <!--退出登录-->
          <a-breadcrumb-item v-if="isLogin" style="color: gray;" class="logout" @click="logout('')">
            <LogoutOutlined />
            退出登录
          </a-breadcrumb-item>

        </a-breadcrumb>

      </div>

      <!-- 修改窗口操作区域，使用 v-if 渲染图标 -->
      <div class="window-controls">
        <!--服务状态-->
        <a-dropdown>
          <a-button style="color: #00b96b" class="win-btn" v-if="allServicesUp" :icon="h(CheckCircleFilled)" />
          <a-button style="color: #f30213" class="win-btn" v-else :icon="h(ExclamationCircleFilled)" />
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
        <!--切换最大化按钮-->
        <a-button class="win-btn" @click="toggleMaximize">
          <expand-outlined />
        </a-button>
        <!--关闭-->
        <a-button class="win-btn close" @click="close" :icon="h(CloseOutlined)" />
      </div>

    </div>

    <!--路由页面-->
    <a-config-provider :locale="zhCN" :theme="{ token: { colorPrimary: '#00b96b' } }">
      <RouterView style="margin-top: 40px" />
      <a-back-top />
    </a-config-provider>

  </a-spin>
</template>


<style src="@/assets/styles/app.scss" scoped lang="scss"></style>