<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import {
    getDateAfter,
    createActualSalesSeries,
    createPredictedSalesSeries,
    getStatisticsData,
    getSalesPrediction
} from '@/scripts/statistic.js'
import { getCommodityService } from '@/api/commodity.js'
import {
    Row, Col, Select, Space, Card, Descriptions,
    DescriptionsItem, Spin, Alert, Button
} from 'ant-design-vue';
import { jumpToItem } from '@/router/jump';

const chartContainer = ref(null)
const availableProducts = ref([])
const targetItemId = ref('')
const allSalesData = ref(null);
let chartInstance = null;

const isLoadingList = ref(true);
const isLoadingPrediction = ref(false);
const currentProductInfo = ref(null)
const stockMessage = ref('')
const isLoadingProductInfo = ref(false)

const predictionStatusMessage = ref('');
const isRealTime = ref(false);

// Add new refs for weekly totals
const firstWeekSalesTotal = ref(null);
const secondWeekSalesTotal = ref(null);

const buttonText = computed(() => {
    return isRealTime.value ? '切换到历史数据' : '切换到实时数据';
});

/**
 * 处理商品选择变化
 */
async function handleProductChange(newValue) {
    targetItemId.value = newValue;
    await initStatistics();
}

/**
 * 获取商品详情预测并进行库存检查
 */
async function fetchProductAndCheckStock(itemId, predictions7DayFuture) {
    isLoadingProductInfo.value = true;
    stockMessage.value = '正在检查库存...';
    currentProductInfo.value = null;

    try {
        const productInfo = await getCommodityService(itemId);
        currentProductInfo.value = productInfo;

        const currentStockValue = Number(productInfo.stock);

        if (predictions7DayFuture) {
            const totalPredictedSales = predictions7DayFuture.reduce((sum, val) => sum + val, 0);
            if (currentStockValue >= totalPredictedSales) {
                stockMessage.value = `库存充足 (当前: ${currentStockValue}, 预测销量: ${totalPredictedSales.toFixed(0)})`;
            } else {
                stockMessage.value = `库存可能不足! (当前: ${currentStockValue}, 预测销量: ${totalPredictedSales.toFixed(0)})`;
            }
        } else {
            stockMessage.value = `当前库存: ${currentStockValue} (无足够历史数据进行消耗预测)`;
        }
    } catch (error) {
        console.error("(View) 获取商品详情或处理库存时出错:", error); // Keep error logs
        stockMessage.value = "获取库存信息失败";
    } finally {
        isLoadingProductInfo.value = false;
    }
}

/**
 * 切换数据源
 */
const toggleDataSource = async () => {
    isRealTime.value = !isRealTime.value;
    await loadInitialData();
    if (targetItemId.value) {
        await initStatistics();
    } else {
        if (chartInstance) {
            chartInstance.clear();
            chartInstance.setOption({ title: { text: '请选择一个商品', left: 'center', top: 'center' } });
        }
    }
};

/**
 * 加载初始数据 (商品列表和历史数据) - Uses getStatisticsData
 */
async function loadInitialData() {
    isLoadingList.value = true;
    availableProducts.value = [];
    targetItemId.value = '';
    allSalesData.value = null;

    try {
        const { allSalesData: fetchedData, products: fetchedProducts } = await getStatisticsData(isRealTime.value);

        allSalesData.value = fetchedData;
        availableProducts.value = fetchedProducts;

        if (availableProducts.value.length > 0) {
            targetItemId.value = availableProducts.value[0].id;
        } else {
            targetItemId.value = '';
        }

    } catch (error) {
        console.error("(View) 加载初始数据失败:", error.message || error); // Keep error logs
        availableProducts.value = [];
        targetItemId.value = '';
        allSalesData.value = [];
        predictionStatusMessage.value = "加载基础销售数据失败，请稍后重试";
    } finally {
        isLoadingList.value = false;
    }
}

/**
 * 初始化或更新 ECharts 图表 (基于历史数据) - Uses getSalesPrediction
 */
