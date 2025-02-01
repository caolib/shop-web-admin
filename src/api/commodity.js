import request from '@/utils/request'


/**
 * 更新商品
 * @param commodity 商品信息
 */
const updateCommodityService = (commodity) => {
    return request.put('/commodity/admin', commodity)
}


export { updateCommodityService }