import { ref } from 'vue'
import { freezeUserService, getUsersService, recoverUserService } from '@/api/user'
import { message, Modal } from 'ant-design-vue'

// 用户数据
const users = ref([])

// 默认查询参数
const query = {
    pageNo: 1,
    pageSize: 10,
    id: null,
    username: null,
    phone: null,
    status: null,
}

// 初始化用户数据
const initUsers = async () => {
    await getUsersService(query).then(res => {
        // console.log(res.data.records)
        users.value = res.data.records
    })
}

// 冻结用户
const freezeUser = async (id) => {
    return await freezeUserService(id)
}

// 恢复用户
const recoverUser = async (id) => {
    return await recoverUserService(id)
}

// 显示冻结确认对话框
const handleFreeze = (record) => {
    Modal.confirm({
        centered: true,
        title: '确定冻结用户？',
        content: `ID：${record.id}，用户名：${record.username}`,
        onOk() {
            const hide = message.loading('冻结中...', 0)
            freezeUser(record.id).then(() => {
                initUsers()
                message.success('冻结成功')
            }).finally(() => {
                hide()
            })
        }
    })
}

// 显示恢复确认对话框
const handleRestore = (record) => {
    Modal.confirm({
        centered: true,
        title: '确定恢复用户？',
        content: `ID：${record.id}，用户名：${record.username}`,
        onOk() {
            const hide = message.loading('恢复中...', 0)
            recoverUser(record.id).then(() => {
                initUsers()
                message.success('恢复成功')
            }).finally(() => {
                hide()
            })
        }
    })
}

export {
    freezeUser,
    initUsers,
    recoverUser,
    handleFreeze,
    handleRestore,
    users,
    query,
}