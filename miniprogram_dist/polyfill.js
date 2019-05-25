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
