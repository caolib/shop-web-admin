<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import {
  createActualSalesSeries,
  createPredictedSalesSeries,
  getDateAfter,
  getSalesPrediction,
  getStatisticsData,
} from '@/scripts/statistic.js'
import { getCommodityService } from '@/api/commodity.js'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Row,
  Select,
  Space,
  Spin,
} from 'ant-design-vue'
import { jumpToItem } from '@/router/jump'

const chartContainer = ref(null)
const availableProducts = ref([])
const targetItemId = ref('')
const allSalesData = ref(null)
let chartInstance = null

const isLoadingList = ref(true)
const isLoadingPrediction = ref(false)
const currentProductInfo = ref(null)
const stockMessage = ref('')
const isLoadingProductInfo = ref(false)

const predictionStatusMessage = ref('')
const isRealTime = ref(false)

// Add new refs for weekly totals
const firstWeekSalesTotal = ref(null)
const secondWeekSalesTotal = ref(null)

const buttonText = computed(() => {
  return isRealTime.value ? '切换到历史数据' : '切换到实时数据'
})

/**
 * 处理商品选择变化
 */
async function handleProductChange(newValue) {
  targetItemId.value = newValue
  await initStatistics()
}

/**
 * 获取商品详情预测并进行库存检查
 */
async function fetchProductAndCheckStock(itemId, predictions7DayFuture) {
  isLoadingProductInfo.value = true
  stockMessage.value = '正在检查库存...'
  currentProductInfo.value = null

  try {
    const productInfo = await getCommodityService(itemId)
    currentProductInfo.value = productInfo

    const currentStockValue = Number(productInfo.stock)

    if (predictions7DayFuture) {
      const totalPredictedSales = predictions7DayFuture.reduce((sum, val) => sum + val, 0)
      if (currentStockValue >= totalPredictedSales) {
        stockMessage.value = `库存充足 (当前: ${currentStockValue}, 预测销量: ${totalPredictedSales.toFixed(0)})`
      } else {
        stockMessage.value = `库存可能不足! (当前: ${currentStockValue}, 预测销量: ${totalPredictedSales.toFixed(0)})`
      }
    } else {
      stockMessage.value = `当前库存: ${currentStockValue} (无足够历史数据进行消耗预测)`
    }
  } catch (error) {
    console.error('(View) 获取商品详情或处理库存时出错:', error) // Keep error logs
    stockMessage.value = '获取库存信息失败'
  } finally {
    isLoadingProductInfo.value = false
  }
}

/**
 * 切换数据源
 */
const toggleDataSource = async () => {
  isRealTime.value = !isRealTime.value
  await loadInitialData()
  if (targetItemId.value) {
    await initStatistics()
  } else {
    if (chartInstance) {
      chartInstance.clear()
      chartInstance.setOption({ title: { text: '请选择一个商品', left: 'center', top: 'center' } })
    }
  }
}

/**
 * 加载初始数据 (商品列表和历史数据) - Uses getStatisticsData
 */
async function loadInitialData() {
  isLoadingList.value = true
  availableProducts.value = []
  targetItemId.value = ''
  allSalesData.value = null

  try {
    const { allSalesData: fetchedData, products: fetchedProducts } = await getStatisticsData(
      isRealTime.value,
    )

    allSalesData.value = fetchedData
    availableProducts.value = fetchedProducts

    if (availableProducts.value.length > 0) {
      targetItemId.value = availableProducts.value[0].id
    } else {
      targetItemId.value = ''
    }
  } catch (error) {
    console.error('(View) 加载初始数据失败:', error.message || error) // Keep error logs
    availableProducts.value = []
    targetItemId.value = ''
    allSalesData.value = []
    predictionStatusMessage.value = '加载基础销售数据失败，请稍后重试'
  } finally {
    isLoadingList.value = false
  }
}

/**
 * 初始化或更新 ECharts 图表 (基于历史数据) - Uses getSalesPrediction
 */
