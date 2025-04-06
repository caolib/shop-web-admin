<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import jsonData from '@/assets/data.json'
import { getDateAfter } from '@/scripts/statics.js' // 导入工具函数
import { getCommodityService } from '@/api/commodity.js' // 导入 API 服务
// 引入 Ant Design Vue 组件
import {
    Row, Col, Select, Space, Card, Descriptions,
    DescriptionsItem, Spin, Divider, Typography, Alert
} from 'ant-design-vue';

const chartContainer = ref(null)
const itemDailySales = ref([]) // 存储处理后的单个商品日销量 { time: 'YYYY-MM-DD', num: N }
const availableItemIds = ref(['1861100', '317580', '317578']) // 固定的商品ID列表
const availableProducts = ref([]) // 存储商品列表 { id: '...', name: '...' }，用于选择器
const targetItemId = ref(availableItemIds.value[0]) // 当前选中的商品ID
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
    console.log('可用商品列表（含名称）:', availableProducts.value);
}

/**
 * 处理商品选择器变化事件。
 */
function handleProductChange() {
    console.log('选择的商品 ID:', targetItemId.value)
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
    // 初始加载或重试时显示默认消息
    if (retryAttempt === 0) {
        stockMessage.value = '正在检查库存...';
        currentProductInfo.value = null;
    }

    try {
        // 1. 获取商品信息（包括库存）
        const res = await getCommodityService(itemId);
        currentProductInfo.value = res;
        console.log('获取到的商品信息:', currentProductInfo.value);

        // --- 成功获取后，进行后续处理 ---

        // 2. 预测未来7天销量（需要至少14天历史数据）
        const historyLength = historicalSales.length;
        if (historyLength >= 14) {
            let totalPredictedSales = 0;
            console.log('预测未来7天销量 (第15-21天):');
            for (let i = 0; i < 7; i++) {
                const prediction = historicalSales[7 + i];
                totalPredictedSales += prediction;
                 console.log(`  第 ${15 + i} 天预测: ${prediction} (来自第 ${8 + i} 天)`);
            }
            console.log('未来7天预计总销量:', totalPredictedSales);

            // 3. 对比库存与预测值
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
            console.warn(`历史数据不足 (${historyLength} 天)，无法预测未来7天。`);
        }

        // 成功完成（无论是首次还是重试），标记初始加载结束
        isInitialLoad.value = false;

    } catch (error) {
        console.error('获取商品信息或检查库存时出错:', error);

        // --- 重试逻辑 ---
        // 只在初始加载、首次尝试失败、且错误可能是临时性问题（如500或网络错误）时重试
        const canRetry = isInitialLoad.value &&
                         retryAttempt === 0 &&
                         (error.response?.status === 500 || error.code === 'ERR_NETWORK'); // 可根据需要调整错误判断

        if (canRetry) {
            console.warn('初始加载商品信息失败，将在 1 秒后重试...');
            setTimeout(() => {
                fetchProductAndCheckStock(itemId, historicalSales, 1); // 传递重试次数 1
            }, 1000); // 延迟 1 秒重试
            // 注意：这里不设置 isLoadingProductInfo=false，让它在重试期间保持 true
            return; // 阻止执行 finally 和后续错误处理
        }
        // --- 重试逻辑结束 ---

        // 重试失败或非初始加载失败，显示最终错误信息
        stockMessage.value = '检查库存时出错。请稍后重试或联系管理员。';
        currentProductInfo.value = { name: '加载失败', stock: 'N/A' };
        isInitialLoad.value = false; // 标记初始加载处理结束（即使是失败了）

    } finally {
        // 仅在非重试调用或重试最终完成后设置 false
        // 为了简化，这里总是设置 false，允许重试期间短暂变回 true
        isLoadingProductInfo.value = false;
    }
}

/**
 * 初始化或更新 ECharts 图表，并触发库存检查。
 */
