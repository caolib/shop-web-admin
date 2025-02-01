import request from '@/utils/request'
import { useUserStore } from '@/stores/userInfo.js'
import { jump } from '@/router/jump'
import { message } from 'ant-design-vue'
import { isLogin } from '@/api/app.js'


/**
 * 用户登录
 * @param user 用户信息 {username, password}
 */
const loginService = (user) => {
  user.identity = 'admin'
  return request.post('/users/admin/login', user, { timeout: 5000 })
}

/**
 * 管理员用户注册
 * @param user 管理员信息 {username,password,phone}
 */
const registerService = (user) => {
  return request.post('/users/admin/register', user)
}


// 退出登录
const logout = (msg) => {
  console.log(msg)
  //TODO 退出登录，后端删除用户相关信息和token
  const userInfo = useUserStore()
  userInfo.clearUser()
  jump('/login')
  msg = msg !== '' ? msg : '成功退出登录'
  message.success(msg)
  isLogin.value = false
}

export {
  loginService,
  registerService,
  logout
}
