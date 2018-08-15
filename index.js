let Cache = {
    originIndex: -1,//记录每次移动的其实位置
    lastTargetIndex: -1,//记录移动的上一次位置
    showTips: true,
}

/**
 * 移动数组元素
 * @param {Array} arr 
 * @param {int} old_index 
 * @param {int} new_index 
 */

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (--k) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

Component({
    properties: {
        value: {
            type: Array,
            value: [],
            public: true,
            desc: "用户选择的照片列表"
        },
        width: {
            type: Number,
            value: wx.getSystemInfoSync().windowWidth,
            public: true,
            desc: "整个组件宽度，默认屏幕宽度"
        },
        column: {
            type: Number,
            value: 3,
            public: true,
            desc: "列数，默认3"
        },
        max: {
            type: Number,
            value: 9,
            public: true,
            desc: "最大图片数量，默认9"
        },
        type: {
            type: Array,
            value: ['compressed', 'original'],
            public: true,
            desc: "选图类型, 默认 ['compressed', 'original']"
        },
        source: {
            type: Array,
            value: ["album", "camera"],
            public: true,
            desc: "选图来源, 默认 ['album', 'camera']"
        }
    },

    data: {
        length: 0,
        row: 1,
        imgList: [],
        chooseImgX: 0,
        chooseImgY: 0,
        // tempImgList: [],
    },

    behaviors: ['wx://form-field'], //表单特性，可作为表单一部分，提交时直接获取列表

    attached() {
        // 计算每张图的边长
        this.setData({ length: this.properties.width / this.properties.column });
    },

    methods: {
        /**
         * 选图事件
         */
        onChooseImage() {
            let count = this.data.max - this.data.imgList.length;
            wx.chooseImage({
                count: count,
                sizeType: this.data.type,
                sourceType: this.data.source,
                success: (res) => {
                    console.debug('choose', res.tempFiles);
                    this._addPhotos(res.tempFiles);
                    if (Cache.showTips) {
                        wx.showToast({
                            title: '拖动图片调顺，长按删除',
                            icon: 'none',
                            // duration: 1200,
                        })
                        Cache.showTips = false;
                    }
                },
                fail: (err) => {
                    console.error(err);
                }
            });
        },

        /**
         * 发生触摸事件清空状态标识
         * @param {*} e 
         */
        onTouchStart(e) {
            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
        },


        /**
        * 出发移动事件
        * @param {*} e 
        */
        onChange(e) {
            if (e.detail.source === "") {
                return;
            }

            const id = e.currentTarget.dataset.id;
            const imgList = this.data.imgList;

            console.debug('change:', id, Cache.originIndex, 'last target index', Cache.lastTargetIndex);
            if (Cache.originIndex < 0) {
                imgList[id].zIndex = 100;
                this.setData({ imgList });
                Cache.lastTargetIndex = Cache.originIndex = this._findValueIndexByImgListId(id);
                return;
            }
            const viewId = this._getTargetIndex(e.detail.x, e.detail.y);
            if (viewId == -1) {
                return;
            }
            const newTargetIndex = this._findValueIndexByImgListId(viewId);
            if (Cache.lastTargetIndex !== newTargetIndex) {
                this._move(Cache.lastTargetIndex, newTargetIndex, e.detail);
                imgList[id].x = e.detail.x;
                imgList[id].y = e.detail.y;
                this.setData({ imgList });
                Cache.lastTargetIndex = newTargetIndex;
            }
        },

        /**
         * 触摸操作结束
         * @param {Event} e 
         */
        onTouchEnd(e) {
            const lastindex = Cache.lastTargetIndex;
            if (lastindex < 0) {
                return
            }

            const id = e.currentTarget.dataset.id;
            const valueIndex = this._findValueIndexByImgListId(id);
            const imgList = this.data.imgList;
            imgList[id].x = valueIndex % this.properties.column * this.data.length;
            imgList[id].y = Math.floor(valueIndex / this.properties.column) * this.data.length;
            this.setData({ imgList });

            if (lastindex != Cache.originIndex) {
                this._triggerInput(this.properties.value, 'move');
            }
            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
        },

        /**
         * 删除
         * @param {Event} e 
         */
        onDel(e) {
            wx.showModal({
                title: '提示',
                content: '确认删除这张图片',
                success: res => res.confirm && this._delete(e.currentTarget.dataset.id)
            })
        },

        /**
         * 请点预览
         * @param {Event} e 
         */
        onTap(e) {
            let index = e.currentTarget.dataset.id;
            let urls = this.properties.value.map(f => f.path);
            wx.previewImage({
                current: urls[index],
                urls: urls,
            });
        },

        /**
         * 触发input事件
         * @param {int} value 
         */
        _triggerInput(value, source) {
            console.info('new value', value);
            this.triggerEvent("input", value);
        },

        /**
         * 删除索引
         * @param {int}} index 
         */
        _delete(id) {
            console.log('del', id);
            let imgList = this.data.imgList;
            let value = this.properties.value;
            value.splice(value.indexOf(imgList[id].img), 1);
            this._triggerInput(value, 'delete');
            imgList.splice(id, 1);
            this._updateList(imgList, id);
        },

        /**
         * @todo 边界
         * @param {number} x 
         * @param {number} y 
         */
        _getTargetIndex(x, y) {
            let length = this.data.length;
            let pointX = x + length / 2;
            let pointY = y + length / 2;
            let imgList = this.data.imgList;
            for (let i = 0; i < imgList.length; i++) {
                if (imgList[i].x <= pointX && pointX <= imgList[i].x + length && imgList[i].y <= pointY && pointY <= imgList[i].y + length) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * 移动交换
         * @param {int} start 
         * @param {int} end 
         */
        _move(start, end) {
            let step = start < end ? 1 : -1;
            console.info(`move[${Cache.originIndex}]:`, 'from', start, 'to', end, 'step', step);

            const imgList = this.data.imgList;
            const value = this.properties.value;
            const col = this.properties.column;
            const length = this.data.length;

            array_move(value, start, end);
            for (let i = start; i != end; i += step) {
                let item = imgList.find(e => e.img == value[i]);
                item.x = (i % col) * length;
                item.y = Math.floor(i / col) * length;
            }
        },

        /**
         * 渲染图片列表
         * 
         * @param {array} fileList 
         */
        _addPhotos(fileList) {
            //merge
            const value = this.properties.value;
            Array.prototype.push.apply(value, fileList);
            this._triggerInput(value, 'add');
            const imgList = this.data.imgList;
            const len = imgList.len;
            fileList.forEach(e => imgList.push({ img: e }));
            this._updateList(imgList, len);
        },

        /**
         * 数量发生变化后更新整个列表
         * @param {array} imgList 
         * @param {int} from 
         * @param {int} to 
         */
        _updateList(imgList, from, to) {
            console.debug('update', imgList);
            from = from || 0;
            to = to || imgList.length;
            const col = this.properties.column;
            const length = this.data.length;

            for (let k = from; k < to; ++k) {
                imgList[k].x = (k % col) * length;
                imgList[k].y = Math.floor(k / col) * length;
            }
            this.setData({
                row: Math.ceil((imgList.length + 1) / col) * length,
                chooseImgY: Math.floor(imgList.length / col) * length,
                chooseImgX: Math.floor(imgList.length % col) * length,
                value: this.properties.value,
                imgList: imgList,
            });
        },

        /**
         * 根据imglist ID反查显示图像中的索引顺序
         * @param {number} id 
         */
        _findValueIndexByImgListId(id) {
            return this.properties.value.indexOf(this.data.imgList[id].img);
        }
    }
});
