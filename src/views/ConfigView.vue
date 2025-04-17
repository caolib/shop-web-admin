<template>
    <!-- 主配置容器 -->
    <div class="config-container">
        <a-card class="box-card">
            <!-- 卡片标题 -->
            <template #title>
                <div class="card-header">
                    <span>系统配置</span>
                </div>
            </template>

            <!-- 配置表单 -->
            <a-form :model="configForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
                <!-- API地址配置项 -->
                <a-form-item label="API地址">
                    <div class="url-input-group">
                        <!-- URL下拉选择器 -->
                        <a-select v-model:value="configForm.currentUrl" style="width: 100%" placeholder="请选择或输入API地址"
                            :options="urlOptions" show-search allow-clear>
                            <!-- 自定义下拉框渲染 -->
                            <template #dropdownRender="{ menuNode: menu }">
                                <!-- 渲染现有选项菜单 -->
                                <v-nodes :vnodes="menu" />
                                <a-divider style="margin: 4px 0" />
                                <!-- 添加新URL的输入区域 -->
                                <div style="padding: 8px 12px">
                                    <a-input v-model:value="newUrl" placeholder="请输入API地址，例如: http://localhost:8080"
                                        @pressEnter="addUrl">
                                        <template #suffix>
                                            <a-button type="link" size="small" @click="addUrl">
                                                <plus-outlined />
                                            </a-button>
                                        </template>
                                    </a-input>
                                </div>
                            </template>
                            <!-- 自定义选项渲染 - 添加删除按钮 -->
                            <template #option="{ value }">
                                <div class="url-option-item">
                                    <span>{{ value }}</span>
                                    <a-button type="link" danger size="small" @click.stop="removeUrl(value)">
                                        <delete-outlined />
                                    </a-button>
                                </div>
                            </template>
                        </a-select>
                    </div>
                </a-form-item>

                <!-- 操作按钮区域 -->
                <a-form-item :wrapper-col="{ offset: 6 }">
                    <a-button type="primary" @click="saveConfig" :loading="loading">保存配置</a-button>
                    <a-button @click="testConnection" :loading="testing" style="margin-left: 8px">测试连接</a-button>
                </a-form-item>
            </a-form>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, h } from 'vue'
import { message } from 'ant-design-vue'
import { getUrlConfig, updateUrlList, updateConfig, deleteUrl } from '@/utils/config'
import axios from 'axios'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// 为下拉菜单自定义渲染提供支持
const VNodes = {
    name: 'VNodes',
    props: {
        vnodes: {
            type: Object,
            required: true,
        },
    },
    render() {
        return this.vnodes
    },
}

const configForm = ref({
    currentUrl: '',
    urls: []
})

const newUrl = ref('')
const loading = ref(false)
const testing = ref(false)

// 将URLs转换为Select选项
const urlOptions = computed(() => {
    return configForm.value.urls.map(url => ({
        value: url,
        label: url
    }))
})

// 初始化加载配置
onMounted(async () => {
    try {
        const config = await getUrlConfig()
        configForm.value.urls = config.urls || []
        configForm.value.currentUrl = config.currentUrl || ''
    } catch (error) {
        console.error('加载配置失败:', error)
        message.error('加载配置失败')
    }
})

// 添加新URL
function addUrl() {
    if (!newUrl.value || newUrl.value.trim() === '') {
        return
    }

    const url = newUrl.value.trim()
    if (!configForm.value.urls.includes(url)) {
        configForm.value.urls.push(url)
        configForm.value.currentUrl = url
        newUrl.value = ''
    } else {
        message.warning('该API地址已存在')
    }
}

// 删除URL
async function removeUrl(url) {
    try {
        await deleteUrl(url)
        // 重新加载配置
        const config = await getUrlConfig()
        configForm.value.urls = config.urls
        configForm.value.currentUrl = config.currentUrl
        message.success('删除成功')
    } catch (error) {
        console.error('删除URL失败:', error)
        message.error('删除失败')
    }
}

// 保存配置
async function saveConfig() {
    if (!configForm.value.currentUrl) {
        message.warning('请选择或输入API地址')
        return
    }

    loading.value = true
    try {
        await updateUrlList(configForm.value.urls, configForm.value.currentUrl)
        message.success('配置保存成功，请重新启动应用以应用新配置')
        loading.value = false
    } catch (error) {
        console.error('保存配置失败:', error)
        message.error('保存配置失败')
        loading.value = false
    }
}

// 测试连接
async function testConnection() {
    if (!configForm.value.currentUrl) {
        message.warning('请先选择或输入API地址')
        return
    }
    testing.value = true
    try {
        // 保存当前配置
        await updateConfig(configForm.value.currentUrl)
        // 测试连接
        axios.defaults.baseURL = configForm.value.currentUrl
        await axios.get('/users/health').then(() => {
            message.success('连接成功')
        }).catch(() => {
            message.error('连接失败')
        })
    }
    catch (error) {
        console.error('测试连接失败:', error)
    } finally {
        testing.value = false
    }
}
</script>

<style src="@/assets/styles/config.scss" scoped></style>
