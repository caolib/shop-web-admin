<script setup>
import { menuItems } from '@/config/home'
import { searchHomeService } from '@/api/search.js'
import { onMounted, ref } from 'vue'
import { jumpToItem, jumpWithQuery } from '@/router/jump'

const commodity = ref([]) // 商品列表
const key = ref('') // 搜索关键字

// 搜索主页商品
const search = async () => {
  await searchHomeService().then((res) => {
    // console.log(res)
    commodity.value = res.list
  })
}

// 初始化商品信息
onMounted(() => {
  search()
})


// 商品分类点击事件
const handleClick = (item) => {
  // message.success(`商品分类: ${item}`)
  jumpWithQuery('/search', { category: item })
}

// 搜索按钮点击事件
const handleSearchClick = () => {
  // message.success(`关键字: ${key.value}`)
  jumpWithQuery('/search', { key: key.value })
}
</script>

<template>
  <div class="layout-main">
    <!--搜索框-->
    <div class="search-input">
      <a-input-search v-model:value="key" enter-button @search="handleSearchClick" size="large" placeholder="搜索商品"
        style="width: 60vw; margin-top: 20px" />
    </div>

    <!--商品展示-->
    <div class="commodity-body">
      <!--侧边商品分类栏-->
      <div class="commodity-classify">
        <a-menu mode="inline" theme="light" default-selected-keys="1">
          <a-menu-item v-for="menuItem in menuItems" :key="menuItem.key">
            <a-breadcrumb separator="|">
              <component :is="menuItem.icon" class="breadcrumb-icon" />
              <a-breadcrumb-item class="commodity-item" v-for="item in menuItem.items" :key="item"
                @click="handleClick(item)">
                {{ item }}
              </a-breadcrumb-item>
            </a-breadcrumb>
          </a-menu-item>
        </a-menu>
      </div>

      <!--商品展示卡片-->
      <div class="commodity-display">
        <a-row>
          <a-col :span="6" v-for="item in commodity" :key="item.id">
            <a-card class="commodity-card" hoverable @click="jumpToItem(item.id)">
              <template #cover>
                <img :src="item.image" alt="" />
              </template>
              <a-card-meta>
                <template #title>
                  <span class="price">￥{{ item.price }}</span>
                </template>
                <template #description>
                  <span style="color: black">{{ item.name }}</span>
                </template>
              </a-card-meta>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </div>

  </div>
</template>

<style scoped lang="less">
@import '@/styles/var';

.layout-main {
  height: 99vh;
  width: 99vw;
}

/* 搜索框 */
.search-input {
  //background: @primary-color;
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
}

/* 商品分类菜单 */
.commodity-classify {
  background: #f0f2f5;
  height: auto;
  width: 20vw;
  float: left;
}

ul.ant-menu.ant-menu-root.ant-menu-inline {
  border: 1px solid #dedede;
  border-radius: 10px;
}

/* 商品分类悬浮高亮 */
.ant-breadcrumb li:last-child:hover,
.commodity-item:hover {
  color: @primary-color;
}

.commodity-item {
  color: #000;
}

/* 面包屑前图标间隔 */
.breadcrumb-icon {
  margin-right: 5px;
}

/* 商品卡片 */
.commodity-card {
  margin-top: 10px;
  margin-left: 5px;
  width: auto;
}

/* 价格文本 */
span.price {
  color: @red;
}
</style>
