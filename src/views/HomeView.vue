<script setup>
import { menuItems } from '@/config/home'
import { onMounted, ref } from 'vue'
import {
  handleClick,
  handleSearchClick,
  search,
  commodity,
  key,
} from '@/scripts/home'
import { jumpToItem } from '@/router/jump';
import { handleImageError } from '@/utils/handleImg';

const loading = ref(false)

// 初始化商品信息
onMounted(() => {
  loading.value = true
  search().then(() => {
    loading.value = false
  })
})



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
        <div class="category-title">商品分类</div>
        <a-menu mode="inline" theme="light" class="category-menu">
          <a-menu-item v-for="menuItem in menuItems" :key="menuItem.key" class="category-menu-item">
            <div class="menu-item-content">
              <div class="menu-item-icon">
                <component :is="menuItem.icon" class="breadcrumb-icon" />
              </div>
              <div class="category-items">
                <span v-for="(item, index) in menuItem.items" :key="index" class="commodity-item"
                  @click.stop="handleClick(item)">
                  {{ item }}
                </span>
              </div>
            </div>
          </a-menu-item>
        </a-menu>
      </div>

      <!--商品展示卡片-->
      <a-spin :spinning="loading" tip="loading...">
        <div class="commodity-display">
          <div class="section-title">商品列表</div>
          <a-row :gutter="[16, 16]">
            <a-col :xs="12" :sm="8" :md="8" :lg="6" v-for="item in commodity" :key="item.id">
              <a-card class="commodity-card" hoverable @click="jumpToItem(item.id)">
                <template #cover>
                  <div class="image-container">
                    <img :src="item.image" alt="" @error="handleImageError" />
                  </div>
                </template>
                <a-card-meta>
                  <template #title>
                    <span class="price">￥{{ (item.price / 100).toFixed(2) }}</span>
                  </template>
                  <template #description>
                    <div class="product-name">{{ item.name }}</div>
                  </template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<style src="@/assets/styles/home.scss" scoped lang="scss"></style>
