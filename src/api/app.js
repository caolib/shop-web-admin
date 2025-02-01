import { ref } from 'vue'
import { useUserStore } from '@/stores/userInfo.js'

const isLogin = ref(false) // 用户是否已登录
let user

const flushUser = () => {
  user = useUserStore().user
  isLogin.value = user.token !== ''
}

export { user, isLogin, flushUser }
