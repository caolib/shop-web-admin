<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDateAfter, predictSalesWithARIMA, calculatePredictionAccuracy } from '@/scripts/statics.js'
import { getCommodityService } from '@/api/commodity.js'
import { itemStatisticService } from '@/api/statistic.js'
// 引入 Ant Design Vue 组件
import {
    Row, Col, Select, Space, Card, Descriptions,
    DescriptionsItem, Spin, Divider, Typography, Alert
} from 'ant-design-vue';

// 定义props
const props = defineProps({
    isActive: {
        type: Boolean,
        default: false
    }
});

const chartContainer = ref(null)
const itemDailySales = ref([]) // 存储处理后的单个商品日销量 { time: 'YYYY-MM-DD', num: N }
const availableProducts = ref([]) // 存储商品列表 { id: '...', name: '...' }，用于选择器
const targetItemId = ref('') // 当前选中的商品ID
let chartInstance = null; // ECharts 实例

// 加载状态
const isLoadingProductInfo = ref(false) // 是否正在加载商品信息
const isLoadingData = ref(false) // 是否正在加载数据
const isInitialLoad = ref(true) // 标记是否为初始加载
const hasInitialized = ref(false) // 是否已经初始化过

// 商品信息和库存检查的状态
const currentProductInfo = ref(null) // 当前商品信息
const stockMessage = ref('') // 库存检查消息

// 监听激活状态变化
watch(() => props.isActive, async (newValue) => {
    if (newValue) {
        await nextTick();
        if (!chartInstance && chartContainer.value) {
            try {
                chartInstance = echarts.init(chartContainer.value);
            } catch (error) {
                console.error('初始化图表实例失败:', error);
            }
        }
        fetchProductList();
    }
}, { immediate: true });

/**
 * 从API获取商品列表
 */
async function fetchProductList() {
    isLoadingData.value = true;
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        
        const response = await itemStatisticService(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
        
        if (response && response.data) {
            const foundProducts = new Map();
            response.data.forEach(dayData => {
                if (dayData.payDetailList) {
                    dayData.payDetailList.forEach(item => {
                        if (!foundProducts.has(item.itemId)) {
                            foundProducts.set(item.itemId, {
                                id: item.itemId,
                                name: item.name || `商品 ${item.itemId}`
                            });
                        }
                    });
                }
            });
            availableProducts.value = Array.from(foundProducts.values());
            if (availableProducts.value.length > 0) {
                targetItemId.value = availableProducts.value[0].id;
                await initStatistics();
            }
        }
    } catch (error) {
        console.error('获取商品列表失败:', error);
    } finally {
        isLoadingData.value = false;
    }
}

/**
 * 处理商品选择器变化事件。
 */
function handleProductChange() {
    initStatistics() // 重新初始化所有内容，包括获取新的商品信息
}

/**
 * 获取商品详情并基于未来7天预测进行库存检查。
 * @param {string} itemId 商品ID
 * @param {Array<number>} historicalSales 历史销量数组
 * @param {number} [retryAttempt=0] 重试次数
 */
async function fetchProductAndCheckStock(itemId, historicalSales, retryAttempt = 0) {
    isLoadingProductInfo.value = true;
    if (retryAttempt === 0) {
        stockMessage.value = '正在检查库存...';
        currentProductInfo.value = null;
    }

    try {
        const res = await getCommodityService(itemId);
        currentProductInfo.value = res;

        const historyLength = historicalSales.length;
        if (historyLength >= 14) {
            let totalPredictedSales = 0;
            for (let i = 0; i < 7; i++) {
                const prediction = historicalSales[7 + i];
                totalPredictedSales += prediction;
            }

            if (currentProductInfo.value && typeof currentProductInfo.value.stock === 'number') {
                if (currentProductInfo.value.stock >= totalPredictedSales) {
                    stockMessage.value = `库存充足 (当前: ${currentProductInfo.value.stock}, 预计消耗: ${totalPredictedSales})`;
                } else {
                    stockMessage.value = `库存可能不足! (当前: ${currentProductInfo.value.stock}, 预计消耗: ${totalPredictedSales})`;
                }
            } else {
                stockMessage.value = '无法获取当前库存信息。';
            }
        } else {
            stockMessage.value = `历史数据不足 (${historyLength}天)，无法预测未来7天库存。`;
        }

        isInitialLoad.value = false;

    } catch (error) {
        const canRetry = isInitialLoad.value &&
                         retryAttempt === 0 &&
                         (error.response?.status === 500 || error.code === 'ERR_NETWORK');

        if (canRetry) {
            setTimeout(() => {
                fetchProductAndCheckStock(itemId, historicalSales, 1);
            }, 1000);
            return;
        }

        stockMessage.value = '检查库存时出错。请稍后重试或联系管理员。';
        currentProductInfo.value = { name: '加载失败', stock: 'N/A' };
        isInitialLoad.value = false;

    } finally {
        isLoadingProductInfo.value = false;
    }
}

