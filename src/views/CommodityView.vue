<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  canSave,
  commodity,
  fields,
  queryCommodity,
  saveCommodity,
  statusOptions,
  validateField,
  validateImage,
} from '@/scripts/commodity'
import SpecEditor from '@/components/SpecEditor.vue'

const route = useRoute()
const loading = ref(true)
const saveLoading = ref(false)

onMounted(() => {
  const id = route.query.id
  if (id) {
    console.log(`商品ID: ${id}`)
    loading.value = true
    queryCommodity(id).finally(() => {
      loading.value = false
    })
  } else {
    loading.value = false
  }
})

const handleSave = async () => {
  saveLoading.value = true
  try {
    await saveCommodity()
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <!-- 商品页面容器 -->
  <div class="commodity-page">
    <a-spin :spinning="loading">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">{{ commodity?.id ? '编辑商品' : '添加商品' }}</h2>
      </div>

      <!-- 检查是否有商品数据 -->
      <div v-if="commodity" class="commodity-container">
        <!-- 商品信息区域 -->
        <a-row :gutter="24">
          <!-- 商品图片区域 -->
          <a-col :xs="24" :md="10">
            <div class="image-section">
              <h3 class="section-title">商品图片</h3>
              <div class="image-url-group">
                <a-input v-model:value="commodity.image" class="field-input" placeholder="请输入图片URL"
                  @blur="validateImage" />
              </div>
              <div class="image-preview">
                <img :src="commodity.image" alt="商品图片" class="commodity-image" />
              </div>
            </div>
          </a-col>

          <!-- 商品详情区域 -->
          <a-col :xs="24" :md="14">
            <div class="commodity-details">
              <h3 class="section-title">商品详情</h3>

              <!-- 字段信息展示区域 -->
              <div class="fields-container">
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
                      :min="0" :precision="2" @blur="() => validateField(field)" />
                    <a-input v-else v-model:value="commodity[field.key]" class="field-input" :disabled="true"
                      readonly />
                  </template>

                  <template v-else-if="field.key === 'spec'">
                    <SpecEditor v-model:value="commodity.spec" class="field-input spec-editor-wrapper"
                      @change="() => validateField(field)" />
                  </template>

                  <template v-else>
                    <a-input v-model:value="commodity[field.key]" :placeholder="field.label" class="field-input"
                      :disabled="field.editable === false" @blur="() => validateField(field)" />
                  </template>
                </div>
              </div>

              <!-- 操作按钮区域 -->
              <div class="commodity-buttons">
                <a-button @click="$router.back()">返回</a-button>
                <a-tooltip v-if="!canSave" title="尚未修改或内容不合法">
                  <a-button type="primary" :disabled="true">保存</a-button>
                </a-tooltip>
                <a-button v-else type="primary" :loading="saveLoading" @click="handleSave">
                  保存
                </a-button>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 无商品数据展示 -->
      <div v-else-if="!loading" class="empty-container">
        <a-empty description="未找到商品数据" />
        <a-button type="primary" @click="$router.back()">返回</a-button>
      </div>
    </a-spin>
  </div>
</template>

<style src="@/assets/styles/commodity.scss" lang="scss" scoped></style>