async function initStatistics() {
  if (!chartInstance || !targetItemId.value || !Array.isArray(allSalesData.value)) {
    if (chartInstance) {
      chartInstance.clear()
      chartInstance.setOption({
        title: { text: '数据无效或未选择商品', left: 'center', top: 'center' },
      })
    }
    return
  }

  isLoadingPrediction.value = false
  predictionStatusMessage.value = ''
  stockMessage.value = ''
  currentProductInfo.value = null
  // Reset weekly totals
  firstWeekSalesTotal.value = null
  secondWeekSalesTotal.value = null

  const salesMap = new Map()
  allSalesData.value.forEach((dailyEntry) => {
    if (!dailyEntry || !dailyEntry.date || typeof dailyEntry.date !== 'string') return
    const date = dailyEntry.date.substring(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    if (!salesMap.has(date)) {
      salesMap.set(date, 0)
    }
    if (Array.isArray(dailyEntry.payDetailList)) {
      dailyEntry.payDetailList.forEach((item) => {
        if (item && item.itemId === targetItemId.value) {
          const currentSales = salesMap.get(date) || 0
          salesMap.set(date, currentSales + (Number(item.num) || 0))
        }
      })
    }
  })

  const itemDailySalesResult = Array.from(salesMap.entries())
    .map(([time, num]) => ({ time, num }))
    .sort((a, b) => new Date(a.time) - new Date(b.time))
  const actualSales = itemDailySalesResult.map((item) => item.num)
  const allRawDates = itemDailySalesResult.map((item) => item.time)
  const historyLength = actualSales.length

  // Calculate weekly totals
  if (historyLength >= 7) {
    firstWeekSalesTotal.value = actualSales
      .slice(0, 7)
      .reduce((sum, val) => sum + (val || 0), 0)
      .toFixed(0)
  } else {
    firstWeekSalesTotal.value = '数据不足'
  }

  if (historyLength >= 14) {
    secondWeekSalesTotal.value = actualSales
      .slice(7, 14)
      .reduce((sum, val) => sum + (val || 0), 0)
      .toFixed(0)
  } else if (historyLength >= 7) {
    // Only show 'insufficient data' if there's at least one week
    secondWeekSalesTotal.value = '数据不足'
  } else {
    secondWeekSalesTotal.value = null // Don't show if less than 7 days
  }

  const daysToPredictFuture = 7
  let future7DayPredictions = null
  let isPredictionSuccessful = false
  const minHistoryForApi = 14

  if (historyLength >= minHistoryForApi) {
    isLoadingPrediction.value = true
    predictionStatusMessage.value = '正在获取预测数据...'
    try {
      future7DayPredictions = await getSalesPrediction(actualSales, daysToPredictFuture)
      if (future7DayPredictions !== null) {
        isPredictionSuccessful = true
        predictionStatusMessage.value = ''
      } else {
        console.error('(View) 获取预测数据失败 (可能 API 错误或网络问题).') // Keep error log
        predictionStatusMessage.value = '获取预测数据失败'
        isPredictionSuccessful = false
      }
    } catch (error) {
      console.error('(View) 调用预测功能时发生意外错误:', error) // Keep error log
      predictionStatusMessage.value = '预测功能内部出错'
      isPredictionSuccessful = false
    } finally {
      isLoadingPrediction.value = false
    }
  } else {
    predictionStatusMessage.value = `历史数据天数 (${historyLength}) 不足 ${minHistoryForApi} 天，无法进行预测`
    isPredictionSuccessful = false
  }

  await fetchProductAndCheckStock(
    targetItemId.value,
    isPredictionSuccessful ? future7DayPredictions : null,
  )

  let chartDates = [...allRawDates]
  let chartActual = [...actualSales]
  let chartPredicted = Array(historyLength).fill(null)
  const predictionLegendName = '预测销量'
  if (isPredictionSuccessful && future7DayPredictions) {
    let lastHistoricalDate =
      allRawDates.length > 0
        ? allRawDates[historyLength - 1]
        : new Date().toISOString().substring(0, 10)
    for (let i = 1; i <= daysToPredictFuture; i++) {
      chartDates.push(getDateAfter(lastHistoricalDate, i))
    }
    chartActual = chartActual.concat(Array(daysToPredictFuture).fill(null))
    future7DayPredictions.forEach((pred) => chartPredicted.push({ value: pred }))
  }

  const series = [createActualSalesSeries(chartActual)]
  if (isPredictionSuccessful) {
    series.push(createPredictedSalesSeries(chartPredicted, predictionLegendName))
  }

  const chartTitleText = isPredictionSuccessful ? '历史销量与销量预测' : '历史销量统计'
  const legendData = isPredictionSuccessful ? ['实际销量', predictionLegendName] : ['实际销量']

  const options = {
    title: {
      text: chartTitleText,
      subtext: predictionStatusMessage.value,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16 },
      subtextStyle: {
        fontSize: 12,
        color: isPredictionSuccessful
          ? '#666'
          : predictionStatusMessage.value.includes('失败') ||
            predictionStatusMessage.value.includes('出错') ||
            predictionStatusMessage.value.includes('不足')
            ? 'red'
            : '#999',
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        if (!params || params.length === 0 || !params[0].name) return
        let res = params[0].name + '<br/>'
        params.forEach((item) => {
          const point = item.value
          const valueToShow =
            point !== null && typeof point === 'object' && point.value !== undefined
              ? point.value
              : point
          if (valueToShow !== null && valueToShow !== undefined) {
            res +=
              item.marker + item.seriesName + ': ' + parseFloat(valueToShow).toFixed(0) + '<br/>'
          }
        })
        return res
      },
    },
    legend: {
      data: legendData,
      top: 40,
    },
    grid: {
      top: 90,
      left: 60,
      right: 20,
      bottom: 20,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartDates,
      axisLabel: { interval: 'auto' },
    },
    yAxis: {
      type: 'value',
      name: '销售数量',
      position: 'left',
      nameLocation: 'middle',
      nameGap: 40,
    },
    series: series,
  }
  chartInstance.setOption(options, true)
}

