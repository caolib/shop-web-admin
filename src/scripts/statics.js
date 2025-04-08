import { arima } from 'arima';

/**
 * 计算指定日期之后若干天的日期字符串。
 * @param {string} dateString - 起始日期 (YYYY-MM-DD)
 * @param {number} days - 向后推移的天数
 * @returns {string} 计算后的日期 (YYYY-MM-DD)
 */
export function getDateAfter(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 使用 ARIMA 模型预测未来销量
 * @param {Array<number>} historicalData - 历史销量数据数组
 * @param {number} daysToPredict - 要预测的天数
 * @returns {Array<number>} 预测的销量数组
 */
export function predictSalesWithARIMA(historicalData, daysToPredict = 7) {
    if (historicalData.length < 14) {
        console.warn('历史数据不足14天，无法进行预测');
        return Array(daysToPredict).fill(null);
    }

    try {
        // 配置 ARIMA 模型参数
        const config = {
            p: 1, // AR 阶数
            d: 1, // 差分阶数
            q: 1, // MA 阶数
            verbose: false
        };

        // 创建并训练 ARIMA 模型
        const model = new arima(config);
        model.train(historicalData);

        // 预测未来销量
        const predictions = model.predict(daysToPredict);
        return predictions;
    } catch (error) {
        console.error('ARIMA 预测失败:', error);
        return Array(daysToPredict).fill(null);
    }
}

/**
 * 计算预测准确率
 * @param {Array<number>} actual - 实际销量数组
 * @param {Array<number>} predicted - 预测销量数组
 * @returns {number} 准确率 (0-1)
 */
export function calculatePredictionAccuracy(actual, predicted) {
    if (actual.length !== predicted.length) {
        return 0;
    }

    let totalError = 0;
    let totalActual = 0;

    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== null && predicted[i] !== null) {
            totalError += Math.abs(actual[i] - predicted[i]);
            totalActual += actual[i];
        }
    }

    if (totalActual === 0) {
        return 0;
    }

    return 1 - (totalError / totalActual);
}
