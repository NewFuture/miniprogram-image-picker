Component({
  properties: {
    /**
     * 图片地址
     */
    src: String,
    /**
     * 是否正则移动
     */
    moving: Boolean,
    //size
    /**
     * 是否激活状态
     */
    //avtive:Boolean,
  },
  methods: {
    /**
     * 轻点预览
     * this.dataset.id 可获取当前的index
     * @param {Event} e
     */
    onTap(e) {
      // console.log(this.dataset)
      wx.previewImage({
        urls: [this.properties.src],
      })
    },
    /**
     * 点击删除
     * triggerEvent 父组件进行删除
     */
    onTapDel(e) {
      this.triggerEvent("delete");
    }
  }
});