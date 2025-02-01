<script setup>
import { reactive, computed, h, onMounted, ref } from 'vue'
import {
  UserOutlined,
  LockOutlined,
  GithubFilled,
  GitlabFilled,
  WechatFilled,
  QqCircleFilled,
  PhoneOutlined,
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
  const hide = message.loading('注册中...', 0)
  await registerService(registerForm).then(() => {
    message.success('注册成功!')
    isRegister.value = false
  }).finally(() => {
    hide()
  })
}

// 账号密码登录
const onFinish = async () => {
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
      <div class="login-form">
        <!-- 登录表单 -->
        <a-form v-if="!isRegister" :model="formState" name="normal_login" @finish="onFinish">
          <div class="form-header">
            <h2 class="form-title">登录</h2>
            <h2 class="form-title" @click="isRegister = true"><a>注册</a></h2>
          </div>

          <!-- 用户名表单项 -->
          <a-form-item label="账号" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
            <a-input v-model:value="formState.username">
              <template #prefix>
                <UserOutlined class="site-form-item-icon" />
              </template>
            </a-input>
          </a-form-item>

          <!-- 密码表单项 -->
          <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
            <a-input-password v-model:value="formState.password">
              <template #prefix>
                <LockOutlined class="site-form-item-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <!-- 登录按钮和注册链接 -->
          <a-form-item>
            <a-button :disabled="disabled" :loading="spinning" type="primary" html-type="submit"
              class="login-form-button">
              登录
            </a-button>
            或
            <a @click="() => {
              isRegister = true
            }
              ">立即注册</a>
          </a-form-item>
        </a-form>

        <!-- 注册表单 -->
        <a-form v-else :model="registerForm" name="normal_register" @finish="register">
          <div class="form-header">
            <h2 class="form-title" @click="isRegister = false"><a>登录</a></h2>
            <h2 class="form-title">注册</h2>
          </div>
          <!-- 用户名表单项 -->
          <a-form-item label="账号" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
            <a-input v-model:value="registerForm.username">
              <template #prefix>
                <UserOutlined class="site-form-item-icon" />
              </template>
            </a-input>
          </a-form-item>

          <!-- 密码表单项 -->
          <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
            <a-input-password v-model:value="registerForm.password"
              @blur="() => validatePassword(null, registerForm.password)">
              <template #prefix>
                <LockOutlined class="site-form-item-icon" />
              </template>
            </a-input-password>
          </a-form-item>

          <!-- 电话 -->
          <a-form-item label="电话" name="phone" :rules="[{ required: true, message: '请输入电话!' }]">
            <a-input v-model:value="registerForm.phone" :maxlength="11">
              <template #prefix>
                <PhoneOutlined class="site-form-item-icon" />
              </template>
            </a-input>
          </a-form-item>

          <!-- 登录按钮和注册链接 -->
          <a-form-item>
            <a-button :disabled="disabled2" :loading="registerSpinning" type="primary" html-type="submit"
              class="login-form-button">
              注册
            </a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </a-spin>
</template>

<style src="@/assets/styles/login.scss" scoped lang="scss">
</style>
