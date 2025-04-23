import { itemStatisticService, payHistoryService } from '../api/statistic.js'
import { predictSalesService } from '../api/predict.js'

/**
 * 计算指定日期之后 N 天的日期。
 * @param {string} dateString - 起始日期字符串
 * @param {number} days - 要增加的天数
 * @returns {string} 计算后的日期字符串
 */
export function getDateAfter(dateString, days) {
  const date = new Date(dateString)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * 获取 N 天前的日期字符串
 * @param {number} daysAgo - 多少天前
 * @returns {string} 日期字符串
 */
function getPastDateString(daysAgo) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

/**
 * 创建 ECharts 实际销量系列的配置对象。
 * @param {Array<number|null>} data - 包含实际销量数据的数组，允许 null 值。
 * @returns {object} ECharts 系列配置对象。
 */
export function createActualSalesSeries(data) {
  return {
    name: '实际销量',
    type: 'line',
    data: data,
    smooth: true,
    itemStyle: {
      color: '#5470C6', // 蓝色系
    },
    lineStyle: {
      width: 2,
    },
  }
}

/**
 * 创建 ECharts 预测销量系列的配置对象。
 * @param {Array<{value: number}|null>} data - 包含预测销量数据的数组 (预测值包装在 value 对象中)，允许 null 值。
 * @param {string} [name='预测销量'] - 系列的显示名称。
 * @returns {object} ECharts 系列配置对象。
 */
export function createPredictedSalesSeries(data, name = '预测销量') {
  return {
    name: name,
    type: 'line',
    data: data,
    smooth: true,
    itemStyle: {
      color: '#91CC75', // 绿色系
    },
    lineStyle: {
      type: 'dashed', // 虚线表示预测
      width: 2,
    },
  }
}

// --- 数据获取与处理逻辑 ---

/**
 * 从原始销售数据中提取唯一的商品列表。
 * @param {Array|null} rawData - 原始销售数据，期望结构：`[{ date, payDetailList: [{itemId, name, num}] }]`。
 * @returns {Array<{id: string, name: string}>} 提取出的商品对象数组 `[{id, name}]`。
 */
function extractProductsFromData(rawData) {
  if (!Array.isArray(rawData)) {
    // console.warn('(statistic.js) extractProductsFromData 接收到的 rawData 不是数组:', rawData); // Optionally keep warn
    return []
  }
  const productsMap = new Map()
  rawData.forEach((dailyEntry) => {
    if (Array.isArray(dailyEntry?.payDetailList)) {
      dailyEntry.payDetailList.forEach((item) => {
        if (item && item.itemId && !productsMap.has(item.itemId)) {
          productsMap.set(item.itemId, {
            id: item.itemId,
            name: item.name || `商品 ${item.itemId}`,
          })
        }
      })
    }
  })
  return Array.from(productsMap.values())
}

/**
 * 获取统计所需的基础数据，支持历史或实时数据。
 * @param {boolean} [isRealTime=false] - 是否获取实时数据（最近14天）。默认为 false (获取历史数据)。
 * @returns {Promise<{allSalesData: Array, products: Array}>} 包含销售数据和商品列表的对象。
 * @throws {Error} 如果 API 请求失败或返回数据格式无效，则抛出错误。
 */
export async function getStatisticsData(isRealTime = false) {
  let response
  const dataSourceName = isRealTime ? '实时 (itemStatisticService)' : '历史 (payHistoryService)'
  try {
    if (isRealTime) {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = getPastDateString(14)
      response = await itemStatisticService(startDate, endDate)
    } else {
      response = await payHistoryService()
    }

    const dataToCheck = response.data

    if (!dataToCheck || !Array.isArray(dataToCheck)) {
      console.error(`(statistic.js) ${dataSourceName} 返回的数据格式无效:`, response) // Keep error log
      throw new Error(`获取的 ${dataSourceName} 数据格式无效`)
    }

    const allSalesData = dataToCheck
    const products = extractProductsFromData(allSalesData)
    return { allSalesData, products }
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('格式无效'))) {
      console.error(`(statistic.js) 获取 ${dataSourceName} 数据时发生网络或服务器错误:`, error) // Keep error log
      throw new Error(`获取 ${dataSourceName} 失败: ` + (error.message || '未知错误'))
    } else {
      throw error
    }
  }
}

/**
 * 调用封装的预测服务来获取销售预测数据。
 * @param {Array<number>} historicalData - 用于生成预测的实际历史销量数组。
 * @param {number} daysToPredict - 需要预测的未来天数。
 * @returns {Promise<Array<number>|null>} 包含预测销量数字的数组；如果服务调用失败，则返回 `null`。
 */
export async function getSalesPrediction(historicalData, daysToPredict) {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    // console.warn('(statistic.js) 无法进行预测：提供的历史数据无效。'); // Optionally keep warn
    return null
  }
  try {
    const predictions = await predictSalesService(historicalData, daysToPredict)
    return predictions
  } catch (error) {
    console.error('(statistic.js) 调用 predictSalesService 时发生意外错误:', error) // Keep error log
    return null
  }
}
