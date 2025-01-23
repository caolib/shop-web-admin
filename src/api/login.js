import request from '@/utils/request'

/**
 * 用户登录
 * @param user 用户信息 {username, password}
 */
const loginService = (user) => {
  return request.post('/users/login', user, { timeout: 5000 })
}
/**
 * github登录
 */
const githubLoginService = (code) => {
  // 获取 URL 中的授权码 code
  return request.get(`/oauth/github?code=${code}`, { timeout: 5000 })
}

export { loginService, githubLoginService }
