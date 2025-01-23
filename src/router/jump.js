import router from "."


// 跳转到指定商品页面
const jumpToItem = (id) => {
    router.push({ path: '/commodity', query: { id } })
}

// 跳转到支付页面
const jumpToPay = (orderId) => {
    router.push({ path: '/pay', query: { orderId } })
}

const jump = (path) => {
    router.push({ path })
}

export { jumpToItem, jump, jumpToPay }
