<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';

const props = defineProps({
    value: {
        type: String,
        default: '{}'
    }
});

const emit = defineEmits(['update:value', 'change']);

// 本地存储规格项
const specItems = ref([]);

// 初始化规格数据
const initSpecItems = () => {
    try {
        const specObj = JSON.parse(props.value || '{}');
        specItems.value = Object.entries(specObj).map(([key, value]) => ({
            key,
            values: Array.isArray(value) ? value : [String(value)]
        }));

        // 如果没有规格，添加一个空的规格项
        if (specItems.value.length === 0) {
            addSpecItem();
        }
    } catch (e) {
        // 如果解析失败，初始化为空数组并添加默认项
        specItems.value = [];
        addSpecItem();
    }
};

// 添加新的规格项
const addSpecItem = () => {
    specItems.value.push({
        key: '',
        values: ['']
    });
};

// 删除指定规格项
const removeSpecItem = (index) => {
    specItems.value.splice(index, 1);
    updateValue();
};

// 添加规格值
const addSpecValue = (specIndex) => {
    specItems.value[specIndex].values.push('');
    updateValue();
};

// 删除规格值
const removeSpecValue = (specIndex, valueIndex) => {
    specItems.value[specIndex].values.splice(valueIndex, 1);
    updateValue();
};

// 更新key
const updateKey = (index, value) => {
    specItems.value[index].key = value;
    updateValue();
};

// 更新value
const updateValue = () => {
    const result = {};

    // 过滤掉空的规格项
    const validItems = specItems.value.filter(item =>
        item.key.trim() !== '' &&
        item.values.some(val => val.trim() !== '')
    );

    validItems.forEach(item => {
        // 过滤掉空的规格值
        const validValues = item.values.filter(val => val.trim() !== '');
        if (validValues.length > 0) {
            result[item.key] = validValues;
        }
    });

    const jsonString = JSON.stringify(result);
    emit('update:value', jsonString);
    emit('change', jsonString);
};

// 监听输入属性变化
watch(() => props.value, () => {
    initSpecItems();
}, { immediate: true });
</script>

<template>
    <div class="spec-editor">
        <div class="spec-editor-header">
            <span class="spec-title">规格编辑</span>
            <a-button type="link" size="small" @click="addSpecItem">
                <template #icon><plus-outlined /></template>
                添加规格
            </a-button>
        </div>

        <div v-if="specItems.length === 0" class="empty-specs">
            <a-empty description="暂无规格" :image-style="{ height: '40px' }" />
        </div>

        <div v-else class="specs-container">
            <div v-for="(spec, specIndex) in specItems" :key="specIndex" class="spec-item">
                <div class="spec-row">
                    <div class="spec-key">
                        <a-input v-model:value="spec.key" placeholder="规格名称" class="spec-key-input"
                            @change="() => updateKey(specIndex, spec.key)" />
                    </div>
                    <div class="spec-values-container">
                        <div class="spec-values-wrapper">
                            <a-tag v-for="(value, valueIndex) in spec.values" :key="valueIndex" closable
                                :color="value.trim() ? 'blue' : ''" class="spec-value-tag"
                                @close="removeSpecValue(specIndex, valueIndex)">
                                <a-input v-model:value="spec.values[valueIndex]" placeholder="规格值"
                                    class="spec-value-inline-input" @change="updateValue"
                                    @pressEnter="addSpecValue(specIndex)" />
                            </a-tag>
                            <a-button type="link" size="small" @click="addSpecValue(specIndex)" class="add-value-btn">
                                <plus-outlined /> 添加值
                            </a-button>
                        </div>
                        <a-button type="link" danger @click="removeSpecItem(specIndex)" class="remove-spec-btn">
                            <delete-outlined />
                        </a-button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="props.value && props.value !== '{}'" class="preview-container">
            <div class="preview-title">规格预览</div>
            <div class="preview-content">
                <pre>{{ props.value }}</pre>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.spec-editor {
    padding: $spacing-sm;
    border: 1px solid #e8e8e8;
    border-radius: $border-radius;
    background-color: white;
    margin-bottom: 0;
}

.spec-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
}

.spec-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
}

.specs-container {
    margin-bottom: $spacing-sm;
    max-height: 300px;
    overflow-y: auto;
    padding-right: $spacing-xs;
}

.spec-item {
    background-color: #f9f9f9;
    padding: $spacing-sm;
    border-radius: $border-radius;
    margin-bottom: $spacing-sm;
    border: 1px solid #eee;
    transition: $transition-normal;

    &:hover {
        border-color: $primary-color;
    }
}

.spec-row {
    display: flex;
    align-items: flex-start;
}

.spec-key {
    width: 100px;
    margin-right: $spacing-sm;
    flex-shrink: 0;
}

.spec-key-input {
    border-radius: $border-radius;
    font-weight: 500;

    &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
    }
}

.spec-values-container {
    display: flex;
    align-items: flex-start;
    flex: 1;
}

.spec-values-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    flex: 1;
    min-height: 32px;
    padding: 2px 0;
}

.spec-value-tag {
    margin-right: $spacing-xs;
    margin-bottom: $spacing-xs;
    padding: 0 2px 0 8px;

    .spec-value-inline-input {
        width: 80px;
        border: none;
        background: transparent;
        padding: 0;
        margin: 0;
        height: 22px;

        &:focus {
            box-shadow: none;
        }
    }
}

.add-value-btn {
    font-size: 12px;
    padding: 0 4px;
    height: 22px;
    line-height: 22px;
}

.remove-spec-btn {
    margin-left: $spacing-xs;
    padding: 4px;
    height: 32px;
}

.preview-container {
    margin-top: $spacing-sm;
    padding: $spacing-xs;
    background-color: #f9f9f9;
    border-radius: $border-radius;
    border: 1px dashed #e0e0e0;
}

.preview-title {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: $spacing-xs;
}

.preview-content {
    pre {
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
        padding: $spacing-xs;
        background-color: #f5f5f5;
        border-radius: $border-radius;
        color: #666;
        max-height: 80px;
        overflow-y: auto;
    }
}

.empty-specs {
    text-align: center;
    padding: $spacing-md 0;
}

// 响应式调整
@media (max-width: 768px) {
    .spec-row {
        flex-direction: column;
    }

    .spec-key {
        width: 100%;
        margin-right: 0;
        margin-bottom: $spacing-xs;
    }

    .spec-values-container {
        width: 100%;
    }
}
</style>