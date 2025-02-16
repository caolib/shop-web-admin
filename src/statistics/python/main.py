import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# 示例历史订单数据：请替换为实际数据
data = [10, 12, 11, 15, 13, 14, 16]  # 每天的订单数

# 数据预处理：使用滑动窗口，每3天预测1天（实际可以根据数据量和需求调整窗口大小）
window_size = 3
def create_dataset(data, window_size):
    x, y = [], []
    for i in range(len(data) - window_size):
        x.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(x), np.array(y)

x, y = create_dataset(data, window_size)
# LSTM 要求输入数据形状为 [样本数, 时间步数, 特征数]
x = x.reshape((x.shape[0], x.shape[1], 1))

# 构建 LSTM 模型
model = Sequential([
    LSTM(50, activation='relu', input_shape=(window_size, 1)),
    Dense(1)
])
model.compile(optimizer='adam', loss='mse')

# 训练模型
model.fit(x, y, epochs=200, verbose=0)

# 使用最后 window_size 天的数据进行预测
last_sequence = np.array(data[-window_size:]).reshape((1, window_size, 1))
predicted = model.predict(last_sequence)
print("预测明天订单数:", predicted[0][0])