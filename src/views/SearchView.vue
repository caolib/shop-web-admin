<script setup>
import { onMounted, reactive, ref, computed, h } from 'vue'
import { searchService } from '@/api/search.js'
import router from '@/router/index.js'
import { jumpToItem } from '@/router/jump'
import { CaretDownFilled, CaretUpFilled } from '@ant-design/icons-vue'
import { handleImageError } from '@/utils/handleImg.js'
import { presetBrands, presetCategories, sortOptions } from "@/scripts/search";
import { showAddForm, statusOptions, toggleAddForm, newCommodity, addCommodity } from '@/scripts/commodity'
import { PlusCircleFilled } from '@ant-design/icons-vue'

const commodity = ref([]) // 商品列表
const total = ref(0) // 商品总数

// 搜索商品信息
const searchCommodity = async () => {
  const paramsCopy = Object.assign({}, searchParams);
  // console.log('params:', paramsCopy)
  await searchService(paramsCopy).then((res) => {
    commodity.value = res.list
    total.value = res.total
    // console.log(res)
  })
}

// 搜索参数
const searchParams = reactive({
  key: '',
  pageNo: 1,
  pageSize: 24,
  sortBy: '',
  isAsc: false,
  brand: '',
  category: '',
  minPrice: null,
  maxPrice: null,
})

// 输入框搜索条件
const inputKey = ref('')
const inputBrand = ref('')
const inputCategory = ref('')

const loading = ref(false)

onMounted(() => {
  loading.value = true

  // 解析路径参数
  const { key, category } = router.currentRoute.value.query;
  // 设置搜索参数
  if (key) {
    inputKey.value = key
    searchParams.key = key
  }
  if (category) searchParams.category = category

  searchCommodity().finally(() => {
    loading.value = false
  })
})


// 设置搜索关键字
const setKey = () => {
  searchParams.key = inputKey.value
  searchCommodity()
}

// 设置品牌
const setBrand = (brand) => {
  searchParams.brand = brand
  searchCommodity()
}

// 设置分类
const setCategory = (category) => {
  searchParams.category = category
  searchCommodity()
}

// 重置价格
const resetPrice = () => {
  searchParams.minPrice = null
  searchParams.maxPrice = null
  searchCommodity()
}

// 重置搜索条件
const resetCondition = () => {
  searchParams.brand = '';
  searchParams.category = '';
  resetPrice()
  searchCommodity()
}

// 计算价格标签内容
const priceTag = computed(() => {
  if (searchParams.minPrice !== null && searchParams.maxPrice !== null) {
    return `￥${searchParams.minPrice} - ${searchParams.maxPrice}`
  } else if (searchParams.minPrice !== null) {
    return `>= ￥${searchParams.minPrice}`
  } else if (searchParams.maxPrice !== null) {
    return `<= ￥${searchParams.maxPrice}`
  }
  return ''
})


// 切换排序
const toggleSort = (e) => {
  if (searchParams.sortBy === e)
    searchParams.isAsc = !searchParams.isAsc
  else {
    searchParams.sortBy = e
    searchParams.isAsc = false
  }
  console.log(`排序方式: ${searchParams.sortBy}, ${searchParams.isAsc ? '升序' : '降序'}`)
  searchCommodity()
}


</script>

