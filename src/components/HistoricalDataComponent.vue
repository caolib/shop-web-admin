<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import jsonData from '@/assets/data.json'
import { getDateAfter, predictSalesWithARIMA, calculatePredictionAccuracy } from '@/scripts/statics.js'
import { getCommodityService } from '@/api/commodity.js'
// 引入 Ant Design Vue 组件
import {
    Row, Col, Select, Space, Card, Descriptions,
    DescriptionsItem, Spin, Divider, Typography, Alert
} from 'ant-design-vue';

const chartContainer = ref(null)
const itemDailySales = ref([]) // 存储处理后的单个商品日销量 { time: 'YYYY-MM-DD', num: N }
const availableItemIds = ref(['1861100', '317580', '317578']) // 默认商品ID列表
const availableProducts = ref([]) // 存储商品列表 { id: '...', name: '...' }，用于选择器
const targetItemId = ref('') // 当前选中的商品ID
let chartInstance = null; // ECharts 实例

// 商品信息和库存检查的状态
const currentProductInfo = ref(null) // 当前商品信息
const stockMessage = ref('') // 库存检查消息
const isLoadingProductInfo = ref(false) // 是否正在加载商品信息
const isInitialLoad = ref(true) // 标记是否为初始加载

/**
 * 根据 data.json 填充 availableProducts 数组，包含商品 ID 和名称。
 * 只在首次加载或数据为空时执行。
 */
function populateProductNames() {
    if (availableProducts.value.length > 0 || !jsonData || !jsonData.data) {
        return;
    }
    const foundProducts = new Map();
    jsonData.data.forEach(dailyEntry => {
        if (dailyEntry.payDetailList) {
            dailyEntry.payDetailList.forEach(item => {
                if (availableItemIds.value.includes(item.itemId) && !foundProducts.has(item.itemId)) {
                    foundProducts.set(item.itemId, item.name || '未知商品');
                }
            });
        }
    });
    availableProducts.value = availableItemIds.value.map(id => ({
        id: id,
        name: foundProducts.get(id) || `商品 ${id}`
    }));
}

/**
 * 处理商品选择器变化事件。
 */
function handleProductChange() {
    initStatistics()
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
    populateProductNames();

    const salesMap = new Map();
     
    if (jsonData && jsonData.data) {
        jsonData.data.forEach(dailyEntry => {
            const date = dailyEntry.date.substring(0, 10);
            if (dailyEntry.payDetailList) {
                dailyEntry.payDetailList.forEach(item => {
                    if (item.itemId === targetItemId.value) {
                        const currentSales = salesMap.get(date) || 0;
                        salesMap.set(date, currentSales + Number(item.num));
                    }
                });
            }
        });
    }

    itemDailySales.value = Array.from(salesMap.entries())
        .map(([time, num]) => ({ time, num }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    const actualSales = itemDailySales.value.map(item => item.num);
    
    fetchProductAndCheckStock(targetItemId.value, actualSales);

    if (!chartInstance) {
         return;
    }
    if (!itemDailySales.value || itemDailySales.value.length === 0) {
        chartInstance.clear();
        chartInstance.setOption({ title: { text: `无销售数据`, left: 'center', top: 'center' }});
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

    const series = [
        {
            name: '实际销量',
            type: 'line',
            smooth: true,
            data: chartActual,
            lineStyle: { opacity: 0.7 }
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

    chartInstance.setOption({
        title: { 
            text: showPrediction ? '商品销量预测' : '商品销量统计',
            subtext: !showPrediction ? '历史数据不足14天，无法显示预测数据' : '',
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
        tooltip: { trigger: 'axis' },
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
}

onMounted(() => {
    if (chartContainer.value) {
        chartInstance = echarts.init(chartContainer.value);
        populateProductNames();
        targetItemId.value = availableProducts.value.length > 0 
            ? availableProducts.value[0].id 
            : availableItemIds.value[0];
        initStatistics();
    }
    
    const resizeHandler = () => {
        if (chartInstance) {
            chartInstance.resize();
        }
    };
    window.addEventListener('resize', resizeHandler);
    
    onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeHandler);
        if (chartInstance) {
            echarts.dispose(chartInstance);
        }
    });
})
</script>

<template>
    <div> <!-- 最外层容器 -->
        <Row :gutter="[16, 16]"> <!-- 第一行：仅图表 -->
            <Col :span="24"> <!-- 图表列占满整行 -->
                <Card>
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
                    <!-- 图表容器 -->
                    <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
                </Card>
            </Col>
        </Row>

        <Row :gutter="[16, 16]" style="margin-top: 16px;"> <!-- 第二行：仅信息面板 -->
             <Col :span="24"> <!-- 信息面板列占满整行 -->
                <Card title="商品信息 & 库存检查">
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
    </div>
</template> 