let Cache = {
    originIndex: -1,//缓存的是viewToDataIndexMap当中的下标值，用户在view上点击并移动的图片的下标，主要原因是每次点击moveableview只能得到该moveableview在moveableViewList的下标，由该下标可以找到处于moveablearea的下标
    lastTargetIndex: -1,//记录当前点击的view移动到了哪个view上，如果当前移动到的view和上次检查过移动到的view一样的话，那么这次就不需要做动画
    viewToDataIndexMap: [],//important!!!主要是用来缓存当前界面view和moveableViewList的下标值的对应
    showTips: true,
}

/**
 * 移动数组元素
 * @param {Array} arr 
 * @param {*} old_index 
 * @param {*} new_index 
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
        row: {
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
        length: 300,
        col: 1,
        movingIndex: -1,
        imgList: [],
        tempImgList: [],
        chooseImgX: 0,
        chooseImgY: 0,
    },

    behaviors: ['wx://form-field'], //表单特性，可作为表单一部分，提交时直接获取列表

    attached() {
        // 计算每张图的边长
        this.setData({ length: this.data.width / this.data.row });
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

        onTouchStart(e) {
            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
            Cache.movingIndex = -1;
            // this.setData({
            //     movingIndex: -1,
            // })
            // console.log(e.currentTarget)
        },

        onTouchEnd(e) {
            console.debug('end', Cache.viewToDataIndexMap.join(" "));
            const index = e.currentTarget.dataset.id;
            if (index >= 0 && index !== Cache.lastTargetIndex && Cache.lastTargetIndex >= 0) {
                let value = this.properties.value;
                array_move(value, index, Cache.lastTargetIndex);
                this._triggerInput(value, 'move');

                let imgList = this.data.imgList;
                imgList[index].zIndex = 0;
                this._updateList(imgList);
            }

            // let imgList = this.data.imgList;
            // let updateData = {
            //     movingIndex: -1,
            //     imgList: this.data.imgList,
            //     tempImgList: this.data.imgList.map(x => Object.assign({}, x)),
            // };
            // console.debug('move end', index, Cache.lastTargetIndex);

            // if (index >= 0 && index !== Cache.lastTargetIndex && Cache.lastTargetIndex >= 0) {
            //     let value = this.properties.value;
            //     array_move(value, index, Cache.lastTargetIndex);
            //     this._triggerInput(value, 'move');
            //     updateData.value = value;
            // }
            // this.setData(updateData);
            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
            Cache.movingIndex = -1;
        },

        /**
        * 移动
        * @param {*} e 
        */
        onChange_old(e) {
            if (e.detail.source === "") {
                return;
            }
            const index = e.currentTarget.dataset.id;
            let imgList = this.data.imgList;

            console.debug('change:', index, Cache.lastTargetIndex);
            if (Cache.originIndex < 0) {
                imgList[index].zIndex = 100;
                this.setData({ imgList });
                Cache.movingIndex = index;
                Cache.originIndex = Cache.viewToDataIndexMap.indexOf(index);
                Cache.lastTargetIndex = Cache.viewToDataIndexMap.indexOf(index);
            }
            let movingToIndex = this._getTargetIndex(e.detail.x, e.detail.y);
            if (movingToIndex === -1) {
                return;
            }
            let newTargetIndex = Cache.viewToDataIndexMap.indexOf(movingToIndex);
            if (newTargetIndex !== Cache.originIndex && Cache.lastTargetIndex !== newTargetIndex) {
                Cache.lastTargetIndex = newTargetIndex;
                this._move(Cache.originIndex, newTargetIndex, e);
            }
            // imgList[index].x = e.detail.x;
            // imgList[index].y = e.detail.y;
        },

        /**
        * 移动
        * @param {*} e 
        */
        onChange(e) {
            if (e.detail.source === "") {
                return;
            }
            // console.log(e);
            const id = e.currentTarget.dataset.id;
            let imgList = this.data.imgList;

            console.debug('change:', id, 'last target index', Cache.lastTargetIndex);
            if (Cache.originIndex < 0) {
                imgList[id].zIndex = 100;
                this.setData({ imgList });
                Cache.movingIndex = id;
                Cache.originIndex = id;
                Cache.lastTargetIndex = id;
            }
            let viewIndex = this._getTargetIndex(e.detail.x, e.detail.y);
            if (viewIndex === -1) {
                return;
            }
            let newTargetIndex = Cache.viewToDataIndexMap.indexOf(viewIndex);
            if (Cache.lastTargetIndex !== newTargetIndex) {
                Cache.lastTargetIndex = newTargetIndex;
                this._move(Cache.originIndex, newTargetIndex, e);
            }
        },

        /**
         * 删除
         * @param {*} e 
         */
        onDel(e) {
            wx.showModal({
                title: '提示',
                content: '确认删除这张图片',
                success: (res) => {
                    if (res.confirm) {
                        this._delete(e.currentTarget.dataset.id);
                    }
                }
            })
        },

        /**
         * 按下预览
         * @param {*} e 
         */
        onTap(e) {
            let index = e.currentTarget.dataset.id;
            let urls = this.properties.value.map(f => f.path);
            wx.previewImage({
                current: urls[index],
                urls: urls,
            });
        },

        onLog(e) {
            console.log(this.properties.value);
        },

        /**
         * 触发input事件
         * @param {*} value 
         */
        _triggerInput(value, source) {
            console.info('new value', value, source);
            this.triggerEvent("input", value, source);
        },

        /**
         * 删除索引
         * @param {number} index 
         */
        _delete(index) {
            console.log('del', index);

            let value = this.properties.value;
            value.splice(index, 1);
            this._triggerInput(value, 'delete');

            let imgList = this.data.imgList;
            imgList.splice(index, 1);
            this._updateList(imgList, index);
        },

        /**
         * @todo 边界
         * @param {number} x 
         * @param {*} y 
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

        _move(start, end) {
            let step = start < end ? -1 : 1;
            console.info(`move[${Cache.movingIndex}]:`, 'from', start, 'to', end, 'step', step);

            let curImageList = this.data.imgList;
            let curSlotImageMapping = Cache.viewToDataIndexMap;
            let endX = curImageList[curSlotImageMapping[end]].x;
            let endY = curImageList[curSlotImageMapping[end]].y;
            let i = end;
            while (i !== start) {
                let j = i + step;
                curImageList[curSlotImageMapping[i]].x = curImageList[curSlotImageMapping[i + step]].x;
                curImageList[curSlotImageMapping[i]].y = curImageList[curSlotImageMapping[i + step]].y;
                i = j;
            }
            curImageList[curSlotImageMapping[start]].x = endX;
            curImageList[curSlotImageMapping[start]].y = endY;
            let j = start;
            while (j !== end) {
                let temp = curSlotImageMapping[j];
                curSlotImageMapping[j] = curSlotImageMapping[j - step];
                curSlotImageMapping[j - step] = temp;
                j = j - step;
            }
            this.setData({
                imgList: curImageList,
            });
            Cache.viewToDataIndexMap = curSlotImageMapping;
            Cache.lastTargetIndex = end;
        },
        _move2(start, end, e) {
            let step = start > end ? -1 : 1;
            console.info(`move[${Cache.movingIndex}]:`, 'from', start, 'to', end, 'step', step);

            let imgList = this.data.imgList;
            array_move(imgList, start, end);

            const row = this.data.row;
            const length = this.data.length;
            let viewToDataIndexMap = Cache.viewToDataIndexMap;

            for (let i = start; i != end; i += step) {
                // if (i + step == Cache.movingIndex) {
                //     continue;
                // }
                // imgList[i].index = (i + step) ;
                imgList[i + step].x = (i % row) * length;
                imgList[i + step].y = Math.floor(i / row) * length;
                let temp = viewToDataIndexMap[i];
                viewToDataIndexMap[i] = viewToDataIndexMap[i + step];
                viewToDataIndexMap[i + step] = temp;
            }
            imgList[start].x = ((end) % row) * length;
            imgList[start].y = Math.floor(end / row) * length;
            viewToDataIndexMap[end] = start;


            // imgList[Cache.movingIndex].x = e.x;
            // imgList[Cache.movingIndex].y = e.y;
            this.setData({ imgList: imgList });
            Cache.lastTargetIndex = end;
        },

        _move_old(start, end) {
            console.log('moving', Cache.movingIndex);
            let step = start < end ? -1 : 1;
            console.debug('move', start, end, step);

            let curImageList = this.data.imgList;
            let curSlotImageMapping = Cache.viewToDataIndexMap;
            let endX = curImageList[curSlotImageMapping[end]].x;
            let endY = curImageList[curSlotImageMapping[end]].y;
            let i = end;
            while (i !== start) {
                let j = i + step;
                curImageList[curSlotImageMapping[i]].x = curImageList[curSlotImageMapping[i + step]].x;
                curImageList[curSlotImageMapping[i]].y = curImageList[curSlotImageMapping[i + step]].y;
                i = j;
            }
            curImageList[curSlotImageMapping[start]].x = endX;
            curImageList[curSlotImageMapping[start]].y = endY;
            let j = start;
            while (j !== end) {
                let temp = curSlotImageMapping[j];
                curSlotImageMapping[j] = curSlotImageMapping[j - step];
                curSlotImageMapping[j - step] = temp;
                j = j - step;
            }
            this.setData({
                imgList: curImageList,
            });
            Cache.viewToDataIndexMap = curSlotImageMapping;
            Cache.lastTargetIndex = end;
        },

        /**
         * 
         * @param {array} list 
         * 渲染图片列表
         */
        _addPhotos(list) {
            //merge
            let value = this.properties.value;
            Array.prototype.push.apply(value, list);
            this._triggerInput(value, 'add');
            let curImageList = this.data.imgList;
            list.forEach(() => curImageList.push({}));
            this._updateList(curImageList, this.data.tempImgList.length);
        },

        _updateList(imgList, from, to) {
            console.debug('update', imgList);
            from = from || 0;
            to = to || imgList.length;
            const row = this.data.row;
            const length = this.data.length;
            const curSlotImageMapping = Cache.viewToDataIndexMap;
            for (let k = from; k < to; ++k) {
                imgList[k].x = (k % row) * length;
                imgList[k].y = Math.floor(k / row) * length;
                imgList[k].index = k;
                curSlotImageMapping[k] = k;
            }
            this.setData({
                col: Math.ceil((imgList.length + 1) / row) * length,
                chooseImgY: Math.floor(imgList.length / row) * length,
                chooseImgX: Math.floor(imgList.length % row) * length,
                value: this.properties.value,
                imgList: imgList,
                tempImgList: imgList.map(x => Object.assign({}, x)),
            });
        }
    }
});
