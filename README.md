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
    "image-picker": "/components/image-picker"
  }
}
```

## Usage

### 
```html
<image-picker
    bind:input="输入响应回调事件"
    width="宽度,默认屏幕宽度"
    column="列数默认3"
    max="最多图片数量默认9"
    type="图片压缩类型,默认['compressed', 'original']"
    source="选图来源, 默认 ['album', 'camera']"
    >
</image-picker>
```