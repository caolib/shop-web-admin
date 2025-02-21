import ARIMA from 'arima'

// 封装 ARIMA 算法训练和预测逻辑
function trainAndPredict(trainingData, predictSteps = 1, params = { p: 3, d: 1, q: 1 }) {
    // 输入验证：确保所有训练数据都是有效的数字
    if (!trainingData.every(val => typeof val === 'number' && !isNaN(val))) {
        throw new Error("trainingData 包含非法数字")
    }
    // 数据标准化处理，避免溢出
    const maxVal = Math.max(...trainingData)
    const scale = maxVal > 1e6 ? maxVal : 1  // 若最大值过大则缩放，否则不缩放
    const normalizedData = scale !== 1 ? trainingData.map(x => x / scale) : trainingData

    let flatPrediction
    try {
        const model = new ARIMA({ ...params, verbose: false })
        const prediction = model.train(normalizedData).predict(predictSteps)
        flatPrediction = prediction.flat(Infinity)
    } catch (e) {
        console.error("ARIMA 模型训练或预测出错:", e)
        throw e
    }
    return scale !== 1 ? flatPrediction.map(x => x * scale) : flatPrediction
}

// 使用传入的训练数据和参数预测一天的值
export function predictOne(trainingData, params = { p: 3, d: 1, q: 1 }) {
    let predictedValue = trainAndPredict(trainingData, 1, params)[0]
    // 截断负数值，确保预测金额不为负
    if (predictedValue < 0) {
        predictedValue = 0
    }
    return predictedValue
}
