import dayjs from 'dayjs';

const orderColumns = [
    {
        title: '订单ID',
        dataIndex: 'id',
        key: 'id'
    },
    {
        title: '总费用',
        dataIndex: 'totalFee',
        key: 'totalFee',
        customRender: ({ text }) => `¥ ${text / 100}`,  // 假设费用单位是分，转换为元
        sorter: (a, b) => a.totalFee - b.totalFee,      // 排序
    },
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        sorter: (a, b) => a.status.localeCompare(b.status), // 添加排序功能
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        customRender: ({ text }) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
        sorter: (a, b) => new Date(a.createTime) - new Date(b.createTime),
    },
    {
        title: '操作',
        key: 'action',
    }
];

const getStatusText = (status) => {
    switch (status) {
        case '1':
            return '等待付款';
        case '2':
            return '已付款';
        case '3':
            return '已发货,未确认';
        case '4':
            return '交易完成';
        case '5':
            return '订单取消';
        case '6':
            return '交易结束，已评价';
        default:
            return status;
    }
};


const getStatusColor = (status) => {
    switch (status) {
        case '1':
            return 'orange';
        case '2':
            return 'purple';
        case '3':
            return 'blue';
        case '4':
            return 'green';
        case '5':
            return 'red';
        case '6':
            return 'gray';
        default:
            return 'blue';
    }
};

export {
    orderColumns,
    getStatusText,
    getStatusColor
}