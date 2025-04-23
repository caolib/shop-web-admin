import request from '@/utils/request'

// 定义服务的健康检查端点
const services = ['orders', 'users', 'commodity', 'pays']

/**
 * 检查后端服务的健康状态
 */
const checkServicesHealth = async () => {
  const status = new Map()

  for (const service of services)
    status.set(service, await checkSrv(service))

  return status
}


// 检查单个服务状态
const checkSrv = async (service) => {
  const response = await request.get(`/${service}/health`);
  return response.code === 200;
}

// 获取所有服务状态
const getServiceStatus = async (serviceStatus) => {
  serviceStatus.value = await checkServicesHealth()
}


export { checkServicesHealth, checkSrv, getServiceStatus }
