import request from '@/utils/request'

/**
 * 近七天的支付统计
 */
const weekStatisticService = () => {
    return request.get('/pays/manage')
}

export {
    weekStatisticService
}