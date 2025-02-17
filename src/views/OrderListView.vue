<script setup>
import { ref } from 'vue'
import { onBeforeUnmount, onMounted } from 'vue'
import {
    loading,
    orders,
    query,
    handleSearch,
    pagination,
    handleDelete,
    columns,
    renderColumn,
    orderStatus,
    openOrderDetailPanel,
    getStatusLabel,
    detailFields
} from '@/scripts/order'
import { allowScroll, forbiddenScroll } from '@/utils/page'
import { message } from 'ant-design-vue'
import { jumpToItem } from '@/router/jump'

const orderDetailVisible = ref(false)
const orderDetailData = ref(null)

const handleOpenDetail = (orderId) => {
    openOrderDetailPanel(orderId, orderDetailData, orderDetailVisible)
}

onMounted(() => {
    forbiddenScroll()
    handleSearch()
})

onBeforeUnmount(() => {
    allowScroll()
})
</script>

<template>
    <div class="order-list-view">
        <h2>订单管理</h2>
        <a-card class="order-list-card">
            <!-- 查询条件区域 -->
            <a-form layout="inline" style="margin-bottom: 16px;min-width: 1150px;">
                <a-form-item label="订单ID">
                    <a-input allowClear v-model:value="query.id" placeholder="订单ID" />
                </a-form-item>
                <a-form-item label="状态">
                    <a-select allowClear v-model:value="query.status" placeholder="订单状态" style="width:160px;">
                        <a-select-option :value="null">全部</a-select-option>
                        <!-- 使用 v-for 渲染状态选项 -->
                        <a-select-option v-for="status in orderStatus" :key="status.value" :value="status.value">
                            {{ status.label }}
                        </a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item>
                    <a-date-picker allowClear showTime format="YYYY-MM-DD HH:mm:ss" v-model:value="query.createTime"
                        placeholder="订单创建时间" />
                </a-form-item>
                <a-form-item>
                    <a-date-picker allowClear showTime format="YYYY-MM-DD HH:mm:ss" v-model:value="query.endTime"
                        placeholder="订单结束时间" />
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">查询</a-button>
                </a-form-item>
            </a-form>

            <!-- 订单数据表格 -->
            <a-spin :spinning="loading">
                <a-table :dataSource="orders" :rowKey="record => record.id" bordered :pagination="pagination"
                    style="table-layout: fixed;" :scroll="{ x: '1000px', y: '60vh' }">
                    <!-- 使用 v-for 渲染列，排序器已通过 columns 定义 -->
                    <a-table-column v-for="col in columns" :key="col.dataIndex" :title="col.title"
                        :dataIndex="col.dataIndex" :width="col.width" :sorter="col.sorter">
                        <template #default="{ text }">
                            <template v-if="col.dataIndex === 'status'">
                                <a-tag>{{ renderColumn(col, text) }}</a-tag>
                            </template>
                            <template v-else>
                                <span>{{ renderColumn(col, text) }}</span>
                            </template>
                        </template>
                    </a-table-column>
                    <!-- 操作列固定在右侧 -->
                    <a-table-column title="操作" fixed="right" :width="150">
                        <template #default="{ record }">
                            <div style="display: flex; justify-content: space-between;">
                                <!-- 调用 handleOpenDetail -->
                                <a-button type="link" @click="handleOpenDetail(record.id)">查看</a-button>
                                <a-button type="link" danger @click="handleDelete(record.id)">删除</a-button>
                            </div>
                        </template>
                    </a-table-column>
                </a-table>
            </a-spin>
        </a-card>

        <!-- 修改 a-modal 标签，实现全屏展示 -->
        <a-modal v-model:open="orderDetailVisible" title="订单详情" width="100%"
            :body-style="{ height: 'auto', overflow: 'auto' }">
            <template #default>
                <a-descriptions v-if="orderDetailData" title="基本信息" :column="3" bordered>
                    <a-descriptions-item v-for="field in detailFields" :key="field.key" :label="field.label">
                        {{ field.format ? field.format(orderDetailData[field.key]) : (orderDetailData[field.key] ||
                            field.default) }}
                    </a-descriptions-item>
                </a-descriptions>
                <a-table v-if="orderDetailData.orderDetails" :dataSource="orderDetailData.orderDetails" rowKey="id"
                    :pagination="false" style="margin-top:16px" bordered>
                    <a-table-column title="图片" dataIndex="image">
                        <template #default="{ text }">
                            <a-image :src="text" style="width: 80px;" />
                        </template>
                    </a-table-column>
                    <a-table-column title="商品名称" dataIndex="name">
                        <template #default="{ text, record }">
                            <a-button type="link" @click="jumpToItem(record.itemId)" style="padding: 0">
                                {{ text }}
                            </a-button>
                        </template>
                    </a-table-column>
                    <a-table-column title="数量" dataIndex="num" />
                    <a-table-column title="单价" dataIndex="price">
                        <template #default="{ text }">
                            {{ '￥' + (text / 100).toFixed(2) }}
                        </template>
                    </a-table-column>
                    <a-table-column title="规格" dataIndex="spec" />
                </a-table>
            </template>
            <template #footer>
                <a-button type="primary" @click="orderDetailVisible = false">确定</a-button>
            </template>
        </a-modal>
    </div>
</template>

<style scoped>
.order-list-view {
    padding: 16px;
}
</style>