/**
 * 初始化或更新 ECharts 图表，并触发库存检查。
 */
async function initStatistics() {
    if (!targetItemId.value) {
        return;
    }

    isLoadingData.value = true;

    const salesMap = new Map();
     
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        
        const response = await itemStatisticService(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
        
        if (response && response.data) {
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                salesMap.set(dateStr, 0);
                currentDate.setDate(currentDate.getDate() + 1);
            }

            response.data.forEach(dayData => {
                if (dayData.payDetailList) {
                    dayData.payDetailList.forEach(item => {
                        if (item.itemId === targetItemId.value) {
                            const date = dayData.date.substring(0, 10);
                            const currentSales = salesMap.get(date) || 0;
                            salesMap.set(date, currentSales + Number(item.num));
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.error('获取API数据失败:', error);
    }

    itemDailySales.value = Array.from(salesMap.entries())
        .map(([time, num]) => ({ time, num }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    
    if (itemDailySales.value.length === 0) {
        isLoadingData.value = false;
        return;
    }

    const actualSales = itemDailySales.value.map(item => item.num);
    
    fetchProductAndCheckStock(targetItemId.value, actualSales);

    await nextTick();
    if (!chartInstance && chartContainer.value) {
        try {
            chartInstance = echarts.init(chartContainer.value);
        } catch (error) {
            console.error('初始化图表实例失败:', error);
            isLoadingData.value = false;
            return;
        }
    }

    if (!chartInstance) {
        isLoadingData.value = false;
        return;
    }

    const allRawDates = itemDailySales.value.map(item => item.time);
    const historyLength = actualSales.length;

    let chartDates = [...allRawDates];
    let targetLength = historyLength;
    let dateDay15 = null;
    let showPrediction = false;

    if (historyLength >= 14) {
        dateDay15 = getDateAfter(allRawDates[historyLength - 1], 1);
        chartDates.push(dateDay15);
        targetLength = 15;
        showPrediction = true;
    }

    let chartActual = Array(targetLength).fill(null);
    let chartPredicted = Array(targetLength).fill(null);

    for (let i = 0; i < historyLength; i++) {
        chartActual[i] = actualSales[i];
    }

    if (showPrediction && historyLength >= 7) {
        const predictLengthWeek2 = Math.min(7, historyLength - 7);
        for (let i = 0; i < predictLengthWeek2; i++) {
            const prediction = actualSales[i];
            const targetIndex = 7 + i;
            if (targetIndex < targetLength) {
                 chartPredicted[targetIndex] = { value: prediction };
            }
        }
        if (historyLength >= 8 && targetLength === 15) {
            const predictionDay15 = actualSales[7];
            chartPredicted[14] = { value: predictionDay15 };
        }
    }

    try {
        const series = [
            {
                name: '实际销量',
                type: 'line',
                smooth: true,
                data: chartActual,
                lineStyle: { opacity: 0.7 },
                symbol: 'circle',
                symbolSize: 8
            }
        ];

        if (showPrediction) {
            series.push({
                name: '预测销量',
                type: 'line',
                smooth: true,
                color: 'orange',
                symbol: 'circle',
                symbolSize: 6,
                data: chartPredicted,
                lineStyle: { type: 'dashed', opacity: 0.7 },
                z: 10
            });
        }

        let titleText = '商品销量统计';
        let subText = '';
        if (historyLength < 14) {
            subText = `历史数据不足14天，无法显示预测数据 (当前有${historyLength}天数据)`;
        } else if (showPrediction) {
            titleText = '商品销量预测';
        }

        chartInstance.setOption({
            title: { 
                text: titleText,
                subtext: subText,
                left: 'center',
                top: 10,
                textStyle: {
                    fontSize: 16
                },
                subtextStyle: {
                    fontSize: 12,
                    color: '#666'
                }
            },
            tooltip: { 
                trigger: 'axis',
                formatter: function(params) {
                    let result = params[0].axisValue + '<br/>';
                    params.forEach(param => {
                        result += param.seriesName + ': ' + param.value + '<br/>';
                    });
                    return result;
                }
            },
            legend: { 
                data: showPrediction ? ['实际销量', '预测销量'] : ['实际销量'],
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
        }, true);

        chartInstance.resize();
    } catch (error) {
        console.error('设置图表选项时出错:', error);
    } finally {
        isLoadingData.value = false;
    }
}

onMounted(async () => {
    await nextTick();
    
    if (chartContainer.value) {
        try {
            chartInstance = echarts.init(chartContainer.value);
            
            const resizeHandler = () => {
                if (chartInstance) {
                    chartInstance.resize();
                }
            };
            window.addEventListener('resize', resizeHandler);
            
            onBeforeUnmount(() => {
                window.removeEventListener('resize', resizeHandler);
                if (chartInstance) {
                    chartInstance.dispose();
                }
            });
        } catch (error) {
            console.error('初始化图表实例失败:', error);
        }
    }
});
</script>

<template>
    <div class="api-data-component">
        <Spin :spinning="isLoadingData" tip="正在加载数据..." v-if="availableProducts.length === 0">
            <Card style="width: 100%; min-height: 300px; display: flex; justify-content: center; align-items: center;">
                <Typography.Text>正在获取商品列表...</Typography.Text>
            </Card>
        </Spin>
        <template v-else>
            <Row :gutter="[16, 16]">
                <Col :span="24">
                    <Card :bodyStyle="{ padding: '24px' }">
                        <Space style="margin-bottom: 16px; width: 100%; justify-content: space-between;">
                            <Space>
                                <Typography.Text>选择商品:</Typography.Text>
                                <Select
                                    v-model:value="targetItemId"
                                    style="width: 300px"
                                    @change="handleProductChange"
                                    :options="availableProducts.map(p => ({ value: p.id, label: p.name.substring(0, 30) + (p.name.length > 30 ? '...' : '') }))"
                                >
                                </Select>
                            </Space>
                        </Space>
                        <div class="chart-wrapper">
                            <div ref="chartContainer" class="chart-container"></div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row :gutter="[16, 16]" style="margin-top: 16px;">
                <Col :span="24">
                    <Card title="商品信息 & 库存检查" :bodyStyle="{ padding: '24px' }">
                        <Spin :spinning="isLoadingProductInfo">
                            <div v-if="currentProductInfo">
                                <Descriptions bordered size="small" :column="1">
                                    <Descriptions.Item label="名称">
                                        <Typography.Text
                                            :ellipsis="{ tooltip: currentProductInfo.name || 'N/A' }"
                                            :content="currentProductInfo.name || 'N/A'"
                                        />
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{{ currentProductInfo.id || targetItemId }}</Descriptions.Item>
                                    <Descriptions.Item label="当前库存">{{ typeof currentProductInfo.stock === 'number' ? currentProductInfo.stock : 'N/A' }}</Descriptions.Item>
                                </Descriptions>
                                <Divider />
                                <Alert
                                    v-if="stockMessage"
                                    :message="stockMessage"
                                    :type="stockMessage.includes('不足') ? 'warning' : (stockMessage.includes('充足') ? 'success' : 'info')"
                                    show-icon
                                />
                                <Typography.Text v-else type="secondary">
                                    加载库存信息...
                                </Typography.Text>
                            </div>
                            <div v-else style="text-align: center; padding: 20px;">
                                <Typography.Text type="secondary">
                                    请选择商品
                                </Typography.Text>
                            </div>
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </template>
    </div>
</template>

<style scoped>
.api-data-component {
    width: 100%;
    height: 100%;
    padding: 24px;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 400px;
    margin: 0 auto;
}

.chart-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}
</style> 