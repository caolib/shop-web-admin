<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import { searchService } from '@/api/search.js'
import router from '@/router/index.js'
import { jumpToItem } from '@/router/jump'
import { CaretDownFilled, CaretUpFilled, PlusCircleFilled } from '@ant-design/icons-vue'
import { handleImageError } from '@/utils/handleImg.js'
import { presetBrands, presetCategories, sortOptions } from '@/scripts/search'
import {
  addCommodity,
  newCommodity,
  showAddForm,
  statusOptions,
  toggleAddForm,
} from '@/scripts/commodity'

const commodity = ref([]) // 商品列表
const total = ref(0) // 商品总数

// 搜索商品信息
const searchCommodity = async () => {
  loading.value = true
  const paramsCopy = Object.assign({}, searchParams)
  try {
    const res = await searchService(paramsCopy)
    commodity.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
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

// 判断是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return searchParams.brand || searchParams.category || priceTag.value
})

onMounted(() => {
  loading.value = true

  // 解析路径参数
  const { key, category } = router.currentRoute.value.query
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
  searchParams.brand = ''
  searchParams.category = ''
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
  if (searchParams.sortBy === e) searchParams.isAsc = !searchParams.isAsc
  else {
    searchParams.sortBy = e
    searchParams.isAsc = false
  }
  console.log(`排序方式: ${searchParams.sortBy}, ${searchParams.isAsc ? '升序' : '降序'}`)
  searchCommodity()
}
</script>

<template>
  <div class="search-page">
    <div class="page-header">
      <h2 class="page-title">商品管理</h2>
    </div>

    <!--搜索框区域-->
    <a-card class="search-card">
      <div class="search-input-container">
        <a-input-search v-model:value="inputKey" enter-button @search="setKey" size="large" placeholder="输入商品名称、描述或关键词"
          :loading="loading" />

        <a-button type="primary" @click="toggleAddForm" class="add-button">
          <template #icon><plus-circle-filled /></template>
          新增商品
        </a-button>
      </div>

      <!--搜索条件区域-->
      <div class="search-filters">
        <!-- 分类筛选 -->
        <div class="filter-section">
          <div class="filter-label">分类:</div>
          <div class="filter-content">
            <a-input v-model:value="inputCategory" allow-clear placeholder="输入分类"
              @pressEnter="setCategory(inputCategory)" class="filter-input" />
            <div class="filter-tags">
              <a-tag v-for="cate in presetCategories" :key="cate" @click="setCategory(cate)"
                :class="{ 'tag-active': searchParams.category === cate }" class="filter-tag">
                {{ cate }}
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 品牌筛选 -->
        <div class="filter-section">
          <div class="filter-label">品牌:</div>
          <div class="filter-content">
            <a-input v-model:value="inputBrand" allow-clear placeholder="输入品牌名" @pressEnter="setBrand(inputBrand)"
              class="filter-input" />
            <div class="filter-tags">
              <a-tag v-for="brand in presetBrands" :key="brand" @click="setBrand(brand)"
                :class="{ 'tag-active': searchParams.brand === brand }" class="filter-tag">
                {{ brand }}
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 价格筛选 -->
        <div class="filter-section price-filter">
          <div class="filter-label">价格:</div>
          <div class="filter-content">
            <a-space>
              <a-input-number v-model:value="searchParams.minPrice" @pressEnter="searchCommodity" prefix="￥" min="0"
                placeholder="最低价格" />
              <span class="price-divider">-</span>
              <a-input-number v-model:value="searchParams.maxPrice" @pressEnter="searchCommodity" prefix="￥"
                placeholder="最高价格" />
              <a-button type="primary" size="small" @click="searchCommodity">确定</a-button>
            </a-space>
          </div>
        </div>

        <!-- 排序选项 -->
        <div class="filter-section sort-section">
          <div class="filter-label">排序:</div>
          <div class="filter-content">
            <a-button v-for="sortOption in sortOptions" :key="sortOption.value" @click="toggleSort(sortOption.value)"
              :type="searchParams.sortBy === sortOption.value ? 'primary' : 'default'" size="small" class="sort-button">
              {{ sortOption.label }}
              <template #icon>
                <caret-up-filled v-if="searchParams.sortBy === sortOption.value && searchParams.isAsc" />
                <caret-down-filled v-else-if="searchParams.sortBy === sortOption.value && !searchParams.isAsc" />
              </template>
            </a-button>
          </div>
        </div>

        <!-- 当前筛选条件 -->
        <div class="active-filters" v-if="hasActiveFilters">
          <div class="filter-label">已筛选:</div>
          <div class="filter-content">
            <a-tag v-if="searchParams.brand" closable @close="setBrand('')" color="blue">
              品牌: {{ searchParams.brand }}
            </a-tag>
            <a-tag v-if="searchParams.category" closable @close="setCategory('')" color="green">
              分类: {{ searchParams.category }}
            </a-tag>
            <a-tag v-if="priceTag" closable @close="resetPrice" color="orange">
              {{ priceTag }}
            </a-tag>
            <a-button v-if="hasActiveFilters" type="link" @click="resetCondition" danger>
              清除全部
            </a-button>
          </div>
        </div>
      </div>
    </a-card>

    <!--商品列表区域-->
    <a-card class="products-card">
      <template #title>
        <div class="products-header">
          <span>商品列表</span>
          <span class="products-count">共 {{ total }} 件商品</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty v-if="commodity.length === 0" description="暂无商品" />

        <div v-else class="products-grid">
          <a-card v-for="item in commodity" :key="item.id" class="product-card" hoverable @click="jumpToItem(item.id)">
            <div class="product-image">
              <img :src="item.image" :alt="item.name" @error="handleImageError" />
              <a-tag class="product-status-tag" :color="item.status === 2 ? 'red' : 'green'">
                {{statusOptions.find((s) => s.value === item.status)?.label}}
              </a-tag>
            </div>

            <div class="product-info">
              <div class="product-price">￥{{ (item.price / 100).toFixed(2) }}</div>
              <div class="product-name">{{ item.name }}</div>
              <div class="product-meta">
                <span>已售 {{ item.sold }}</span>
                <span class="product-comments">{{ item.commentCount }} 评论</span>
              </div>
            </div>
          </a-card>
        </div>

        <!-- 分页器 -->
        <div class="pagination-container">
          <a-pagination v-model:current="searchParams.pageNo" @change="searchCommodity" :total="Number(total)"
            :page-size="searchParams.pageSize" show-size-changer :page-size-options="['12', '24', '36', '48']" />
        </div>
      </a-spin>
    </a-card>

    <!-- 添加商品表单 -->
    <a-modal v-model:open="showAddForm" title="添加商品" width="700px">
      <a-form layout="horizontal" :labelCol="{ span: 6 }" :wrapperCol="{ span: 16 }" ref="addFormRef">
        <a-form-item label="商品名称" :rules="[{ required: true, message: '请输入商品名称' }]">
          <a-input v-model:value="newCommodity.name" placeholder="请输入商品名称" />
        </a-form-item>
        <a-form-item label="分类" :rules="[{ required: true, message: '请输入分类' }]">
          <a-input v-model:value="newCommodity.category" placeholder="请输入商品分类" />
        </a-form-item>
        <a-form-item label="品牌" :rules="[{ required: true, message: '请输入品牌' }]">
          <a-input v-model:value="newCommodity.brand" placeholder="请输入商品品牌" />
        </a-form-item>
        <a-form-item label="单价">
          <a-input-number prefix="￥" v-model:value="newCommodity.price" style="width: 100%" placeholder="价格（分）" />
        </a-form-item>
        <a-form-item label="库存数量">
          <a-input-number v-model:value="newCommodity.stock" style="width: 100%" placeholder="请输入库存数量" />
        </a-form-item>
        <a-form-item label="图片URL">
          <a-input v-model:value="newCommodity.image" placeholder="请输入商品图片URL" />
        </a-form-item>
        <a-form-item label="初始销量">
          <a-input-number v-model:value="newCommodity.sold" style="width: 100%" placeholder="请输入初始销量" />
        </a-form-item>
        <a-form-item label="初始评论数">
          <a-input-number v-model:value="newCommodity.commentCount" style="width: 100%" placeholder="请输入初始评论数" />
        </a-form-item>
        <a-form-item label="商品状态">
          <a-select v-model:value="newCommodity.status" placeholder="请选择商品状态">
            <a-select-option :value="1">正常</a-select-option>
            <a-select-option :value="2">已下架</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="规格（JSON）">
          <a-input v-model:value="newCommodity.spec" placeholder='例如: {"颜色":"红色","尺寸":"XL"}' />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="toggleAddForm">取消</a-button>
        <a-button type="primary" @click="addCommodity">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.search-page {
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

.search-card {
  margin-bottom: $spacing-md;
  box-shadow: $box-shadow;
  border-radius: $border-radius;
}

.search-input-container {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .ant-input-search {
    flex: 1;
  }

  .add-button {
    white-space: nowrap;
  }
}

.search-filters {
  padding-top: $spacing-sm;
  border-top: 1px solid #f0f0f0;
}

.filter-section {
  display: flex;
  align-items: flex-start;
  padding: $spacing-sm 0;
  border-bottom: 1px dashed #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.filter-label {
  width: 60px;
  flex-shrink: 0;
  color: $text-secondary;
  font-weight: 500;
  padding-top: 5px;
}

.filter-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  align-items: center;
}

.filter-input {
  width: 200px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.filter-tag {
  cursor: pointer;
  user-select: none;

  &.tag-active {
    color: $primary-color;
    background-color: #e6f7ff;
    border-color: $primary-color;
  }

  &:hover {
    border-color: $primary-color;
  }
}

.price-filter {
  .price-divider {
    color: $text-secondary;
  }
}

.sort-section {
  .sort-button {
    margin-right: $spacing-xs;
  }
}

.active-filters {
  padding-top: $spacing-sm;
  border-top: 1px solid #f0f0f0;
}

.products-card {
  box-shadow: $box-shadow;
  border-radius: $border-radius;

  .products-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .products-count {
      font-size: 14px;
      color: $text-secondary;
    }
  }
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.product-card {
  cursor: pointer;
  border-radius: $border-radius;
  overflow: hidden;
  transition: $transition-normal;
  border: 1px solid #eee;

  &:hover {
    transform: translateY(-5px);
    box-shadow: $hover-shadow;
  }

  .product-image {
    position: relative;
    height: 200px;
    background-color: #f9f9f9;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .product-status-tag {
      position: absolute;
      top: 8px;
      right: 8px;
    }
  }

  .product-info {
    padding: $spacing-sm;

    .product-price {
      font-size: 18px;
      font-weight: 600;
      color: #f56c6c;
      margin-bottom: $spacing-xs;
    }

    .product-name {
      font-size: 14px;
      line-height: 1.4;
      height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: $spacing-xs;
      color: $text-primary;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: $text-secondary;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: $spacing-md;
}

// 响应式调整
@media (max-width: 768px) {
  .search-input-container {
    flex-direction: column;
  }

  .filter-section {
    flex-direction: column;

    .filter-label {
      width: 100%;
      margin-bottom: $spacing-xs;
    }
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
