import request from '@/utils/request'

/**
 * 搜索首页商品
 */
const searchHomeService = () => {
  return request.get('/commodity/home')
}

/**
 * 搜索商品
 */
const searchService = (searchParams) => {
  // 设置默认页码和页大小
  if (!searchParams.pageNo) searchParams.pageNo = 1;
  // 价格转为分
  if (searchParams.minPrice) searchParams.minPrice *= 100
  if (searchParams.maxPrice) searchParams.maxPrice *= 100
  return request.get('/commodity/list', { params: searchParams })
}

/**
 * 根据id查询商品
 * @param {string} id 商品id
 */
const queryCommodityById = (id) => {
  return request.get('/commodity/' + id)
}

export { searchService, queryCommodityById, searchHomeService }
