// wx.nextTick 兼容支持
// 2.2.3
// https://developers.weixin.qq.com/miniprogram/dev/api/custom-component.html
if (!wx.nextTick) {
    wx.nextTick = setTimeout;
}

/**
 * 移动数组元素
 * @param {Array} arr
 * @param {int} oldIndex
 * @param {int} newIndex
 */
export function array_move(arr, oldIndex, newIndex) {
    if (newIndex >= arr.length) {
        var k = newIndex - arr.length + 1;
        while (--k) {
            arr.push(undefined);
        }
    }
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr;
};

/**
 * 事件节流(防抖)
 * @param {Function} func 事件 
 * @param {number} wait 等待时间ms 
 */
export function throttle(func, wait) {
    if (!wait) { wait = 300; }
    var last = -wait;
    return function (event) {
        if (event.timeStamp - last > wait) {
            func.apply(this, arguments);
            last = event.timeStamp;
        }
    };
}