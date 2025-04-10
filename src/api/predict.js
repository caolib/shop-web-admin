import axios from 'axios'; // 直接导入 axios

// 预测服务的 API 完整地址
const PREDICT_API_FULL_URL = 'http://localhost:8000/predict';

/**
 * 调用销售预测 API (使用原始 axios)。
 * @param {Array<number>} historicalData - 用于生成预测的历史销量数组。
 * @param {number} daysToPredict - 需要预测的未来天数。
 * @returns {Promise<Array<number>|null>} 包含预测销量数字的数组；如果 API 调用失败或返回无效数据，则返回 `null`。
 */
export const predictSalesService = async (historicalData, daysToPredict) => {
    try {
        const response = await axios.post(PREDICT_API_FULL_URL, {
            historical_data: historicalData,
            days_to_predict: daysToPredict
        });

        if (response && response.data && Array.isArray(response.data.predictions)) {
            if (response.data.predictions.every(p => typeof p === 'number')) {
                return response.data.predictions;
            } else {
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                '(api/predict.js) 调用预测 API 时出错 (axios):',
                error.response?.status,
                error.response?.data,
                error.message
            );
        } else {
            console.error('(api/predict.js) 调用预测 API 时发生非 Axios 错误:', error);
        }
        return null;
    }
};
