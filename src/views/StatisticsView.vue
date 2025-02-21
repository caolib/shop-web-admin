<script setup>
import { ref, onMounted } from 'vue'
import { weekStatisticService } from '@/api/statistic.js'
import * as echarts from 'echarts'
import { predictOne } from '@/utils/arimaHelper'

const chartContainer = ref(null)
const weekStatistic = ref([])
const days = ref(14)
// 定义 ARIMA 模型参数（可试不同配置以优化预测）
const arimaParams = { p: 2, d: 1, q: 2 }

// 新提取的初始化函数
async function initStatistics() {
    await weekStatisticService(days.value).then((res) => {
        weekStatistic.value = res.data
    })
    const chartInstance = echarts.init(chartContainer.value)
    // 取14天所有日期和实际金额
    const allRawDates = weekStatistic.value.map(item => item.time.substring(0, 10))
    const totalFees = weekStatistic.value.map(item => Number(item.totalFee) / 100)

    const trainingDays = 7  // 前7天用于初始训练
    const predictedCount = days.value - trainingDays  // 预测天数为7天

    // 计算逐日预测，从第8天开始，每天使用前面 i 天数据训练预测1天
    const predictedValues = []
    for (let i = trainingDays; i < days.value; i++) {
        const feesForTraining = totalFees.slice(0, i)
        // 使用可调整参数 arimaParams 进行预测
        const pred = predictOne(feesForTraining, arimaParams)
        predictedValues.push(Math.round(pred * 100) / 100)
    }
    console.log('逐日预测的交易金额（元）:', predictedValues)

    // 使用后7天实际数据
    const last7Dates = allRawDates.slice(trainingDays)
    const last7Actual = totalFees.slice(trainingDays)
    // 打印预测金额和实际交易金额
    console.log('实际交易金额（元）:', last7Actual)
    console.log('预测交易金额（元）:', predictedValues)
    // 将预测值转为带样式的对象数组
    const last7Predicted = predictedValues.map(val => ({
        value: val,
        itemStyle: { color: 'orange', borderColor: 'red', borderWidth: 3 }
    }))

    chartInstance.setOption({
        title: { text: '后七天金额对比' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['实际金额', '预测金额'] },
        xAxis: {
            type: 'category',
            data: last7Dates,
        },
        yAxis: {
            type: 'value',
            name: '支付金额',
            position: 'left'
        },
        series: [
            {
                name: '实际金额',
                type: 'line',
                smooth: true,
                data: last7Actual,
                lineStyle: { opacity: 0.7 }  // 添加透明度
            },
            {
                name: '预测金额',
                type: 'line',
                smooth: true,
                data: last7Predicted,
                lineStyle: { opacity: 0.7 },  // 添加透明度
                z: 10                       // 置于上层
            }
        ]
    })
}

onMounted(() => {
    initStatistics()
})
</script>

<template>
    <div>
        <div ref="chartContainer" style="width: 600px; height: 400px;"></div>
    </div>
</template>