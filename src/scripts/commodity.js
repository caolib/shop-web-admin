import { updateCommodityService } from '@/api/commodity'
import { queryCommodityById } from '@/api/search'
import { message } from 'ant-design-vue'
import { ref, computed } from 'vue'

const commodity = ref(null)
const initialCommodity = ref(null) // 用于保存初始状态

// 商品字段
const fields = [
    { key: "id", label: "商品ID", type: "number", editable: false },
    { key: 'name', label: '商品名称', type: 'string', editable: true },
    { key: 'price', label: '单价（分）', type: 'number', editable: true },
    { key: 'stock', label: '库存', type: 'number', editable: true },
    { key: 'category', label: '分类', type: 'string', editable: true },
    { key: 'brand', label: '品牌', type: 'string', editable: true },
    { key: 'spec', label: '规格（JSON）', type: 'string', editable: true },
    { key: 'sold', label: '销量', type: 'number', editable: false },
    { key: 'commentCount', label: '评论数', type: 'number', editable: false },
    { key: 'status', label: '状态', type: 'number', editable: true }
]


// 商品状态选项
const statusOptions = [
    { value: 1, label: "正常" },
    { value: 2, label: "下架" },
    { value: 3, label: "删除" }
]

// 查询商品信息
const queryCommodity = async (id) => {
    await queryCommodityById(id).then((res) => {
        commodity.value = res
        // 保存初始状态深拷贝
        initialCommodity.value = JSON.parse(JSON.stringify(res))
        console.log('商品信息:', commodity.value)
    })
}

// 校验：单价 > 0，库存是正整数，图片为有效链接（http/https 开头）
const isValid = computed(() => {
    if (!commodity.value) return false
    const priceValid = Number(commodity.value.price) > 0
    const stockValid = Number.isInteger(Number(commodity.value.stock)) && Number(commodity.value.stock) > 0
    const urlRegex = /^(https?:\/\/[^\s]+)$/i
    const imageValid = commodity.value.image && urlRegex.test(commodity.value.image)
    return priceValid && stockValid && imageValid
})

// computed 判断商品是否被修改
const isModified = computed(() => {
    return JSON.stringify(commodity.value) !== JSON.stringify(initialCommodity.value)
})

// 只有当修改且内容合法时才能保存
const canSave = computed(() => {
    return isModified.value && isValid.value
})


// 校验方法
const validateField = (field) => {
    if (!commodity.value) return
    if (field.key === 'price') {
        if (Number(commodity.value.price) <= 0) {
            message.error("单价必须为正数")
        }
    } else if (field.key === 'stock') {
        if (!(Number.isInteger(Number(commodity.value.stock)) && Number(commodity.value.stock) > 0)) {
            message.error("库存必须为正整数")
        }
    } else if (field.key === 'spec') {
        try {
            JSON.parse(commodity.value.spec)
        } catch (e) {
            message.error("规格必须是有效的 JSON 格式")
        }
    }
}

// 校验图片链接
const validateImage = () => {
    const urlRegex = /^(https?:\/\/[^\s]+)$/i
    if (!commodity.value.image || !urlRegex.test(commodity.value.image)) {
        message.error("图片链接格式不合法")
    }
}


// 更新商品信息
const saveCommodity = async () => {
    const hide = message.loading("正在更新商品信息...", 0)
    await updateCommodityService(commodity.value).then(() => {
        message.success("商品信息更新成功")
        initialCommodity.value = JSON.parse(JSON.stringify(commodity.value))
    }).finally(() => {
        hide()
    })

}

export {
    commodity,
    initialCommodity,
    fields,
    statusOptions,
    queryCommodity,
    isValid,
    isModified,
    canSave,
    saveCommodity,
    validateField,
    validateImage
}