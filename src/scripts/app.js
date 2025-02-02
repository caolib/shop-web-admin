import { computed, onMounted, onUnmounted, ref, h } from 'vue'
import { checkSrv, getServiceStatus } from '@/api/status.js'
import { logout } from '@/api/login.js'
import { flushUser, isLogin, user } from '@/api/app.js'
import { goPage, jump } from '@/router/jump'
import { getCurrentWindow } from '@tauri-apps/api/window'

const serviceStatus = ref(new Map()) // 服务状态
// 所有服务是否正常
const allServicesUp = computed(() => {
    return Array.from(serviceStatus.value.values()).every((status) => status)
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



export {
    serviceStatus,
    allServicesUp,
    appWindow,
    minimize,
    toggleMaximize,
    close,
    flushPage
}