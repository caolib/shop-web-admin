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
    const predictionLegendName = "API 预测";
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

    const chartTitleText = isPredictionSuccessful ? '历史销量与 API 预测' : '历史销量统计';
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
    <div class="statistics-view">
        <Card :bodyStyle="{ padding: '24px' }">
            <Row :gutter="16" style="margin-bottom: 16px;" justify="start">
                <Col>
                <Space>
                    <span>选择商品:</span>
                    <Select v-model="targetItemId" style="width: 500px" placeholder="选择商品" @change="handleProductChange"
                        :loading="isLoadingList">
                        <Select.Option v-for="product in availableProducts" :key="product.id" :value="product.id">
                            {{ product.name }} ({{ product.id }})
                        </Select.Option>
                    </Select>
                    <Button @click="toggleDataSource">{{ buttonText }}</Button>
                </Space>
                </Col>
            </Row>

            <Spin :spinning="isLoadingProductInfo || isLoadingPrediction" style="margin-bottom: 16px;">
                <Card size="small" :bordered="false">
                    <Descriptions bordered size="small">
                        <DescriptionsItem label="库存预警">
                            <Alert v-if="stockMessage" :message="stockMessage"
                                :type="stockMessage.includes('不足') ? 'warning' : (stockMessage.includes('失败') || stockMessage.includes('错误') ? 'error' : 'success')"
                                showIcon />
                            <span v-else>-</span>
                        </DescriptionsItem>
                        <DescriptionsItem label="预测状态" v-if="predictionStatusMessage">
                            <Spin :spinning="isLoadingPrediction" size="small">{{ predictionStatusMessage }}</Spin>
                        </DescriptionsItem>
                    </Descriptions>
                </Card>
            </Spin>

            <div ref="chartContainer" style="width: 100%; height: 400px;"></div>

        </Card>
    </div>
</template>

<style scoped>
.statistics-view {
    width: 100%;
    height: 100%;
    padding: 24px;
}

.ant-spin-container {
    transition: opacity 0.3s;
}

.ant-spin-blur {
    opacity: 0.5;
}
</style>