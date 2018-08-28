# image-picker
Customized image picker for Wechat MiniProgram,小程序自定义图片选择组件

## Install

### npm pakage
```
npm i miniprogram-image-picker -S
```

```json
{
  "usingComponents": {
    "image-picker": "miniprogram-image-picker"
  }
}
```

### git submodule/subtree
```
git subtree add --prefix=components/image-picker --squash git@github.com:NewFuture/image-picker.git master
```
```json
{
  "usingComponents": {
    "image-picker": "/components/image-picker/index"
  }
}
```

## Usage

### wxml
```html
<image-picker
    bind:input="输入响应回调事件"
    width="宽度,默认: 屏幕宽度"
    column="列数默认: 3"
    max="最多图片数量默认: 9"
    type="图片压缩类型,默认: {{['compressed', 'original']}}"
    source="选图来源, 默认: {{['album', 'camera']}}"
    open="是否立即打开选择器,默认: {{false}}"
    value="初始填充图像列表[{path,size}],默认空"
/>

```

### input event

```js
event.detail = { value, type };
event.detail.type // string 获取事件内容类型 包括: "add" ,"delete","move"
e.detail.value = [{path,size}] // Array 图像对象列表
```

example event detail

```json
{
  "value":[
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.9SHfItdYeoVz7205b342cc5ec2480d7fea923836a227.jpg","size":18153},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.ZaqbvhV5XSs0beb97b7db6208cbd8c1f3001dd83ef5c.jpg","size":15233},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.wNsZ7ruZD0sT0668a02aeb46768d750fff59bf6737b8.jpg","size":11792},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.vGY6456CvSGvcf8149c4beb7f4deeb3680ae2f219b51.jpg","size":19320},
    {"path":"http://tmp/wx7282106b813ba035.o6zAJsw2p7YWMPpe1hhoXcqP7BoE.BImgk5zyXJDv630a1e89c698fee6cef3948394866249.jpg","size":19560}
  ],
  "type":"move"
}
```

#### bind input

```html
<image-picker bind:input="onInput"/>
```
```js
Page({
    data: {
        pictures: []
    },
    onInput(e) {
        this.setData({ pictures: e.detail.value })
    }
});
```

#### wxss样式覆盖

可以覆盖组件默认[样式文件](index.wxss)的class

```css
.ImagePicker {/*整个组件样式*/}
.ImagePicker-item {/*每个方框样式*/}
.ImagePicker-itemImg {/*每个方框内图片样式*/}
.ImagePicker-addIcon {/*添加按钮样式*/}
```