<script setup>
// 导入 Vue 响应式 API 和 Ant Design Vue 组件
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
// 导入用户相关 API 及共享状态
import { freezeUser, initUsers, recoverUser, handleFreeze, handleRestore, users, query, } from '@/scripts/user'
import { updateUserService } from '@/api/user'

// loading 标识，用于控制加载提示
const loading = ref(false)
// 当前正在编辑的数据行 ID
const editingKey = ref('')
// 编辑表单数据对象（保存用户名和手机号）
const form = reactive({})

// 搜索函数：调用初始化接口查找用户数据
const handleSearch = async () => {
    loading.value = true
    await initUsers()
    loading.value = false
}

// 编辑操作：进入编辑状态，并将当前记录数据复制到表单中
const edit = (record) => {
    editingKey.value = record.id
    form.username = record.username
    form.phone = record.phone
}

// 取消编辑：清除编辑状态
const cancel = () => {
    editingKey.value = ''
}

// 保存编辑后的数据：仅更新用户名和手机号
const save = async (key) => {
    const hide = message.loading('保存中...', 0)
    const index = users.value.findIndex(item => item.id === key)
    const data = {
        id: users.value[index].id,
        username: form.username,
        phone: form.phone
    }
    await updateUserService(data).then(() => {
        message.success('保存成功')
        handleSearch()
        editingKey.value = ''
    }).finally(() => {
        hide()
    })
}

// 页面加载时初始化用户数据
onMounted(async () => {
    loading.value = true
    await initUsers()
    loading.value = false
})
</script>

<template>
    <div class="user-view">
        <h2>用户管理</h2>
        <a-card>
            <!-- 搜索表单区域，支持清除按钮 -->
            <a-form layout="inline" style="margin-bottom: 16px;">
                <a-form-item>
                    <!-- ID 搜索输入框 -->
                    <a-input allowClear v-model:value="query.id" placeholder="ID搜索" />
                </a-form-item>
                <a-form-item>
                    <!-- 用户名搜索输入框 -->
                    <a-input allowClear v-model:value="query.username" placeholder="用户名搜索" />
                </a-form-item>
                <a-form-item>
                    <!-- 手机号搜索输入框 -->
                    <a-input allowClear v-model:value="query.phone" placeholder="手机号搜索" />
                </a-form-item>
                <a-form-item>
                    <!-- 状态搜索选择框 -->
                    <a-select allowClear v-model:value="query.status" placeholder="状态搜索" style="width:120px;">
                        <a-select-option :value="null">全部</a-select-option>
                        <a-select-option value=1>正常</a-select-option>
                        <a-select-option value=0>冻结</a-select-option>
                    </a-select>
                </a-form-item>
                <a-form-item>
                    <a-button type="primary" @click="handleSearch">搜索</a-button>
                </a-form-item>
            </a-form>

            <!-- 展示用户数据的表格 -->
            <a-spin :spinning="loading">
                <!-- 增加横向滚动支持 -->
                <a-table :dataSource="users" rowKey="id" bordered :scroll="{ x: 'max-content' }">
                    <!-- ID 列：支持排序 -->
                    <a-table-column title="ID" dataIndex="id" :sorter="(a, b) => a.id - b.id" />

                    <!-- 用户名列：支持编辑状态切换 -->
                    <a-table-column title="用户名" dataIndex="username">
                        <template #default="{ record }">
                            <template v-if="editingKey === record.id">
                                <a-input v-model:value="form.username" />
                            </template>
                            <template v-else>
                                {{ record.username }}
                            </template>
                        </template>
                    </a-table-column>

                    <!-- 手机号列：同样支持编辑状态 -->
                    <a-table-column title="手机号" dataIndex="phone">
                        <template #default="{ record }">
                            <template v-if="editingKey === record.id">
                                <a-input v-model:value="form.phone" />
                            </template>
                            <template v-else>
                                {{ record.phone }}
                            </template>
                        </template>
                    </a-table-column>

                    <!-- 状态列：显示中文状态并支持排序 -->
                    <a-table-column title="状态" dataIndex="status" :sorter="(a, b) => a.status - b.status">
                        <template #default="{ record }">
                            <a-tag v-if="record.status === 'NORMAL'" color="green">正常</a-tag>
                            <a-tag v-else-if="record.status === 'FROZEN'" color="red">冻结</a-tag>
                            <span v-else>{{ record.status }}</span>
                        </template>
                    </a-table-column>

                    <!-- 余额列：支持排序 -->
                    <a-table-column title="余额" dataIndex="balance" :sorter="(a, b) => a.balance - b.balance" />

                    <!-- 创建时间列：支持时间排序 -->
                    <a-table-column title="创建时间" dataIndex="createTime"
                        :sorter="(a, b) => new Date(a.createTime) - new Date(b.createTime)">
                        <template #default="{ record }">
                            {{ new Date(record.createTime).toLocaleString() }}
                        </template>
                    </a-table-column>

                    <!-- 更新时间列：支持排序 -->
                    <a-table-column title="更新时间" dataIndex="updateTime"
                        :sorter="(a, b) => new Date(a.updateTime) - new Date(b.updateTime)">
                        <template #default="{ record }">
                            {{ new Date(record.updateTime).toLocaleString() }}
                        </template>
                    </a-table-column>

                    <!-- 操作列，用于编辑、冻结和恢复操作 -->
                    <a-table-column title="操作" fixed="right">
                        <template #default="{ record }">
                            <template v-if="editingKey === record.id">
                                <!-- 编辑状态，提供保存和取消按钮 -->
                                <a-button type="link" @click="save(record.id)">保存</a-button>
                                <a-divider type="vertical" />
                                <a-button danger type="link" @click="cancel">取消</a-button>
                            </template>
                            <template v-else>
                                <!-- 非编辑状态，提供编辑和冻结/恢复按钮 -->
                                <a-button type="link" @click="edit(record)">编辑</a-button>
                                <a-divider type="vertical" />
                                <template v-if="record.status === 'NORMAL'">
                                    <!-- 正常状态下显示冻结按钮 -->
                                    <a-button danger type="link" @click="handleFreeze(record)">冻结</a-button>
                                </template>
                                <template v-else-if="record.status === 'FROZEN'">
                                    <!-- 冻结状态下显示恢复按钮 -->
                                    <a-button style="color: #00b96b;" type="link"
                                        @click="handleRestore(record)">恢复</a-button>
                                </template>
                            </template>
                        </template>
                    </a-table-column>

                </a-table>
            </a-spin>
        </a-card>
    </div>
</template>

<style src="@/assets/styles/user.scss" lang="scss" scoped></style>