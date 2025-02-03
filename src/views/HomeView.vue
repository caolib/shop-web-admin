<script setup>
import { menuItems } from '@/config/home'
import { onMounted } from 'vue'
import {
  handleClick,
  handleSearchClick,
  search,
  commodity,
  key,
} from '@/scripts/home'
import { jumpToItem } from '@/router/jump';
import { handleImageError } from '@/utils/handleImg';

// 初始化商品信息
onMounted(() => {
  search()
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
        <a-menu mode="inline" theme="light" default-selected-keys="1">
          <a-menu-item v-for="menuItem in menuItems" :key="menuItem.key">
            <a-breadcrumb separator=" ">
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
                <img :src="item.image" alt="" @error="handleImageError" />
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

<style src="@/assets/styles/home.scss" scoped lang="scss"></style>