async function initStatistics() {
     // isInitialLoad.value = true; // 每次init都重置可能导致切换时也重试，通常不需要
    populateProductNames();

    // --- 1. 处理销售数据 ---
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
    const actualSales = itemDailySales.value.map(item => item.num); // 获取实际销量数组
    console.log(`处理后的商品 ${targetItemId.value} 销量:`, itemDailySales.value);
    // --- 数据处理结束 ---

    // --- 触发商品信息获取和库存检查 (使用处理好的 actualSales) ---
    // 在处理完销售数据后运行，但它是异步执行的
    fetchProductAndCheckStock(targetItemId.value, actualSales);

    // --- 图表渲染逻辑 (只处理历史和最多未来一天的预测) ---
    if (!chartInstance) {
         console.error("图表实例尚未初始化。");
         return; // 如果图表未准备好，则不继续
    }
    if (!itemDailySales.value || itemDailySales.value.length === 0) {
        console.warn(`商品 ${targetItemId.value} 无销售数据(图表)。`);
        chartInstance.clear();
        chartInstance.setOption({ title: { text: `无销售数据`, left: 'center', top: 'center' }});
        return;
    }

    const allRawDates = itemDailySales.value.map(item => item.time);
    const historyLength = actualSales.length;

    let chartDates = [...allRawDates];
    let targetLength = historyLength;
    let dateDay15 = null;
    if (historyLength >= 14) { // 只有历史满14天才添加第15天
        dateDay15 = getDateAfter(allRawDates[historyLength - 1], 1);
        chartDates.push(dateDay15);
        targetLength = 15;
    }

    // 初始化数据数组，长度为 targetLength
    let chartActual = Array(targetLength).fill(null);
    let chartPredicted = Array(targetLength).fill(null);

    // 填充实际销量
    for (let i = 0; i < historyLength; i++) {
        chartActual[i] = actualSales[i];
    }

    // 填充预测销量 (基于上周同日)
    if (historyLength >= 7) {
        // 预测第二周 (索引 7 到 13)
        const predictLengthWeek2 = Math.min(7, historyLength - 7);
        for (let i = 0; i < predictLengthWeek2; i++) {
            const prediction = actualSales[i]; // 第 7+i 天的预测 = 第 i 天的实际
            const targetIndex = 7 + i;
            if (targetIndex < targetLength) {
                 chartPredicted[targetIndex] = { value: prediction };
            }
        }
        // 预测第 15 天 (索引 14)，如果图表包含第15天
        if (historyLength >= 8 && targetLength === 15) {
            const predictionDay15 = actualSales[7]; // 第 15 天的预测 = 第 8 天的实际
            chartPredicted[14] = { value: predictionDay15 };
        }
    }
    // --- ECharts 数据准备结束 ---

    // --- 设置 ECharts 图表选项 ---
    chartInstance.setOption({
        title: { text: `商品销量预测` },
        tooltip: { trigger: 'axis' },
        legend: { data: ['实际销量', '预测销量'] },
        xAxis: {
            type: 'category',
            data: chartDates,
            axisLabel: { interval: 'auto' }
        },
        yAxis: {
            type: 'value',
            name: '销售数量',
            position: 'left'
        },
        series: [
             {
                name: '实际销量',
                type: 'line',
                smooth: true,
                data: chartActual,
                lineStyle: { opacity: 0.7 }
            },
            {
                name: '预测销量',
                type: 'line',
                smooth: true,
                color: 'orange',
                symbol: 'circle',
                symbolSize: 6,
                data: chartPredicted,
                lineStyle: { type: 'dashed', opacity: 0.7 },
                z: 10
            }
        ]
    }, true); // true 清除旧配置
}

// --- 生命周期钩子 ---
onMounted(() => {
    if (chartContainer.value) {
        chartInstance = echarts.init(chartContainer.value);
        // 移除延迟，直接调用
        initStatistics();
    } else {
        console.error("无法找到图表容器元素。");
    }
    // 添加窗口大小调整监听器
    const resizeHandler = () => {
        if (chartInstance) {
            chartInstance.resize();
        }
    };
    window.addEventListener('resize', resizeHandler);
    // 在卸载前移除监听器
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
                     <!-- 商品选择器 -->
                    <Space style="margin-bottom: 16px;">
                        <Typography.Text>选择商品:</Typography.Text>
                        <Select
                            v-model:value="targetItemId"
                            style="width: 300px"
                            @change="handleProductChange"
                            :options="availableProducts.map(p => ({ value: p.id, label: p.name.substring(0, 30) + (p.name.length > 30 ? '...' : '') }))"
                        >
                        </Select>
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