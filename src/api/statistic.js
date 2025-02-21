import request from '@/utils/request'

/**
 * 近七天的支付统计
 */
const weekStatisticService = (days) => {
    return request.get('/pays/manage', { params: { days } })
}

export {
    weekStatisticService
}