<template>
  <div class="layout-main">
    <!--搜索框-->
    <div class="search-input">
      <a-input-search v-model:value="inputKey" enter-button @search="setKey" size="large" placeholder="搜索商品"
        style="width: 60vw; margin-top: 20px" />
    </div>

    <!--搜索条件-->
    <div class="search-condition">
      <!-- 分类 -->
      <a-row class="condition-row">
        <span>分类</span>
        <a-input v-model:value="inputCategory" allow-clear placeholder="输入分类" @pressEnter="setBrand(inputCategory)"
          style="width: 10vw;" />
        <div>
          <span v-for="cate in presetCategories" :key="cate" @click="setCategory(cate)" class="condition-row-item">{{
            cate
          }}</span>
        </div>
        <!-- 添加商品按钮 -->
        <a-button type="primary" style="margin-left:auto;" :icon="h(PlusCircleFilled)"
          @click="toggleAddForm">新增</a-button>
      </a-row>

      <!-- 品牌 -->
      <a-row class="condition-row">
        <span>品牌</span>
        <a-input v-model:value="inputBrand" allow-clear placeholder="输入品牌名" @pressEnter="setBrand(inputBrand)"
          style="width: 10vw;" />
        <div>
          <span v-for="brand in presetBrands" :key="brand" @click="setBrand(brand)" class="condition-row-item">{{ brand
          }}</span>
        </div>
      </a-row>

      <!-- 第三行 -->
      <a-row class="condition-row" align="middle">
        <!-- 排序条件 -->
        <a-col>
          <span>排序</span>
        </a-col>
        <a-col style="display:flex;gap:10px;">
          <a-button v-for="sortOption in sortOptions" :key="sortOption.value" @click="toggleSort(sortOption.value)"
            :type="searchParams.sortBy === sortOption.value ? 'primary' : 'default'">
            {{ sortOption.label }}
            <caret-up-filled v-if="searchParams.isAsc" />
            <caret-down-filled v-else />
          </a-button>
        </a-col>
        <a-col style="margin-left:auto;">
          <a-row align="middle">
            <!-- 价格区间 -->
            <a-col>
              <span style="margin-right: 10px">价格</span>
            </a-col>
            <a-col>
              <a-input-number v-model:value="searchParams.minPrice" @pressEnter="searchCommodity" prefix="￥" min="0"
                placeholder="最低价格" style="width: 10vw;margin-right: 10px;" />
              <a-input-number v-model:value="searchParams.maxPrice" @pressEnter="searchCommodity" prefix="￥"
                placeholder="最高价格" style="width: 10vw;margin-right: 10px;" />
            </a-col>
            <!-- 分页条 默认每页大小为24 -->
            <a-col><span>共 {{ total }} 件商品</span></a-col>
            <a-col>
              <a-pagination v-model:current="searchParams.pageNo" @change="searchCommodity" :total="Number(total)"
                :page-size=searchParams.pageSize simple />
            </a-col>
          </a-row>
        </a-col>
      </a-row>

      <!-- 条件标签 -->
      <a-row class="condition-row">
        <a-col>
          <span>条件</span>
        </a-col>
        <a-col>
          <!-- 条件标签 -->
          <a-tag v-if="searchParams.brand" closable @close="setBrand('')">{{ searchParams.brand }}</a-tag>
          <a-tag v-if="searchParams.category" closable @close="setCategory('')">{{ searchParams.category
          }}</a-tag>
          <a-tag v-if="priceTag" closable @close="resetPrice">
            {{ priceTag }}
          </a-tag>
          <!-- 清空标签 -->
          <a-tag color='red' style="cursor: pointer;font-size: 14px;" @click="resetCondition">清除</a-tag>
        </a-col>
      </a-row>

    </div>

    <!--商品卡片展示-->
    <a-spin :spinning="loading">
      <div class="commodity-display">
        <a-empty v-if="commodity.length === 0" description="暂无商品" />
        <a-row v-else>
          <a-col :span="4" v-for="item in commodity" :key="item.id">
            <a-card class="commodity-card" hoverable @click="jumpToItem(item.id)">
              <!-- 封面 -->
              <template #cover>
                <img :src="item.image" :alt="item.name" @error="handleImageError" />
              </template>
              <a-card-meta>
                <!-- 价格 -->
                <template #title>
                  <span class="price">￥{{ (item.price / 100).toFixed(2) }}</span>
                </template>
                <!-- 商品描述 -->
                <template #description>
                  <span class="commodity-desc">{{ item.name }}</span>
                  <div style="margin-top: 5px;">
                    <span>已售出：{{ item.sold }}</span>
                  </div>
                  <div style="margin-top: 5px;">
                    <span>{{ item.commentCount }} 条评论</span>
                    <a-tag :color="item.status === 2 ? `red` : ``" style="margin-left: 10px;">{{statusOptions.find(s =>
                      s.value
                      === item.status)?.label
                    }}</a-tag>
                  </div>
                </template>

              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-spin>

    <!-- 新增添加商品表单 -->
    <a-modal v-model:open="showAddForm" title="添加商品">
      <a-form layout="horizontal" :labelCol="{ span: 6 }" :wrapperCol="{ span: 14 }" ref="addFormRef">
        <a-form-item label="商品名" :rules="[{ required: true, message: '请输入商品名称' }]">
          <a-input v-model:value="newCommodity.name" />
        </a-form-item>
        <a-form-item label="分类" :rules="[{ required: true, message: '请输入分类' }]">
          <a-input v-model:value="newCommodity.category" />
        </a-form-item>
        <a-form-item label="品牌" :rules="[{ required: true, message: '请输入品牌' }]">
          <a-input v-model:value="newCommodity.brand" />
        </a-form-item>
        <a-form-item label="单价（分）">
          <a-input-number prefix="￥" v-model:value="newCommodity.price" style="width: 100%;" />
        </a-form-item>
        <a-form-item label="库存数量">
          <a-input-number v-model:value="newCommodity.stock" style="width: 100%;" />
        </a-form-item>
        <a-form-item label="图片URL">
          <a-input v-model:value="newCommodity.image" />
        </a-form-item>
        <a-form-item label="销量">
          <a-input-number v-model:value="newCommodity.sold" style="width: 100%;" />
        </a-form-item>
        <a-form-item label="评论数">
          <a-input-number v-model:value="newCommodity.commentCount" style="width: 100%;" />
        </a-form-item>
        <!-- 添加状态下拉菜单 -->
        <a-form-item label="状态">
          <a-select v-model:value="newCommodity.status">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="2">已下架</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="规格（JSON）">
          <a-input v-model:value="newCommodity.spec" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="toggleAddForm">取消</a-button>
        <a-button type="primary" @click="addCommodity">确定</a-button>
      </template>
    </a-modal>

  </div>
</template>

<style src="@/assets/styles/search.scss" scoped lang="scss"></style>