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