async function initStatistics() {
    if (!chartInstance || !targetItemId.value || !Array.isArray(allSalesData.value)) {
        if (chartInstance) {
            chartInstance.clear();
            chartInstance.setOption({ title: { text: '数据无效或未选择商品', left: 'center', top: 'center' } });
        }
        return;
    }

    isLoadingPrediction.value = false;
    predictionStatusMessage.value = '';
    stockMessage.value = '';
    currentProductInfo.value = null;
    // Reset weekly totals
    firstWeekSalesTotal.value = null;
    secondWeekSalesTotal.value = null;

    const salesMap = new Map();
    allSalesData.value.forEach(dailyEntry => {
        if (!dailyEntry || !dailyEntry.date || typeof dailyEntry.date !== 'string') return;
        const date = dailyEntry.date.substring(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
        if (!salesMap.has(date)) { salesMap.set(date, 0); }
        if (Array.isArray(dailyEntry.payDetailList)) {
            dailyEntry.payDetailList.forEach(item => {
                if (item && item.itemId === targetItemId.value) {
                    const currentSales = salesMap.get(date) || 0;
                    salesMap.set(date, currentSales + (Number(item.num) || 0));
                }
            });
        }
    });

    const itemDailySalesResult = Array.from(salesMap.entries())
        .map(([time, num]) => ({ time, num }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    const actualSales = itemDailySalesResult.map(item => item.num);
    const allRawDates = itemDailySalesResult.map(item => item.time);
    const historyLength = actualSales.length;

    // Calculate weekly totals
    if (historyLength >= 7) {
        firstWeekSalesTotal.value = actualSales.slice(0, 7).reduce((sum, val) => sum + (val || 0), 0).toFixed(0);
    } else {
        firstWeekSalesTotal.value = '数据不足';
    }

    if (historyLength >= 14) {
        secondWeekSalesTotal.value = actualSales.slice(7, 14).reduce((sum, val) => sum + (val || 0), 0).toFixed(0);
    } else if (historyLength >= 7) {
        // Only show 'insufficient data' if there's at least one week
        secondWeekSalesTotal.value = '数据不足';
    } else {
        secondWeekSalesTotal.value = null; // Don't show if less than 7 days
    }

    const daysToPredictFuture = 7;
    let future7DayPredictions = null;
    let isPredictionSuccessful = false;
    const minHistoryForApi = 14;

    if (historyLength >= minHistoryForApi) {
        isLoadingPrediction.value = true;
        predictionStatusMessage.value = '正在获取预测数据...';
        try {
            future7DayPredictions = await getSalesPrediction(actualSales, daysToPredictFuture);
            if (future7DayPredictions !== null) {
                isPredictionSuccessful = true;
                predictionStatusMessage.value = '';
            } else {
                console.error("(View) 获取预测数据失败 (可能 API 错误或网络问题)."); // Keep error log
                predictionStatusMessage.value = '获取预测数据失败';
                isPredictionSuccessful = false;
            }
        } catch (error) {
            console.error("(View) 调用预测功能时发生意外错误:", error); // Keep error log
            predictionStatusMessage.value = '预测功能内部出错';
            isPredictionSuccessful = false;
        } finally {
            isLoadingPrediction.value = false;
        }
    } else {
        predictionStatusMessage.value = `历史数据天数 (${historyLength}) 不足 ${minHistoryForApi} 天，无法进行预测`;
        isPredictionSuccessful = false;
    }

    await fetchProductAndCheckStock(targetItemId.value, isPredictionSuccessful ? future7DayPredictions : null);

    let chartDates = [...allRawDates];
    let chartActual = [...actualSales];
    let chartPredicted = Array(historyLength).fill(null);
    const predictionLegendName = "预测销量";
    if (isPredictionSuccessful && future7DayPredictions) {
        let lastHistoricalDate = allRawDates.length > 0 ? allRawDates[historyLength - 1] : new Date().toISOString().substring(0, 10);
        for (let i = 1; i <= daysToPredictFuture; i++) {
            chartDates.push(getDateAfter(lastHistoricalDate, i));
        }
        chartActual = chartActual.concat(Array(daysToPredictFuture).fill(null));
        future7DayPredictions.forEach(pred => chartPredicted.push({ value: pred }));
    }

    const series = [createActualSalesSeries(chartActual)];
    if (isPredictionSuccessful) {
        series.push(createPredictedSalesSeries(chartPredicted, predictionLegendName));
    }

    const chartTitleText = isPredictionSuccessful ? '历史销量与销量预测' : '历史销量统计';
    const legendData = isPredictionSuccessful ? ['实际销量', predictionLegendName] : ['实际销量'];

    const options = {
        title: {
            text: chartTitleText,
            subtext: predictionStatusMessage.value,
            left: 'center',
            top: 10,
            textStyle: { fontSize: 16 },
            subtextStyle: {
                fontSize: 12,
                color: isPredictionSuccessful ? '#666' : (predictionStatusMessage.value.includes('失败') || predictionStatusMessage.value.includes('出错') || predictionStatusMessage.value.includes('不足') ? 'red' : '#999')
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function (params) {
                if (!params || params.length === 0 || !params[0].name) return;
                let res = params[0].name + '<br/>';
                params.forEach(item => {
                    const point = item.value;
                    const valueToShow = (point !== null && typeof point === 'object' && point.value !== undefined) ? point.value : point;
                    if (valueToShow !== null && valueToShow !== undefined) {
                        res += item.marker + item.seriesName + ': ' + parseFloat(valueToShow).toFixed(0) + '<br/>';
                    }
                });
                return res;
            }
        },
        legend: {
            data: legendData,
            top: 40
        },
        grid: {
            top: 90,
            left: 60,
            right: 20,
            bottom: 20,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartDates,
            axisLabel: { interval: 'auto' }
        },
        yAxis: {
            type: 'value',
            name: '销售数量',
            position: 'left',
            nameLocation: 'middle',
            nameGap: 40
        },
        series: series
    };
    chartInstance.setOption(options, true);
}

/**
 * 跳转到补货页面
 */
const goToRestock = () => {
    if (targetItemId.value) {
        jumpToItem(targetItemId.value);
    }
};

onMounted(async () => {
    const resizeHandler = () => {
        if (chartInstance) {
            chartInstance.resize();
        }
    };
    window.addEventListener('resize', resizeHandler);
    onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeHandler);
        if (chartInstance && !chartInstance.isDisposed()) {
            echarts.dispose(chartInstance);
        }
    });

    chartInstance = echarts.init(chartContainer.value);

    await loadInitialData();

    if (targetItemId.value) {
        await initStatistics();
    } else {
        chartInstance.setOption({
            title: { text: '请先添加商品或检查历史数据', left: 'center', top: 'center' }
        });
    }
})
</script>

<template>
    <div class="statistics-container">
        <Spin :spinning="isLoadingList || isLoadingPrediction || isLoadingProductInfo">
            <Row :gutter="[16, 16]">
                <Col :span="24">
                <Space>
                    <Select v-if="!isLoadingList" :disabled="isLoadingPrediction" v-model="targetItemId"
                        style="width: 60vw" placeholder="选择商品" @change="handleProductChange"
                        :options="availableProducts.map(p => ({ value: p.id, label: p.name }))" />
                    <span v-if="isLoadingList">商品列表加载中...</span>
                    <Button @click="toggleDataSource" :disabled="isLoadingList || isLoadingPrediction">
                        {{ buttonText }}
                    </Button>
                </Space>
                </Col>

                <Col :span="24">
                <Card>
                    <Row :gutter="[16, 16]">
                        <Col :span="24">
                        <Descriptions bordered :column="{ xxl: 5, xl: 4, lg: 3, md: 2, sm: 1, xs: 1 }">
                            <!-- Add First Week Sales -->
                            <DescriptionsItem label="首周销售总量">
                                <span v-if="firstWeekSalesTotal !== null && firstWeekSalesTotal !== '数据不足'">{{
                                    firstWeekSalesTotal }}</span>
                                <span v-else-if="firstWeekSalesTotal === '数据不足'">数据不足</span>
                                <span v-else>-</span>
                            </DescriptionsItem>
                            <!-- Add Second Week Sales -->
                            <DescriptionsItem label="次周销售总量">
                                <span v-if="secondWeekSalesTotal !== null && secondWeekSalesTotal !== '数据不足'">{{
                                    secondWeekSalesTotal }}</span>
                                <span v-else-if="secondWeekSalesTotal === '数据不足'">数据不足</span>
                                <span v-else>-</span>
                            </DescriptionsItem>

                            <DescriptionsItem label="当前库存">
                                <span v-if="currentProductInfo">{{ currentProductInfo.stock }}</span>
                                <span v-else>-</span>
                            </DescriptionsItem>
                            <DescriptionsItem label="未来7日预计总销量">
                                <span
                                    v-if="currentProductInfo && stockMessage && !stockMessage.includes('不足') && !stockMessage.includes('失败') && !stockMessage.includes('错误') && !stockMessage.includes('无足够历史数据')">
                                    {{ stockMessage.split('预测销量: ')[1]?.split(')')[0] || '-' }}
                                </span>
                                <span v-else-if="stockMessage.includes('不足')">
                                    {{ stockMessage.split('预测销量: ')[1]?.split(')')[0] || '-' }}
                                </span>
                                <span
                                    v-else-if="predictionStatusMessage.includes('不足') || predictionStatusMessage.includes('失败')">-</span>
                                <span v-else>-</span>
                            </DescriptionsItem>
                            <DescriptionsItem>
                                <div v-if="stockMessage">
                                    <Alert :message="stockMessage"
                                        :type="stockMessage.includes('不足') ? 'warning' : (stockMessage.includes('失败') || stockMessage.includes('错误') ? 'error' : 'success')"
                                        showIcon>
                                        <template #action>
                                            <Button type="link" size="small" v-if="stockMessage.includes('不足')"
                                                @click="goToRestock">
                                                前往补货
                                            </Button>
                                        </template>
                                    </Alert>
                                </div>
                                <span v-else>-</span>
                            </DescriptionsItem>
                        </Descriptions>
                        <div v-if="predictionStatusMessage && !stockMessage" style="margin-top: 10px;">
                            <Alert :message="predictionStatusMessage" type="info" showIcon />
                        </div>
                        </Col>

                        <Col :span="24">
                        <div ref="chartContainer" style="width: 100%; height: 400px; margin-top: 16px;"></div>
                        </Col>
                    </Row>
                </Card>
                </Col>
            </Row>
        </Spin>
    </div>
</template>

<style scoped>
.statistics-container {
    padding: 20px;
}

/* Additional styles if needed */
</style>