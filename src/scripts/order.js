import { reactive, ref } from 'vue'
import { getOrderDetailService, getOrderPageService, removeOrderService } from '@/api/order'
import { message } from 'ant-design-vue'

// 加载状态和数据
const loading = ref(false)
const orders = ref([])

// 查询条件，添加排序字段和排序顺序
const query = reactive({
  pageNo: 1,
  pageSize: 20,
  id: null,
  status: null,
  createStartTime: null,
  createEndTime: null,
  sortField: null,
  sortOrder: null,
})

// 修改日期格式转换函数，格式化为 "YYYY-MM-DDTHH:mm:ss"
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

// 更新查询订单信息函数
/**
 * 处理查询
 * @param {boolean} resetPage 是否重置页码
 */
const handleSearch = async (resetPage = false) => {
  // 如果需要重置页码，将当前页设为1
  if (resetPage) {
    pagination.current = 1
    query.pageNo = 1 // 确保查询参数中的页码也被重置
  }

  loading.value = true
  // 拷贝 query并转换日期格式
  const params = { ...query }

    // 日期格式化
    ;['createStartTime', 'createEndTime'].forEach((field) => {
      if (params[field]) {
        params[field] = formatDate(params[field])
      }
    })

  await getOrderPageService(params)
    .then((res) => {
      orders.value = res.records
      pagination.total = res.total
      pagination.pageSize = res.size
      pagination.current = res.current
    })
    .finally(() => {
      loading.value = false
    })
}

// 简化排序器实现：根据字段比较 a 和 b
const localSort = (field) => (a, b) => {
  const aVal = a[field] ?? ''
  const bVal = b[field] ?? ''
  const numA = parseFloat(aVal),
    numB = parseFloat(bVal)
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB
  }
  return String(aVal).localeCompare(String(bVal))
}

// 分页配置
const pagination = reactive({
  current: query.pageNo,
  pageSize: query.pageSize,
  total: 0,
  showSizeChanger: true,
  onChange(page, pageSize) {
    query.pageNo = page
    query.pageSize = pageSize
    pagination.current = page
    pagination.pageSize = pageSize
    handleSearch()
  },
  onShowSizeChange(page, pageSize) {
    query.pageNo = page
    query.pageSize = pageSize
    pagination.current = page
    pagination.pageSize = pageSize
    handleSearch()
  },
})

// 删除订单事件
const handleDelete = async (orderId) => {
  const hide = message.loading('正在删除订单...', 0)
  await removeOrderService(orderId)
    .then(() => {
      message.success('订单删除成功')
      handleSearch()
    })
    .finally(() => {
      hide()
    })
}

// 提取订单状态数组
const orderStatus = [
  { value: 1, label: '未付款', color: 'orange' },
  { value: 4, label: '交易成功', color: 'green' },
  { value: 5, label: '订单取消', color: 'red' },
]

// 表格列配置，增加 width 属性自定义列宽，以及 sorter 属性
const columns = [
  { title: '订单ID', dataIndex: 'id', width: 180, sorter: localSort('id') },
  { title: '用户ID', dataIndex: 'userId', width: 80, sorter: localSort('userId') },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    sorter: localSort('createTime'),
    customRender: (text) => new Date(text).toLocaleString(),
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    sorter: localSort('status'),
    customRender: (text) => {
      const statusItem = orderStatus.find((item) => item.value === text)
      return statusItem ? statusItem.label : text
    },
  },
  {
    title: '总费用',
    dataIndex: 'totalFee',
    width: 120,
    sorter: localSort('totalFee'),
    customRender: (text) => (text / 100).toFixed(2),
  },
  {
    title: '支付时间',
    dataIndex: 'payTime',
    width: 180,
    sorter: localSort('payTime'),
    customRender: (text) => (text ? new Date(text).toLocaleString() : '-'),
  },
]

// 根据列定义处理自定义渲染
const renderColumn = (col, text) => {
  return col.customRender ? col.customRender(text) : text
}

// 将字符串状态转换为数字并返回对应文本
const getStatusLabel = (value) => {
  const numVal = Number(value)
  const statusItem = orderStatus.find((item) => item.value === numVal)
  return statusItem ? statusItem.label : value
}

// 定义订单详情描述字段数组
const detailFields = [
  { label: '订单ID', key: 'id' },
  { label: '用户名', key: 'username', default: '-' },
  { label: '总费用', key: 'totalFee', format: (v) => (v ? '￥' + (v / 100).toFixed(2) : '-') },
  { label: '订单状态', key: 'status', format: (v) => getStatusLabel(v) },
  {
    label: '创建时间',
    key: 'createTime',
    default: '-',
    format: (v) => (v ? new Date(v).toLocaleString() : '-'),
  },
  {
    label: '支付时间',
    key: 'payTime',
    default: '-',
    format: (v) => (v ? new Date(v).toLocaleString() : '-'),
  },
  {
    label: '更新时间',
    key: 'updateTime',
    default: '-',
    format: (v) => (v ? new Date(v).toLocaleString() : '-'),
  },
]

// 根据订单ID更新数据并显示订单详情面板
const openOrderDetailPanel = async (orderId, orderDetailData, orderDetailVisible) => {
  const hide = message.loading('正在获取订单详情...', 0)
  try {
    const res = await getOrderDetailService(orderId)
    orderDetailData.value = res.data
    orderDetailVisible.value = true
  } finally {
    hide()
  }
}

export {
  loading,
  orders,
  query,
  handleSearch,
  pagination,
  handleDelete,
  columns,
  renderColumn,
  orderStatus,
  getStatusLabel,
  detailFields,
  openOrderDetailPanel,
}
