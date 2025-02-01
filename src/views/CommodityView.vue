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

onMounted(() => {
  forbiddenScroll()
  const id = route.query.id
  if (id) {
    console.log(`商品ID: ${id}`)
    queryCommodity(id)
  }
})

onBeforeUnmount(() => {
  allowScroll()
})

</script>

<template>
  <div class="commodity-page">
    <div v-if="commodity" class="commodity-container">
      <a-row :gutter="16">
        <a-col :span="10">
          <div class="image-url-group">
            <a-input v-model:value="commodity.image" class="field-input" @blur="validateImage" />
          </div>
          <img :src="commodity.image" alt="商品图片" class="commodity-image" />
        </a-col>
        <a-col :span="14" class="commodity-details">
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
              <a-input-number v-model:value="commodity[field.key]" class="field-input"
                :disabled="field.editable === false" @blur="() => validateField(field)" />
            </template>
            <template v-else>
              <a-input v-model:value="commodity[field.key]" :placeholder="field.label" class="field-input"
                :disabled="field.editable === false" @blur="() => validateField(field)" />
            </template>
          </div>
          <div class="commodity-buttons">
            <a-button type="primary" size="large" @click="saveCommodity" :disabled="!canSave">
              保存
            </a-button>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style src="@/assets/styles/commodity.scss" lang="scss" scoped></style>
