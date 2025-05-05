<script setup>
import { h, onBeforeUnmount, onMounted, ref, computed } from 'vue'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import {
  columns,
  detailFields,
  handleDelete,
  handleSearch,
  loading,
  openOrderDetailPanel,
  orders,
  orderStatus,
  pagination,
  query,
  renderColumn,
} from '@/scripts/order'
import { jumpToItem } from '@/router/jump'

const orderDetailVisible = ref(false)
const orderDetailData = ref(null)

const handleOpenDetail = (orderId) => {
  openOrderDetailPanel(orderId, orderDetailData, orderDetailVisible)
}

// 处理日期范围变化
const handleDateRangeChange = (dates) => {
  if (dates) {
    query.createStartTime = dates[0]
    query.createEndTime = dates[1]
  } else {
    query.createStartTime = null
    query.createEndTime = null
  }
}

// 重置搜索条件
const resetSearch = () => {
  query.id = null
  query.status = null
  query.createStartTime = null
  query.createEndTime = null
  handleSearch(true)
}

// 获取订单状态对应的颜色
const getStatusColor = (status) => {
  const statusItem = orderStatus.find(item => item.value === status)
  return statusItem?.color || ''
}

// 过滤掉不需要显示的字段（如用户名）
const filteredDetailFields = computed(() => {
  return detailFields.filter(field => field.key !== 'username')
})

// 解析规格JSON字符串
const parseSpec = (specString) => {
  if (!specString || specString === '{}') return {}
  try {
    return JSON.parse(specString)
  } catch (error) {
    console.error('解析规格JSON出错:', error)
    return { '规格': specString }
  }
}

onMounted(() => {
  handleSearch()
})

onBeforeUnmount(() => {
  // 清理工作如需要
})
</script>

