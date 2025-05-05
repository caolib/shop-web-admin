<script setup>
import { computed, reactive, ref } from 'vue'
import {
  LockOutlined,
  PhoneOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { loginService, registerService } from '@/api/login.js'
import { message } from 'ant-design-vue'
import { useUserStore } from '@/stores/userInfo.js'

import { jump } from '@/router/jump.js'
import { flushUser } from '@/api/app.js'

const isRegister = ref(false)

const jumpToHome = () => {
  jump('/')
  flushUser()
}

// 加载中
const spinning = ref(false)
const registerSpinning = ref(false)

const userInfo = useUserStore() //用户信息
// 登录表单
const formState = reactive({
  username: '',
  password: '',
})

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  phone: '',
})

// 用户注册
const register = async () => {
  registerSpinning.value = true
  const hide = message.loading('注册中...', 0)
  await registerService(registerForm)
    .then(() => {
      message.success('注册成功!')
      isRegister.value = false
    })
    .finally(() => {
      hide()
      registerSpinning.value = false
    })
}

// 账号密码登录
const onFinish = async () => {
  spinning.value = true
  const hide = message.loading('登录中...', 0)
  await loginService(formState)
    .then((res) => {
      // 保存到pinia
      userInfo.setUser({
        id: res.userId,
        username: res.username,
        balance: res.balance,
        avatar: res.avatar,
        token: res.token,
      })
    })
    .finally(() => {
      hide()
      spinning.value = false
    })
  // 跳转到首页
  jumpToHome()
}

// 判断登录表单是否禁用
const disabled = computed(() => {
  return !(formState.username && formState.password)
})

// 判断注册表单是否禁用
const disabled2 = computed(() => {
  return !(registerForm.username && registerForm.password && registerForm.phone)
})
</script>

<template>
  <a-spin :spinning="spinning" size="large">
    <div class="login-body">
      <div class="login-container">
        <div class="login-content">
          <!-- 左侧品牌区域 -->
          <div class="brand-section">
            <div class="brand-content">
              <h1 class="brand-title">网上商店</h1>
              <p class="brand-slogan">商城管理系统</p>
              <div class="brand-features">
                <div class="feature-item">
                  <div class="feature-icon">🛒</div>
                  <div class="feature-text">商品管理</div>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">📊</div>
                  <div class="feature-text">数据统计</div>
                </div>
                <div class="feature-item">
                  <div class="feature-icon">⚙️</div>
                  <div class="feature-text">系统设置</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧表单区域 -->
          <div class="form-section">
            <div class="login-form">
              <!-- 登录表单 -->
              <a-form v-if="!isRegister" :model="formState" name="normal_login" @finish="onFinish"
                class="form-container">
                <div class="form-header">
                  <h2 class="form-title active">登录</h2>
                  <div class="form-title-divider"></div>
                  <h2 class="form-title" @click="isRegister = true">注册</h2>
                </div>

                <!-- 用户名表单项 -->
                <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                  <a-input v-model:value="formState.username" placeholder="用户名" size="large" class="custom-input">
                    <template #prefix>
                      <UserOutlined class="input-icon" />
                    </template>
                  </a-input>
                </a-form-item>

                <!-- 密码表单项 -->
                <a-form-item name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                  <a-input-password v-model:value="formState.password" placeholder="密码" size="large"
                    class="custom-input">
                    <template #prefix>
                      <LockOutlined class="input-icon" />
                    </template>
                  </a-input-password>
                </a-form-item>

                <!-- 登录按钮和注册链接 -->
                <a-form-item>
                  <a-button :disabled="disabled" :loading="spinning" type="primary" html-type="submit" class="login-btn"
                    size="large">
                    登录
                  </a-button>
                  <div class="form-footer">
                    还没有账号？ <a @click="isRegister = true">立即注册</a>
                  </div>
                </a-form-item>
              </a-form>

              <!-- 注册表单 -->
              <a-form v-else :model="registerForm" name="normal_register" @finish="register" class="form-container">
                <div class="form-header">
                  <h2 class="form-title" @click="isRegister = false">登录</h2>
                  <div class="form-title-divider"></div>
                  <h2 class="form-title active">注册</h2>
                </div>

                <!-- 用户名表单项 -->
                <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                  <a-input v-model:value="registerForm.username" placeholder="用户名" size="large" class="custom-input">
                    <template #prefix>
                      <UserOutlined class="input-icon" />
                    </template>
                  </a-input>
                </a-form-item>

                <!-- 密码表单项 -->
                <a-form-item name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                  <a-input-password v-model:value="registerForm.password" placeholder="密码" size="large"
                    class="custom-input">
                    <template #prefix>
                      <LockOutlined class="input-icon" />
                    </template>
                  </a-input-password>
                </a-form-item>

                <!-- 电话 -->
                <a-form-item name="phone" :rules="[{ required: true, message: '请输入电话!' }]">
                  <a-input v-model:value="registerForm.phone" :maxlength="11" placeholder="手机号码" size="large"
                    class="custom-input">
                    <template #prefix>
                      <PhoneOutlined class="input-icon" />
                    </template>
                  </a-input>
                </a-form-item>

                <!-- 注册按钮 -->
                <a-form-item>
                  <a-button :disabled="disabled2" :loading="registerSpinning" type="primary" html-type="submit"
                    class="login-btn" size="large">
                    注册
                  </a-button>
                  <div class="form-footer">
                    已有账号？ <a @click="isRegister = false">返回登录</a>
                  </div>
                </a-form-item>
              </a-form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-spin>
</template>

<style src="@/assets/styles/login.scss" scoped lang="scss"></style>
