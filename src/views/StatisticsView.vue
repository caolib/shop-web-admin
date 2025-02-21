<script setup>
import { ref, onMounted } from 'vue'
import { weekStatisticService } from '@/api/statistic.js'
import * as echarts from 'echarts'
import ARIMA from 'arima'

const chartContainer = ref(null)
const weekStatistic = ref([])

const predictionFee = ref(null)
const predictionOrder = ref(null)

onMounted(async () => {
    await weekStatisticService(20).then((res) => {
        weekStatistic.value = res.data
    })
    const chartInstance = echarts.init(chartContainer.value)
    const dates = weekStatistic.value.map(item => item.time.substring(0, 10))
    const totalFees = weekStatistic.value.map(item => Number(item.totalFee) / 100) // 单位转换为元
    const totalOrders = weekStatistic.value.map(item => Number(item.totalOrder))

    // 计算明天的日期
    const lastDate = new Date(dates[dates.length - 1])
    lastDate.setDate(lastDate.getDate() + 1)
    const tomorrowStr = lastDate.toISOString().substring(0, 10)
    const allDates = [...dates, tomorrowStr]

    // 使用 ARIMA 进行预测
    const feeModel = new ARIMA({ p: 2, d: 1, q: 2, verbose: false })
    const orderModel = new ARIMA({ p: 2, d: 1, q: 2, verbose: false })
    const feePrediction = feeModel.train(totalFees).predict(1)
    const orderPrediction = orderModel.train(totalOrders).predict(1)

    // 使用 flat(Infinity) 完全扁平化预测结果数组
    const flatFeePrediction = feePrediction.flat(Infinity)
    const flatOrderPrediction = orderPrediction.flat(Infinity)
    console.log('明天预测的交易金额（元）:', flatFeePrediction)
    console.log('明天预测的订单数:', flatOrderPrediction)

    // 合并实际数据与预测数据，确保每一列（日期）都有数据，并突出显示预测那一列
    const feeCombinedData = [
        ...totalFees,
        {
            value: flatFeePrediction[0],
            itemStyle: { color: 'orange', borderColor: 'red', borderWidth: 3 }
        }
    ]
    const orderCombinedData = [
        ...totalOrders,
        {
            value: flatOrderPrediction[0],
            itemStyle: { color: 'orange', borderColor: 'red', borderWidth: 3 }
        }
    ]

    chartInstance.setOption({
        title: { text: '一周支付统计' },
        tooltip: { trigger: 'axis', },
        legend: { data: ['交易金额', '订单数'] },
        xAxis: {
            type: 'category',
            data: allDates,
        },
        yAxis: [
            { type: 'value', name: '支付金额', position: 'left' },
            { type: 'value', name: '订单数', position: 'right' }
        ],
        series: [
            {
                name: '交易金额',
                type: 'line',
                smooth: true, // 增加 smooth 属性以使用光滑曲线
                data: feeCombinedData
            },
            {
                name: '订单数',
                type: 'line',
                smooth: true, // 增加 smooth 属性以使用光滑曲线
                data: orderCombinedData,
                yAxisIndex: 1
            }
        ]
    })
})
</script>

<template>
    <div>
        <div ref="chartContainer" style="width: 600px; height: 400px;"></div>
    </div>
</template>