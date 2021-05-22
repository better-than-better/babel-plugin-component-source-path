# babel-plugin-component-source-path

实现类似微信开发者工具中审查元素时透出的组件路径，目前只支持 React 组件

## Usage

如下修改 babel 配置文件比如 `.bablerc`。可选参数 `fieldName` 具体挂载的属性名称，默认 `data-source`


```json
{
  "plugins": [
    [
      "babel-plugin-component-source-path", {
        "fieldName": "data-source",
      }
    ]
  ]
}
```

微信开发者工具效果：

![](https://s.h2-o.xyz/20210522145445.png)

插件实现效果：

![](https://s.h2-o.xyz/20210522152105.png)
