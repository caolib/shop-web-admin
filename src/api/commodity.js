import request from '@/utils/request'


/**
 * 更新商品
 * @param commodity 商品信息
 */
const updateCommodityService = (commodity) => {
    return request.put('/commodity/admin', commodity)
}

/**
 * 添加商品
 * @param commodity 商品信息
 */
const addCommodityService = (commodity) => {
    return request.post('/commodity/admin', commodity)
}

export {
    updateCommodityService,
    addCommodityService
}