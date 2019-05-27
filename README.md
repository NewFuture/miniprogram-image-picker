# image-picker
Customized image picker for Wechat MiniProgram,小程序自定义图片选择组件

### Features
* [x] 任意数量
* [x] 移动调整顺序
* [x] 删除
* [x] 实时修改
* [x] generic 自定义图片内容和样式

## Install
via npm
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
## Usage

### wxml
```html
<image-picker
    bind:input="输入更新响应回调事件"
    bind:move="移动图片回调事件"
    bind:add="添加图片应回调事件"
    bind:delete="删除图片回调事件"
    value="图像列表[{path,size}],默认空"
    column="列数默认1~5: 3"
    max="最多图片数量可以超过9默认: 9"
    tap-preview="点击图片预览,如果false会触发tapItem,默认: true"
    data-open="是否立即打开选择器,默认: {{false}}"
    data-source="选图来源, 默认: {{['album', 'camera']}}"
    data-type="图片压缩类型,默认: {{['compressed', 'original']}}"
/>
```

当属性`value`,`column`,`max`更新时，视图会自动更新

example
```html
<image-picker
    bind:input="onImgsUpdate"
    value="{{[{path:'xxxx',size:''}]}}"
    column="4"
    max="16"
    data-source="{{['album']}}"
    data-type="{{['compressed']}}"
/>
```
### events

* `input`
> 图片列表发生变化

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

* `add`
> 添加事件触发
```js
[{ size, path }];
```

* `delete`
> 删除事件触发
```js
{
   index, // 图片索引 
}
```

* `move`
> 移动事件触发
```js
{
  form, //源 index
  to, // 目标 index
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


### generics

 自定义item子组件
 ```html
 <image-picker  generics:item="自定义组件名"></image-picker>
 ```

#### 子组件传递属性

```js
{
    /**
     * 图片信息
     * @type {path:String,size:Number}
     */
    img: String,
    /**
     * 此元素是否正则移动
     */
    moving: Boolean,
}
```
##### 子组件支持的触发事件

```js
// 预览图片
this.triggerEvent("preview");
// 删除此元素
this.triggerEvent("delete");
```

### demo
![demo](https://user-images.githubusercontent.com/6290356/58382382-08f0dd80-7ffc-11e9-8e96-1a05a3dab49a.png)