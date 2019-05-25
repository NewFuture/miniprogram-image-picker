import { array_move } from 'polyfill.js';
/**
 * 临时数据缓存
 */
let Cache = {
    imgs: [],// 当前的图片列表[{path,size}]
    originIndex: -1,//记录每次移动的其实位置
    lastTargetIndex: -1,//记录移动的上一次位置
    lastPostion: {},//记录上次位置
    showTips: true, //是否显示提示通知，首次添加图片时显示通知
}

/**
 * 方格图片状态 
 */
const STATUS = {
    ACTIVE: "is-active",
    MOVE: "is-moving",
    DELETE: "is-deleting"
}


Component({
    properties: {
        value: {
            type: Array,
            value: [],
            desc: "用户选择的照片列表",
            observer: function (newVal, oldVal) {
                //不能直接判断是否相等
                if (JSON.stringify(oldVal) == JSON.stringify(newVal)) {
                    return;//the same
                }
                Cache.imgs = [];
                this.data.imgList = [];
                this._add(newVal);
            }
        },
        column: {
            type: Number,
            value: 3,
            desc: "列数2~5，默认3",
            observer: function (newVal, oldVal) {
                //column 重新渲染大小和位置
                if (newVal != oldVal) {
                    this.properties.column = newVal;
                    // const updateData = this._calcPostion(0, Cache.imgs.length);
                    // this._updateAsync(updateData);
                    this._updateImageWidth();
                }
            }
        },
        max: {
            type: Number,
            value: 9,
            desc: "最多图片数量，默认9",
            observer: function (newVal, oldVal) {
                //重新渲染Icon
                if (newVal != oldVal) {
                    this.properties.max = newVal;
                    this._renderIcon({}, Cache.imgs.length);
                }
            }
        },
        //点击预览
        tapPreview: {
            type: Boolean,
            value: true,
        }
    },

    data: {
        imgList: [],//显示的图像列表
        length: 0,//每张图片的边长
        iconX: 0, //选择图像按钮横坐标
        iconY: 0, //选择图像按钮纵坐标
        animation: false, //是否启用动画
    },

    options: {
        addGlobalClass: true, // 允许全局样式覆盖
    },
    behaviors: [
        'wx://form-field', //表单特性，可作为表单一部分，提交时直接获取列表
        // 'wx://component-export' //select 返回值 2.2.3开始支持
    ],

    export() {
        // 'wx://component-export' //select 返回值 2.2.3开始支持
        return { value: Cache.imgs }
    },

    attached() {
        if (this.dataset.open) {
            this.onChooseImage();
        }
    },

    ready() {
        this._updateImageWidth();
    },

    methods: {
        /**
         * 设置图像宽度
         */
        _updateImageWidth() {
            wx.createSelectorQuery()
                .in(this)
                .select('.ImagePicker')
                .boundingClientRect(res => {
                    const length = ((res.width > 15) ? res.width : wx.getSystemInfoSync().windowWidth) / this.properties.column;
                    // 计算每张图的边长
                    if (this.properties.value) {
                        this.data.length = length;
                        setTimeout(() => this.resize({ length }), 150);//defer 防止首次加载长度为0
                    } else {
                        this.setData({ length });
                    }
                }).exec();
        },
        /**
         * 选图事件
         */
        onChooseImage() {
            wx.chooseImage({
                count: this.properties.max - Cache.imgs.length,
                sizeType: this.dataset.type || ['compressed', 'original'],
                sourceType: this.dataset.source || ['album', 'camera'],
                success: (res) => {
                    console.debug('choose', res.tempFiles);
                    this._add(res.tempFiles);
                },
                fail: (err) => {
                    console.error(err);
                }
            });
        },

        /**
         * 发生触摸事件
         * @param {*} e
         */
        onTouchStart(e) {
            const id = e.currentTarget.dataset.id;
            Cache.originIndex = Cache.lastTargetIndex = this._findValueIndexByImgListId(id);
            this.setData({
                [`imgList[${id}].status`]: STATUS.ACTIVE,
                moving: true,
                animation: true,
            })
        },

        /**
        * 出发移动事件
        * Touchend 事件触发后还会触发数次change事件
        * 此次通过检查状态判断是否处理
        * @param {*} e
        */
        onChange(e) {
            const detail = e.detail;
            if (!detail.source) {
                return;
            }
            // console.log(e)

            const id = e.currentTarget.dataset.id;
            const status = this.data.imgList[id].status;

            if (status == STATUS.ACTIVE) {
                Cache.lastTargetIndex = this._findValueIndexByImgListId(id);
                this._updateAsync(`imgList[${id}].status`, STATUS.MOVE);
                return;
            } else if (status != STATUS.MOVE) {
                // not movable
                return;
            }

            const x = detail.x;
            const y = detail.y;
            const delta = this.data.length / 6;

            if (Math.abs(Cache.lastPostion.x - x) < delta && Math.abs(Cache.lastPostion.y - y) < delta) {
                //计算移动距离小于 delta 时不处理
                return
            }

            Cache.lastPostion = { x, y }

            const newTargetIndex = this._getTargetIndex(x, y);
            if (newTargetIndex >= 0 && newTargetIndex !== Cache.lastTargetIndex) {
                // 计算新坐标，异步刷新
                const data = this._move(Cache.lastTargetIndex, newTargetIndex);
                data[`imgList[${id}].x`] = x;
                data[`imgList[${id}].y`] = y;
                this._updateAsync(data);
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
            const status = this.data.imgList[id].status;
            if (status != STATUS.ACTIVE && status != STATUS.MOVE) {
                return
            }

            console.info('move end to', lastindex);
            // const valueIndex = this._findValueIndexByImgListId(id);

            const x = lastindex % this.properties.column * this.data.length;
            const y = Math.floor(lastindex / this.properties.column) * this.data.length;


            if (lastindex != Cache.originIndex) {
                this._triggerInput(Cache.imgs, 'move', { form: originIndex, to: lastindex });
            }

            this.setData(
                {
                    [`imgList[${id}].status`]: '',
                    [`imgList[${id}].x`]: x,
                    [`imgList[${id}].y`]: y,
                });
            const updateData = this._calcPostion(0, Cache.imgs.length);
            updateData['moving'] = false;
            // setData 两次
            setTimeout(() => this.setData(updateData), 250);

            Cache.originIndex = -1;
            Cache.lastTargetIndex = -1;
        },

        /**
         * 删除
         * @param {Event} e
         */
        onDel(e) {
            let id = e.currentTarget.dataset.id;
            this._updateAsync({
                [`imgList[${id}].status`]: STATUS.DELETE,
                animation: false,
            });
            wx.showModal({
                title: '提示',
                content: '确认删除这张图片吗',
                success: res => {
                    if (res.confirm) {
                        this._delete(id);
                        id = -1;
                    }
                },
                complete: () => this._clearStatus(id),
            })
        },

        /**
         * 轻点预览
         * @param {Event} e
         */
        onTap(e) {
            const id = e.currentTarget.dataset.id;
            const index = this._findValueIndexByImgListId(id);
            const status = this.data.imgList[id].status;
            if (status && status !== STATUS.ACTIVE) { //防误触事件叠加
                return;
            }
            if (this.properties.tapPreview) {
                const urls = Cache.imgs.map(f => f.path);
                wx.previewImage({
                    current: urls[index],
                    urls: urls,
                    complete: () => this._clearStatus(id)
                });
            } else {
                // 点击事件
                this.triggerEvent("tapItem", Object.assign({}, Cache.imgs[index], { index }));
            }
        },

        /**
         * 重新渲染图片和图标
         */
        resize(data) {
            const size = this.data.imgList.length;
            const updateData = this._calcPostion(0, size);
            if (data) {
                for (let key in data) {
                    updateData[key] = data[key];
                }
            }
            this._renderIcon(updateData, size);
        },

        /**
         * 移动交换
         * @param {int} start
         * @param {int} end
         * @returns {object}
         */
        _move(start, end) {
            console.info(`move[${Cache.originIndex}]:`, 'from:', start, 'to:', end);
            array_move(Cache.imgs, start, end);
            return this._calcPostion(start, end);
        },

        /**
         * 添加图片
         *
         * @param {array} fileList
         */
        _add(fileList) {
            if (Cache.showTips) {
                wx.showToast({
                    title: '拖动图片可调整顺序',
                    icon: 'none',
                    // duration: 1200,
                })
                Cache.showTips = false;
            }
            const value = Cache.imgs;
            let len = value.length;
            Array.prototype.push.apply(value, fileList);//merge
            this._triggerInput(value, 'add', fileList);
            const length = this.data.length;
            const col = this.properties.column;

            const updateData = {};
            fileList.forEach(img => {
                updateData[`imgList[${len}]`] = {
                    img,
                    x: (len % col) * length,
                    y: Math.floor(len / col) * length,
                }
                ++len;
            });

            this._renderIcon(updateData, len);
        },


        /**
         * 同步删除索引
         * @param {int} index
         */
        _delete(id) {
            console.log('del', id);

            const imgList = this.data.imgList;
            const value = Cache.imgs;
            let value_index = this._findValueIndexByImgListId(id);
            value.splice(value_index, 1);
            this._triggerInput(value, 'delete', { index: id });
            imgList.splice(id, 1);

            const col = this.properties.column;
            const length = this.data.length;
            const to = value.length;

            while (value_index < to) {
                const item = imgList.find(e => e.img == value[value_index]);
                item.x = (value_index % col) * length;
                item.y = Math.floor(value_index / col) * length;
                ++value_index;
            }

            this.setData({
                imgList,
                iconX: Math.floor(to % col) * length,
                iconY: Math.floor(to / col) * length
            });
        },

        /**
         * 触发input事件
         * @param {Array} value
         * @param {String} type 
         * @param {Object} detail
         */
        _triggerInput(value, type, detail) {
            console.info('new value', value);
            this.properties.value = value;
            this.triggerEvent("input", { value, type });
            this.triggerEvent(type, detail);
        },

        /**
         * 
         * @param {number} x
         * @param {number} y
         */
        _getTargetIndex(x, y) {

            const length = this.data.length;
            if (x < 0) { x = 1 };
            if (y < 0) { y = 1 };
            let pointX = x + length / 2;
            let pointY = y + length / 2;


            const col = this.properties.column;
            const AreaWidth = length * col;
            if (pointX > AreaWidth) {
                pointX = AreaWidth - 1;
            }
            if (pointY > this.data.iconY + length) {
                pointY = this.data.iconY + length / 2;
            }

            let n = Cache.imgs.length;
            while (n--) {
                const X = (n % col) * length;
                const Y = Math.floor(n / col) * length;
                if (X < pointX && pointX < X + length && Y < pointY && pointY < Y + length) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * 根据imglist ID反查显示图像中的索引顺序
         * @param {number} id
         */
        _findValueIndexByImgListId(id) {
            return Cache.imgs.indexOf(this.data.imgList[id].img);
        },



        _calcPostion(start, end) {
            const step = start < end ? 1 : -1;
            const imgList = this.data.imgList;
            const value = Cache.imgs;
            const col = this.properties.column;
            const length = this.data.length;
            const updateData = {};
            for (let i = start; i != end; i += step) {
                const id = imgList.findIndex(e => e.img == value[i]);
                if (id < 0) {
                    console.error('img not found:', i, value[i]);
                    continue;
                }
                updateData[`imgList[${id}].x`] = (i % col) * length;
                updateData[`imgList[${id}].y`] = Math.floor(i / col) * length;
            }
            return updateData;
        },

        _renderIcon(updateData, len) {
            len = len || this.data.imgList.length;
            const col = this.properties.column;
            const max = this.properties.max;
            const length = this.data.length;
            if (len < max) {
                updateData['iconX'] = (len % col) * length;
                updateData['iconY'] = Math.floor(len / col) * length;
            } else {
                // 达到最大值隐藏图标
                updateData['iconX'] = null;
                updateData['iconY'] = Math.floor((max - 1) / col) * length;
            }
            updateData['animation'] = false;
            this._updateAsync(updateData);
        },

        /**
         * clear index status
         * @param {int} id 
         */
        _clearStatus(id) {
            const data = {
                animation: false
            };
            if (id >= 0) {
                data[`imgList[${id}].status`] = '';
            }
            this._updateAsync(data);
        },

        /**
         * 异步更新数据
         * @param {object|string} data 
         * @param {any} value 
         */
        _updateAsync(data, value) {
            if (2 == arguments.length) {
                data = { [data]: value };
            }
            wx.nextTick(() => {
                // console.log('update async', JSON.stringify(data));
                this.setData(data);
            })
        }
    }
});
