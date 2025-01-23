import request from '@/utils/request'

/**
 * 分页搜索商品
 */
const searchService = (searchParams) => {
  if (searchParams.minPrice) searchParams.minPrice *= 100
  if (searchParams.maxPrice) searchParams.maxPrice *= 100
  return request.get('/search/list', { params: searchParams })
}

const queryCommodityById = (id) => {
  return request.get('/commodity/' + id)
}

export { searchService, queryCommodityById }
