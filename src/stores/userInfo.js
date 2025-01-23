import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 保存登录时用户的信息
 */
export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref({
      id: '',
      username: '',
      balance: '',
      avatar: '',
      token: '',
    })
    const setUser = (data) => {
      user.value = data
    }
    //清除信息
    const clearUser = () => {
      user.value.id = ''
      user.value.username = ''
      user.value.token = ''
    }
    return {
      user,
      setUser,
      clearUser,
    }
  },
  {
    persis: true,
  },
)
