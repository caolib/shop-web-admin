// TODO 从数据库获取 预设数据
// TODO 可以多品牌搜索
const presetBrands = ['Apple', '华为', '小米', 'vivo', 'oppo', '魅族', '三星', '联想', '戴尔', '惠普', '华硕', '微软', '索尼', '中兴', '一加', '努比亚', '酷派', '锤子', '360']
const presetCategories = ['手机', '电脑', '服装', '玩具', '文具', '食品', '酒类', '生鲜', '特产', '家居', '家具', '家装']

// 排序选项
const sortOptions = [
    { label: '销量', value: 'sold' },
    { label: '价格', value: 'price' },
    { label: '评论数', value: 'comment_count' }
]



export {
    presetBrands,
    presetCategories,
    sortOptions
}