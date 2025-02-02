export const commodityColumns = [
    {
        title: '商品图片',
        dataIndex: 'image',
        key: 'image',
        width: '10%',
    },
    {
        title: '商品',
        dataIndex: 'name',
        key: 'name',
        width: '50%',
    },
    {
        title: '单价',
        dataIndex: 'price',
        key: 'price',
        customRender: ({ text }) => `¥${(text / 100).toFixed(2)}`,
    },
    {
        title: '数量',
        dataIndex: 'num',
        key: 'num',
    }
]
