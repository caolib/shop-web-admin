import { jumpToItem, jumpWithQuery } from '@/router/jump'
import { ref } from 'vue'
import { searchHomeService } from '@/api/search.js'

const commodity = ref([]) // 商品列表
const key = ref('') // 搜索关键字

// 搜索主页商品
const search = async () => {
    await searchHomeService().then((res) => {
        commodity.value = res.list
    })
}

// 商品分类点击事件
const handleClick = (item) => {
    jumpWithQuery('/search', { category: item })
}

// 搜索按钮点击事件
const handleSearchClick = () => {
    // message.success(`关键字: ${key.value}`)
    jumpWithQuery('/search', { key: key.value })
}

export {
    handleClick,
    handleSearchClick,
    search,
    commodity,
    key,
}