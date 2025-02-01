import router from "."

// 跳转到指定页面
const jump = (path) => {
    router.push({ path })
}

// 跳转到指定商品页面
const jumpToItem = (id) => {
    router.push({ path: '/commodity', query: { id } })
}

// 跳转到支付页面
const jumpToPay = (orderId) => {
    router.push({ path: '/pay', query: { orderId } })
}



// 跳转到指定页面并携带参数
const jumpWithQuery = (path, query) => {
    router.push({ path, query })
}

// 回退(-)或前进(+)num个页面
const goPage = (num) => {
    router.go(num)
}


export {
    jumpToItem,
    jump,
    jumpToPay,
    jumpWithQuery,
    goPage
}