<template>
  <div class="order-list-view">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <a-card class="order-list-card">
      <!-- 查询条件区域 -->
      <div class="search-form-container">
        <a-form layout="inline" class="search-form">
          <a-form-item label="订单ID">
            <a-input allow-clear v-model:value="query.id" placeholder="输入订单ID" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select allow-clear v-model:value="query.status" placeholder="选择状态" style="width: 120px"
              @change="handleSearch(true)">
              <a-select-option :value="null">全部</a-select-option>
              <a-select-option v-for="status in orderStatus" :key="status.value" :value="status.value">
                {{ status.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="创建时间">
            <a-range-picker allow-clear showTime format="YYYY-MM-DD HH:mm:ss"
              :value="[query.createStartTime, query.createEndTime]" @change="handleDateRangeChange"
              :placeholder="['开始时间', '结束时间']" style="width: 380px" />
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch(true)">
                <template #icon><search-outlined /></template>
                查询
              </a-button>
              <a-button @click="resetSearch">
                <template #icon>
                  <ReloadOutlined />
                </template>
                重置
              </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <!-- 订单数据表格 -->
      <a-spin :spinning="loading">
        <div class="table-container">
          <a-table :dataSource="orders" :rowKey="(record) => record.id" bordered :pagination="pagination"
            :scroll="{ x: '1000px', y: 'calc(100vh - 300px)' }">
            <!-- 使用 v-for 渲染列，排序器已通过 columns 定义 -->
            <a-table-column v-for="col in columns" :key="col.dataIndex" :title="col.title" :dataIndex="col.dataIndex"
              :width="col.width" :sorter="col.sorter">
              <template #default="{ text }">
                <template v-if="col.dataIndex === 'status'">
                  <a-tag :color="getStatusColor(text)">{{ renderColumn(col, text) }}</a-tag>
                </template>
                <template v-else>
                  <span>{{ renderColumn(col, text) }}</span>
                </template>
              </template>
            </a-table-column>
            <!-- 操作列固定在右侧 -->
            <a-table-column title="操作" fixed="right" :width="150">
              <template #default="{ record }">
                <div class="action-buttons">
                  <a-button type="link" @click="handleOpenDetail(record.id)">
                    <template #icon>
                      <EyeOutlined />
                    </template>
                    查看
                  </a-button>
                  <a-button type="link" danger @click="handleDelete(record.id)">
                    <template #icon>
                      <DeleteOutlined />
                    </template>
                    删除
                  </a-button>
                </div>
              </template>
            </a-table-column>
          </a-table>
        </div>
      </a-spin>
    </a-card>

    <!-- 订单详情弹窗 -->
    <a-modal v-model:open="orderDetailVisible" title="订单详情" width="900px"
      :bodyStyle="{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto', padding: '24px' }" :maskClosable="false"
      centered>
      <a-spin :spinning="!orderDetailData">
        <template v-if="orderDetailData">
          <!-- 基本信息 -->
          <div class="detail-section">
            <h3 class="section-title">订单基本信息</h3>
            <a-row :gutter="[16, 16]">
              <a-col :span="8" v-for="field in filteredDetailFields" :key="field.key">
                <div class="detail-item">
                  <div class="detail-label">{{ field.label }}:</div>
                  <div class="detail-content">
                    {{
                      field.format
                        ? field.format(orderDetailData[field.key])
                        : orderDetailData[field.key] || field.default
                    }}
                  </div>
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- 商品信息 -->
          <div class="detail-section">
            <h3 class="section-title">商品信息</h3>
            <a-table v-if="orderDetailData.orderDetails && orderDetailData.orderDetails.length > 0"
              :dataSource="orderDetailData.orderDetails" rowKey="id" :pagination="false" bordered
              :scroll="{ x: '600px' }" size="middle">
              <a-table-column title="商品图片" dataIndex="image" width="120">
                <template #default="{ text }">
                  <a-image :src="text" :width="80" class="product-image" />
                </template>
              </a-table-column>
              <a-table-column title="商品名称" dataIndex="name">
                <template #default="{ text, record }">
                  <a-button type="link" @click="jumpToItem(record.itemId)" class="product-name-link">
                    {{ text }}
                  </a-button>
                </template>
              </a-table-column>
              <a-table-column title="规格" dataIndex="spec" width="150">
                <template #default="{ text }">
                  <div class="spec-tags">
                    <template v-if="text && text !== '{}'">
                      <a-tag v-for="(value, key) in parseSpec(text)" :key="key" color="blue">
                        {{ key }}: {{ value }}
                      </a-tag>
                    </template>
                    <template v-else>
                      <span class="no-spec">暂无规格</span>
                    </template>
                  </div>
                </template>
              </a-table-column>
              <a-table-column title="单价" dataIndex="price" width="120">
                <template #default="{ text }">
                  <span class="price">{{ '￥' + (text / 100).toFixed(2) }}</span>
                </template>
              </a-table-column>
              <a-table-column title="数量" dataIndex="num" width="80" align="center" />
              <a-table-column title="小计" width="120">
                <template #default="{ record }">
                  <span class="price">{{ '￥' + (record.price * record.num / 100).toFixed(2) }}</span>
                </template>
              </a-table-column>
            </a-table>
            <a-empty v-else description="暂无商品数据" />
          </div>
        </template>
      </a-spin>

      <template #footer>
        <a-button type="primary" @click="orderDetailVisible = false">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.order-list-view {
  padding: $spacing-md;
}

.page-header {
  margin-bottom: $spacing-lg;

  .page-title {
    font-size: 24px;
    font-weight: 600;
    position: relative;
    display: inline-block;
    padding-bottom: 8px;
    margin-bottom: 0;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 40px;
      height: 3px;
      background-color: $primary-color;
      border-radius: 2px;
    }
  }
}

.order-list-card {
  margin-bottom: $spacing-lg;
  box-shadow: $box-shadow;
  border-radius: $border-radius;

  &:hover {
    box-shadow: $hover-shadow;
  }
}

.search-form-container {
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid #f0f0f0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  :deep(.ant-form-item) {
    margin-bottom: $spacing-sm;
  }
}

.table-container {
  :deep(.ant-table) {
    border-radius: $border-radius;
    overflow: hidden;
  }

  :deep(.ant-table-thead > tr > th) {
    background-color: #f5f7fa;
    font-weight: 500;
  }
}

.action-buttons {
  display: flex;
  justify-content: space-around;

  .ant-btn {
    padding: 0 $spacing-xs;
  }
}

// 详情抽屉样式
.detail-section {
  margin-bottom: $spacing-lg;

  .section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: $spacing-sm;
    color: $text-primary;
    position: relative;
    padding-left: 12px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 16px;
      background-color: $primary-color;
      border-radius: 2px;
    }
  }
}

:deep(.ant-descriptions-item-label) {
  width: 100px;
  font-weight: 500;
  color: $text-secondary;
}

.detail-value {
  color: $text-primary;
}

.product-image {
  border-radius: 4px;
  border: 1px solid #eee;
}

.product-name-link {
  padding: 0;
  height: auto;
  line-height: 1.5;
  text-align: left;
}

.price {
  color: #f56c6c;
  font-weight: 500;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: $spacing-xs;
}

.detail-label {
  width: 80px;
  color: $text-secondary;
  flex-shrink: 0;
  font-weight: 500;
}

.detail-content {
  flex: 1;
  word-break: break-all;
  color: $text-primary;
}

.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.no-spec {
  color: $text-secondary;
}
</style>