/**
 * 跳转到补货页面
 */
const goToRestock = () => {
  if (targetItemId.value) {
    jumpToItem(targetItemId.value)
  }
}

onMounted(async () => {
  const resizeHandler = () => {
    if (chartInstance) {
      chartInstance.resize()
    }
  }
  window.addEventListener('resize', resizeHandler)
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler)
    if (chartInstance && !chartInstance.isDisposed()) {
      echarts.dispose(chartInstance)
    }
  })

  chartInstance = echarts.init(chartContainer.value)

  await loadInitialData()

  if (targetItemId.value) {
    await initStatistics()
  } else {
    chartInstance.setOption({
      title: { text: '请先添加商品或检查历史数据', left: 'center', top: 'center' },
    })
  }
})
</script>

<template>
  <div class="statistics-container">
    <div class="page-header">
      <h2 class="page-title">销售统计与预测</h2>
    </div>

    <a-spin :spinning="isLoadingList || isLoadingPrediction || isLoadingProductInfo">
      <a-card class="control-card">
        <div class="control-section">
          <div class="product-selector">
            <a-select v-if="!isLoadingList" :disabled="isLoadingPrediction" v-model:value="targetItemId"
              style="width: 100%" placeholder="选择商品" @change="handleProductChange"
              :options="availableProducts.map((p) => ({ value: p.id, label: p.name }))" />
            <a-spin v-else size="small">
              <span class="loading-text">商品列表加载中...</span>
            </a-spin>
          </div>
          <a-button type="primary" @click="toggleDataSource" :disabled="isLoadingList || isLoadingPrediction"
            class="data-source-button">
            {{ buttonText }}
          </a-button>
        </div>
      </a-card>

      <a-row :gutter="[16, 16]" class="data-row">
        <a-col :xs="24" :md="12">
          <a-card class="summary-card" title="销售概览" :bordered="false">
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12">
                <div class="stat-box">
                  <div class="stat-title">首周销售总量</div>
                  <div class="stat-value" :class="{ 'no-data': firstWeekSalesTotal === '数据不足' }">
                    {{ firstWeekSalesTotal !== null ? firstWeekSalesTotal : '-' }}
                  </div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12">
                <div class="stat-box">
                  <div class="stat-title">次周销售总量</div>
                  <div class="stat-value" :class="{ 'no-data': secondWeekSalesTotal === '数据不足' }">
                    {{ secondWeekSalesTotal !== null ? secondWeekSalesTotal : '-' }}
                  </div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12">
                <div class="stat-box">
                  <div class="stat-title">当前库存</div>
                  <div class="stat-value">
                    {{ currentProductInfo ? currentProductInfo.stock : '-' }}
                  </div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12">
                <div class="stat-box">
                  <div class="stat-title">预计7日销量</div>
                  <div class="stat-value">
                    <template
                      v-if="currentProductInfo && stockMessage && !stockMessage.includes('不足') && !stockMessage.includes('失败') && !stockMessage.includes('错误') && !stockMessage.includes('无足够历史数据')">
                      {{ stockMessage.split('预测销量: ')[1]?.split(')')[0] || '-' }}
                    </template>
                    <template v-else-if="stockMessage.includes('不足')">
                      {{ stockMessage.split('预测销量: ')[1]?.split(')')[0] || '-' }}
                    </template>
                    <template v-else>-</template>
                  </div>
                </div>
              </a-col>
            </a-row>

            <div v-if="stockMessage" class="stock-alert-container">
              <a-alert :message="stockMessage"
                :type="stockMessage.includes('不足') ? 'warning' : stockMessage.includes('失败') || stockMessage.includes('错误') ? 'error' : 'success'"
                showIcon>
                <template #action>
                  <a-button type="link" size="small" v-if="stockMessage.includes('不足')" @click="goToRestock">
                    前往补货
                  </a-button>
                </template>
              </a-alert>
            </div>

            <div v-if="predictionStatusMessage && !stockMessage" class="prediction-alert">
              <a-alert :message="predictionStatusMessage" type="info" showIcon />
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :md="12">
          <a-card class="product-info-card" title="商品信息" :bordered="false" v-if="currentProductInfo">
            <div class="product-detail">
              <div class="product-image-container" v-if="currentProductInfo.image">
                <img :src="currentProductInfo.image" class="product-image" alt="商品图片" />
              </div>
              <div class="product-info">
                <div class="product-name">{{ currentProductInfo.name }}</div>
                <div class="product-meta">
                  <div class="meta-item">
                    <span class="meta-label">价格:</span>
                    <span class="meta-value">￥{{ (currentProductInfo.price / 100).toFixed(2) }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">分类:</span>
                    <span class="meta-value">{{ currentProductInfo.category }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">品牌:</span>
                    <span class="meta-value">{{ currentProductInfo.brand }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">销量:</span>
                    <span class="meta-value">{{ currentProductInfo.sold }}</span>
                  </div>
                </div>
              </div>
            </div>
          </a-card>
          <a-card v-else class="empty-product-card" :bordered="false">
            <a-empty description="选择商品后显示详细信息" />
          </a-card>
        </a-col>
      </a-row>

      <a-card class="chart-card" :bordered="false">
        <div ref="chartContainer" class="chart-container"></div>
      </a-card>
    </a-spin>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.statistics-container {
  padding: $spacing-md;
}

.page-header {
  margin-bottom: $spacing-lg;

  .page-title {
    font-size: 24px;
    font-weight: 600;
    position: relative;
    display: inline-block;
    padding-bottom: 8px;
    margin-bottom: 0;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background-color: $primary-color;
      border-radius: 2px;
    }
  }
}

.control-card {
  margin-bottom: $spacing-md;
  box-shadow: $box-shadow;
  border-radius: $border-radius;

  .control-section {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    .product-selector {
      flex: 1;
    }

    .data-source-button {
      white-space: nowrap;
    }
  }
}

.loading-text {
  opacity: 0.7;
  margin-left: $spacing-sm;
}

.data-row {
  margin-bottom: $spacing-md;
}

.summary-card,
.product-info-card,
.empty-product-card {
  height: 100%;
  box-shadow: $box-shadow;
  border-radius: $border-radius;

  :deep(.ant-card-head) {
    padding: $spacing-sm $spacing-md;
    border-bottom: 1px solid #f0f0f0;

    .ant-card-head-title {
      font-size: 16px;
      font-weight: 500;
    }
  }
}

.stat-box {
  padding: $spacing-sm;
  margin-bottom: $spacing-sm;
  background-color: #f9f9f9;
  border-radius: $border-radius;

  .stat-title {
    font-size: 14px;
    color: $text-secondary;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: $primary-color;

    &.no-data {
      color: $text-secondary;
      font-size: 16px;
      font-weight: normal;
    }
  }
}

.stock-alert-container,
.prediction-alert {
  margin-top: $spacing-md;
}

.chart-card {
  margin-top: $spacing-sm;
  box-shadow: $box-shadow;
  border-radius: $border-radius;

  .chart-container {
    width: 100%;
    height: 400px;
    padding: $spacing-sm 0;
  }
}

.product-detail {
  display: flex;
  gap: $spacing-md;

  .product-image-container {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9f9f9;
    border-radius: $border-radius;
    overflow: hidden;

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .product-info {
    flex: 1;

    .product-name {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: $spacing-sm;
      color: $text-primary;
    }

    .product-meta {
      .meta-item {
        display: flex;
        align-items: center;
        margin-bottom: 6px;

        .meta-label {
          width: 60px;
          color: $text-secondary;
        }

        .meta-value {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .control-section {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-sm;

    .data-source-button {
      margin-top: $spacing-xs;
    }
  }

  .product-detail {
    flex-direction: column;

    .product-image-container {
      width: 100%;
      height: 180px;
      margin-bottom: $spacing-sm;
    }
  }
}
</style>
