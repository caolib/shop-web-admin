import { ref, reactive } from 'vue'
import { getOrderPageService } from '@/api/order'

// 加载状态和数据
const loading = ref(false)
const orders = ref([])

// 查询条件
const query = reactive({
    pageNo: 1,
    pageSize: 20,
    id: null,
    status: null,
    createTime: null,
    endTime: null
})

// 修改日期格式转换函数，格式化为 "YYYY-MM-DDTHH:mm:ss"
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

// 更新查询订单信息函数
const handleSearch = async () => {
    loading.value = true
    // 拷贝 query并转换日期格式
    const params = { ...query };
    if (params.createTime) {
        params.createTime = formatDate(params.createTime);
    }
    if (params.endTime) {
        params.endTime = formatDate(params.endTime);
    }
    await getOrderPageService(params).then(res => {
        orders.value = res.records
        pagination.total = res.total
        pagination.pageSize = res.size
        pagination.current = res.current
    }).finally(() => {
        loading.value = false
    })
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
    }
})

// 操作方法
const handleView = (record) => {
    console.log('查看订单', record)
    // ...实现查看逻辑...
}
const handleDelete = (record) => {
    console.log('删除订单', record)
    // ...实现删除逻辑...
}

// 提取订单状态数组
const orderStatus = [
    { value: 1, label: '未付款' },
    { value: 2, label: '已付款,未发货' },
    { value: 3, label: '已发货,未确认' },
    { value: 4, label: '确认收货，交易成功' },
    { value: 5, label: '交易取消，订单关闭' },
    { value: 6, label: '交易结束，已评价' }
]

// 表格列配置，增加 width 属性自定义列宽
const columns = [
    { title: '订单ID', dataIndex: 'id', width: 200 },
    { title: '用户ID', dataIndex: 'userId', width: 100 },
    { title: '创建时间', dataIndex: 'createTime', width: 200, customRender: text => new Date(text).toLocaleString() },
    { title: '更新时间', dataIndex: 'updateTime', width: 200, customRender: text => new Date(text).toLocaleString() },
    {
        title: '状态',
        dataIndex: 'status',
        width: 200,
        customRender: text => {
            const statusItem = orderStatus.find(item => item.value === text)
            return statusItem ? statusItem.label : text
        }
    },
    { title: '总费用', dataIndex: 'totalFee', width: 120, customRender: text => (text / 100).toFixed(2) },
    { title: '支付时间', dataIndex: 'payTime', width: 200, customRender: text => text ? new Date(text).toLocaleString() : '-' },
    { title: '配送时间', dataIndex: 'consignTime', width: 200, customRender: text => text ? new Date(text).toLocaleString() : '-' },
    { title: '订单结束时间', dataIndex: 'endTime', width: 200, customRender: text => text ? new Date(text).toLocaleString() : '-' },
    { title: '关闭时间', dataIndex: 'closeTime', width: 200, customRender: text => text ? new Date(text).toLocaleString() : '-' },
]

// 根据列定义处理自定义渲染
const renderColumn = (col, text) => {
    return col.customRender ? col.customRender(text) : text
}

export {
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
}
