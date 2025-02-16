<script setup>
import { ref, onMounted } from 'vue'
import { weekStatisticService } from '@/api/statistic.js'
import * as echarts from 'echarts'

const chartContainer = ref(null)
const weekStatistic = ref([])

onMounted(async () => {
    await weekStatisticService().then((res) => {
        weekStatistic.value = res.data
    })
    const chartInstance = echarts.init(chartContainer.value)
    const dates = weekStatistic.value.map(item => item.time.substring(0, 10))
    const totalFees = weekStatistic.value.map(item => Number(item.totalFee) / 100) // 单位转换为元
    const totalOrders = weekStatistic.value.map(item => Number(item.totalOrder))
    chartInstance.setOption({
        title: { text: '一周支付统计' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['交易金额', '订单数'] },
        xAxis: {
            type: 'category',
            data: dates
        },
        yAxis: [
            { type: 'value', name: '支付金额', position: 'left' },
            { type: 'value', name: '订单数', position: 'right' }
        ],
        series: [
            { name: '交易金额', type: 'bar', data: totalFees, yAxisIndex: 0 },
            { name: '订单数', type: 'line', data: totalOrders, yAxisIndex: 1 }
        ]
    })
})
</script>

<template>
    <div ref="chartContainer" style="width: 600px; height: 400px;"></div>
</template>
