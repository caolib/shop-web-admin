<script setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { handleFreeze, handleRestore, initUsers, query, users } from '@/scripts/user'
import { updateUserService } from '@/api/user'
import { SearchOutlined, EditOutlined, SaveOutlined, StopOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'

// loading 标识，用于控制加载提示
const loading = ref(false)
// 当前正在编辑的数据行 ID
const editingKey = ref('')
// 编辑表单数据对象（保存用户名和手机号）
const form = reactive({})

// 搜索函数：调用初始化接口查找用户数据
const handleSearch = async () => {
  loading.value = true
  await initUsers().finally(() => {
    loading.value = false
  })
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
  const index = users.value.findIndex((item) => item.id === key)
  const data = {
    id: users.value[index].id,
    username: form.username,
    phone: form.phone,
  }
  await updateUserService(data)
    .then(() => {
      message.success('保存成功')
      handleSearch()
      editingKey.value = ''
    })
    .finally(() => {
      hide()
    })
}

// 页面加载时初始化用户数据
onMounted(async () => {
  loading.value = true
  await initUsers().finally(() => {
    loading.value = false
  })
})
</script>

<template>
  <div class="user-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <!-- 主内容区域 -->
    <div class="user-container">
      <!-- 搜索区域 -->
      <div class="search-section">
        <a-form layout="inline" class="search-form">
          <a-form-item label="用户ID">
            <a-input v-model:value="query.id" allow-clear placeholder="输入ID查询" class="search-input" />
          </a-form-item>
          <a-form-item label="用户名">
            <a-input v-model:value="query.username" allow-clear placeholder="输入用户名查询" class="search-input" />
          </a-form-item>
          <a-form-item label="手机号">
            <a-input v-model:value="query.phone" allow-clear placeholder="输入手机号查询" class="search-input" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="query.status" allow-clear placeholder="选择状态" class="search-select">
              <a-select-option :value="null">全部</a-select-option>
              <a-select-option value="1">正常</a-select-option>
              <a-select-option value="0">冻结</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" @click="handleSearch" class="search-button">
              <template #icon><search-outlined /></template>
              搜索
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 数据表格区域 -->
      <div class="table-section">
        <a-spin :spinning="loading">
          <a-table :dataSource="users" rowKey="id" bordered :scroll="{ x: 'max-content' }" :pagination="{
            showQuickJumper: true,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条记录`
          }">
            <!-- ID 列 -->
            <a-table-column title="ID" dataIndex="id" :sorter="(a, b) => a.id - b.id" width="80px" />

            <!-- 用户名列 -->
            <a-table-column title="用户名" dataIndex="username" width="100px">
              <template #default="{ record }">
                <div class="editable-cell">
                  <a-input v-if="editingKey === record.id" v-model:value="form.username" class="editable-input" />
                  <span v-else class="editable-text">{{ record.username }}</span>
                </div>
              </template>
            </a-table-column>

            <!-- 手机号列 -->
            <a-table-column title="手机号" dataIndex="phone" width="120px">
              <template #default="{ record }">
                <div class="editable-cell">
                  <a-input v-if="editingKey === record.id" v-model:value="form.phone" class="editable-input" />
                  <span v-else class="editable-text">{{ record.phone }}</span>
                </div>
              </template>
            </a-table-column>

            <!-- 状态列 -->
            <a-table-column title="状态" dataIndex="status" :sorter="(a, b) => a.status - b.status" width="100px">
              <template #default="{ record }">
                <a-tag v-if="record.status === 'NORMAL'" color="success">正常</a-tag>
                <a-tag v-else-if="record.status === 'FROZEN'" color="error">冻结</a-tag>
                <span v-else>{{ record.status }}</span>
              </template>
            </a-table-column>

            <!-- 余额列 -->
            <a-table-column title="余额" dataIndex="balance" :sorter="(a, b) => a.balance - b.balance" width="120px">
              <template #default="{ text }">
                <span class="balance-text">￥{{ text }}</span>
              </template>
            </a-table-column>

            <!-- 创建时间列 -->
            <a-table-column title="创建时间" dataIndex="createTime"
              :sorter="(a, b) => new Date(a.createTime) - new Date(b.createTime)" width="180px">
              <template #default="{ record }">
                <span class="date-text">{{ new Date(record.createTime).toLocaleString() }}</span>
              </template>
            </a-table-column>

            <!-- 更新时间列 -->
            <a-table-column title="更新时间" dataIndex="updateTime"
              :sorter="(a, b) => new Date(a.updateTime) - new Date(b.updateTime)" width="180px">
              <template #default="{ record }">
                <span class="date-text">{{ new Date(record.updateTime).toLocaleString() }}</span>
              </template>
            </a-table-column>

            <!-- 操作列 -->
            <a-table-column title="操作" fixed="right" width="200px">
              <template #default="{ record }">
                <div class="action-buttons">
                  <template v-if="editingKey === record.id">
                    <a-space>
                      <a-button type="primary" size="small" @click="save(record.id)" class="action-button save-button">
                        <template #icon><save-outlined /></template>
                        保存
                      </a-button>
                      <a-button danger size="small" @click="cancel" class="action-button cancel-button">
                        <template #icon><close-outlined /></template>
                        取消
                      </a-button>
                    </a-space>
                  </template>
                  <template v-else>
                    <a-space>
                      <a-button type="primary" size="small" @click="edit(record)" class="action-button edit-button">
                        <template #icon><edit-outlined /></template>
                        编辑
                      </a-button>
                      <template v-if="record.status === 'NORMAL'">
                        <a-button danger size="small" @click="handleFreeze(record)" class="action-button freeze-button">
                          <template #icon><stop-outlined /></template>
                          冻结
                        </a-button>
                      </template>
                      <template v-else-if="record.status === 'FROZEN'">
                        <a-button type="primary" size="small" @click="handleRestore(record)"
                          class="action-button restore-button" style="background-color: #00b96b; border-color: #00b96b">
                          <template #icon><check-outlined /></template>
                          恢复
                        </a-button>
                      </template>
                    </a-space>
                  </template>
                </div>
              </template>
            </a-table-column>
          </a-table>
        </a-spin>
      </div>
    </div>
  </div>
</template>

<style src="@/assets/styles/user.scss" lang="scss" scoped></style>
