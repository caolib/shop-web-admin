<script setup>
import { h, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  allServicesUp,
  close,
  flushPage,
  minimize,
  serviceStatus,
  toggleMaximize,
} from '@/scripts/app'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseOutlined,
  DownOutlined,
  ExclamationCircleFilled,
  ExpandOutlined,
  FileTextOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MinusOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingFilled,
  UserOutlined,
} from '@ant-design/icons-vue'
import { checkSrv, getServiceStatus } from '@/api/status.js'
import { logout } from '@/api/login.js'
import { flushUser, isLogin, user } from '@/api/app.js'
import { goPage, jump } from './router/jump'
import { message } from 'ant-design-vue'

dayjs.locale('zh-cn')

const spinning = ref(false)
const route = useRoute()
// 修改 isActive 定义，避免 route 未定义时报错
const isActive = (path) => route?.path === path

onMounted(() => {
  spinning.value = true
  flushUser()
  getServiceStatus(serviceStatus)
  const intervalId = setInterval(() => getServiceStatus(serviceStatus), 60000)
  onUnmounted(() => {
    clearInterval(intervalId)
  })
  spinning.value = false
})

// 检查选中的服务
const checkSelectedService = (service) => {
  const status = checkSrv(service)
  message[status ? 'success' : 'error'](`${service} 服务${status ? '正常' : '异常'}`)
}
</script>

<template>
  <a-spin :spinning="spinning">
    <!--顶部导航栏-->
    <div class="top-navbar" data-tauri-drag-region>
      <div class="nav-container">
        <!-- 用户信息 -->
        <div class="nav-section">
          <a-dropdown v-if="isLogin">
            <span class="user-info">
              <user-outlined />
              <span>
                你好,{{
                  user.username
                    ? user.username.length > 6
                      ? user.username.substring(0, 6) + '...'
                      : user.username
                    : ''
                }}
              </span>
            </span>
            <template #overlay>
              <a-menu>
                <a-menu-item key="about">
                  <router-link to="/about" class="dropdown-link">
                    <info-circle-outlined />
                    关于
                  </router-link>
                </a-menu-item>
                <a-menu-item key="logout">
                  <span class="dropdown-link logout-link" @click="logout('')">
                    <LogoutOutlined />
                    退出
                  </span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <router-link v-else to="/login" :class="['nav-link', { active: isActive('/login') }]">
            <user-outlined />
            请登录
          </router-link>
        </div>

        <!-- 导航链接 -->
        <div class="nav-links">
          <router-link to="/" :class="['nav-link', { active: isActive('/') }]">
            <home-outlined />
            <span>首页</span>
          </router-link>

          <router-link to="/search" :class="['nav-link', { active: isActive('/search') }]">
            <SearchOutlined />
            <span>商品管理</span>
          </router-link>

          <router-link to="/user" :class="['nav-link', { active: isActive('/user') }]">
            <user-outlined />
            <span>用户管理</span>
          </router-link>

          <router-link to="/order-list" :class="['nav-link', { active: isActive('/order-list') }]">
            <FileTextOutlined />
            <span>订单管理</span>
          </router-link>

          <router-link to="/statistics" :class="['nav-link', { active: isActive('/statistics') }]">
            <PieChartOutlined />
            <span>统计</span>
          </router-link>
        </div>
      </div>

      <!-- 窗口操作区域 -->
      <div class="window-controls">
        <!--设置-->
        <a-tooltip title="系统设置" placement="bottom">
          <a-button class="win-btn" style="color:grey" type="text" @click="jump('/config')" :icon="h(SettingFilled)" />
        </a-tooltip>

        <!--服务状态-->
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <a-tooltip :title="allServicesUp ? '所有服务正常' : '服务异常'" placement="bottom">
            <a-button type="text" class="win-btn status-btn" v-if="allServicesUp" :icon="h(CheckCircleFilled)" />
            <a-button type="text" class="win-btn status-btn error" v-else :icon="h(ExclamationCircleFilled)" />
          </a-tooltip>
          <template #overlay>
            <a-menu class="service-menu">
              <a-menu-item v-for="(status, service) in serviceStatus" :key="service">
                <span @click="checkSelectedService(status[0])" class="service-item"
                  :class="{ 'service-error': !status[1] }">
                  <template v-if="status[1]">
                    <check-circle-filled class="status-icon success" />
                  </template>
                  <template v-else>
                    <exclamation-circle-filled class="status-icon error" />
                  </template>
                  {{ status[0] }}
                </span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <!-- 导航控制 -->
        <div class="nav-controls">
          <a-tooltip title="后退" placement="bottom">
            <a-button class="win-btn" type="text" @click="goPage(-1)" :icon="h(ArrowLeftOutlined)" />
          </a-tooltip>
          <a-tooltip title="前进" placement="bottom">
            <a-button class="win-btn" type="text" @click="goPage(1)" :icon="h(ArrowRightOutlined)" />
          </a-tooltip>
        </div>

        <!-- 窗口控制 -->
        <div class="window-action-controls">
          <a-tooltip title="最小化" placement="bottom">
            <a-button class="win-btn" type="text" @click="minimize" :icon="h(MinusOutlined)" />
          </a-tooltip>
          <a-tooltip title="最大化/还原" placement="bottom">
            <a-button class="win-btn maximize" type="text" @click="toggleMaximize">
              <expand-outlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="关闭" placement="bottom">
            <a-button class="win-btn close" type="text" @click="close" :icon="h(CloseOutlined)" />
          </a-tooltip>
        </div>
      </div>
    </div>

    <!--路由页面-->
    <a-config-provider :locale="zhCN" :theme="{ token: { colorPrimary: '#00b96b' } }">
      <div class="main-container">
        <RouterView />
      </div>
      <a-back-top />
    </a-config-provider>
  </a-spin>
</template>

<style src="@/assets/styles/app.scss" scoped lang="scss"></style>

<style lang="scss">
@use "@/assets/styles/variables.scss" as *;
@use "sass:color";

.main-container {
  margin-top: 48px;
  padding: $spacing-md;
  min-height: calc(100vh - 48px);
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

// 全局卡片样式优化
.ant-card {
  border-radius: $border-radius;
  overflow: hidden;
  transition: $transition-normal;

  &:hover {
    box-shadow: $hover-shadow;
  }
}

// 表单样式
.ant-form-item-label {
  font-weight: 500;
}

// 按钮样式
.ant-btn {
  border-radius: $border-radius;
  transition: $transition-normal;

  &.ant-btn-primary {

    &:hover,
    &:focus {
      background-color: color.adjust($primary-color, $lightness: -5%);
      border-color: color.adjust($primary-color, $lightness: -5%);
    }
  }
}

// 表格样式优化
.ant-table {
  border-radius: $border-radius;
  overflow: hidden;

  .ant-table-thead>tr>th {
    background-color: rgba($primary-color, 0.05);
  }

  .ant-table-tbody>tr:hover>td {
    background-color: rgba($primary-color, 0.05);
  }
}

// 分页器样式
.ant-pagination-item-active {
  border-color: $primary-color;

  a {
    color: $primary-color;
  }
}
</style>
