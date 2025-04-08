import request from '@/utils/request'

/**
 * 近七天的支付统计
 */
const weekStatisticService = (days) => {
    return request.get('/pays/manage', { params: { days } })
}

/**
 * 一段时间内的商品销量详情
 */
const itemStatisticService = (durationStart, durationEnd) => {
    return request.get('/pays/manage/pay-detail', { params: { durationStart, durationEnd } })
}


export {
    weekStatisticService,
    itemStatisticService
}