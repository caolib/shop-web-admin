<script setup>
import { onMounted, ref, h, onBeforeUnmount, computed } from 'vue'
import { allowScroll, forbiddenScroll } from '@/utils/page'
import { useRoute } from 'vue-router'

const route = useRoute()

import {
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
} from '@/scripts/commodity'
import { handleImageError } from '@/utils/handleImg'

onMounted(() => {
  // 禁用页面滚动
  // forbiddenScroll()
  // 根据路由中的 query 参数获取商品 ID，若存在则加载商品信息
  const id = route.query.id
  if (id) {
    console.log(`商品ID: ${id}`)
    queryCommodity(id)
  }
})

onBeforeUnmount(() => {
  // 组件卸载前恢复页面滚动
  // allowScroll()
})
</script>

<template>
  <!-- 商品页面容器 -->
  <div class="commodity-page">
    <!-- 检查是否有商品数据 -->
    <div v-if="commodity" class="commodity-container">
      <!-- 商品信息区域 -->
      <a-row :gutter="16">
        <!-- 商品图片区域 -->
        <a-col :span="10">
          <!-- 图片输入与展示 -->
          <div class="image-url-group">
            <a-input v-model:value="commodity.image" class="field-input" @blur="validateImage" />
          </div>
          <img :src="commodity.image" alt="商品图片" class="commodity-image" />
        </a-col>
        <!-- 商品详情区域 -->
        <a-col :span="14" class="commodity-details">
          <!-- 字段信息展示区域 -->
          <div v-for="field in fields" :key="field.key" class="field-group">
            <label class="field-label">{{ field.label }}:</label>
            <template v-if="field.key === 'status'">
              <a-select v-model:value="commodity.status" class="field-input" :disabled="field.editable === false">
                <a-select-option v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </template>
            <template v-else-if="field.type === 'number'">
              <a-input-number v-if="field.editable" v-model:value="commodity[field.key]" class="field-input"
                @blur="() => validateField(field)" />
              <a-input v-else v-model:value="commodity[field.key]" class="field-input" :disabled="true" readonly />
            </template>
            <template v-else>
              <a-input v-model:value="commodity[field.key]" :placeholder="field.label" class="field-input"
                :disabled="field.editable === false" @blur="() => validateField(field)" />
            </template>
          </div>
          <!-- 操作按钮区域 -->
          <div class="commodity-buttons">
            <a-tooltip v-if="!canSave" title="尚未修改或内容不合法">
              <a-button type="primary" size="large" :disabled="true">
                保存
              </a-button>
            </a-tooltip>
            <a-button v-else type="primary" size="large" @click="saveCommodity">
              保存
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style src="@/assets/styles/commodity.scss" lang="scss" scoped></style>
