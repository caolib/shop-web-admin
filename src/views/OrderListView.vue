<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import {
    loading,
    orders,
    query,
    handleSearch,
    pagination,
    handleView,
    handleDelete,
    columns,
    renderColumn,
    orderStatus
} from '@/scripts/order'
import { allowScroll, forbiddenScroll } from '@/utils/page'

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
        <a-card>
            <!-- 查询条件区域 -->
            <a-form layout="inline" style="margin-bottom: 16px;">
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
                    <!-- 使用 v-for 渲染列 -->
                    <a-table-column v-for="col in columns" :key="col.dataIndex" :title="col.title"
                        :dataIndex="col.dataIndex" :width="col.width">
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
                                <a-button type="link" @click="handleView(record)">查看</a-button>
                                <a-button type="link" danger @click="handleDelete(record)">删除</a-button>
                            </div>
                        </template>
                    </a-table-column>
                </a-table>
            </a-spin>
        </a-card>
    </div>
</template>

<style scoped>
.order-list-view {
    padding: 16px;
}
</style>