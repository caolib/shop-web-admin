import request from '@/utils/request'
import { message } from 'ant-design-vue'

// 定义服务的健康检查端点
const services = ['orders', 'users', 'commodity', 'pays']

/**
 * 检查后端服务的健康状态
 */
const checkServicesHealth = async () => {
  const status = new Map()

  for (const service of services)
    status.set(service, await checkService(service))

  return status
}


/**
 * 检查服务是否健康
 * @param service 服务名称
 */
const checkService = (service) => {
  return request.get(`/${service}/health`).then(() => {
    return true;
  }).catch(() => {
    return false;
  });
}


// 检查单个服务状态
const checkSrv = async (service) => {
  const response = await checkService(service);
  const isOk = response?.code === 200;
  message[isOk ? 'success' : 'error'](`${service} 服务${isOk ? '正常' : '异常'}`);
  return isOk;
}

// 获取所有服务状态
const getServiceStatus = async (serviceStatus) => {
  serviceStatus.value = await checkServicesHealth()
}


export { checkServicesHealth, checkService, checkSrv, getServiceStatus }
