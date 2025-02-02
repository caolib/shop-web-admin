import request from '@/utils/request'

// 获取用户
const getUsersService = (query) => {
    return request.get('/users/manage', { params: query })
}

// 冻结用户
const freezeUserService = (id) => {
    return request.put(`/users/manage/freeze/${id}`)
}

// 恢复用户
const recoverUserService = (id) => {
    return request.put(`/users/manage/recover/${id}`)
}

export {
    getUsersService,
    freezeUserService,
    recoverUserService,
}