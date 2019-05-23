## request 对象 分析

## 引用的包

```js
/**
 * Module dependencies.
 */

const contentDisposition = require('content-disposition'); // Content-Disposition就是当用户想把请求所得的内容存为一个文件的时候提供一个默认的文件名
const ensureErrorHandler = require('error-inject'); // 将错误侦听器注入流中
const getType = require('cache-content-type'); // http响应头部工具包， 基于mime-types包，对结果进行了缓存
const onFinish = require('on-finished');
const isJSON = require('koa-is-json');
const escape = require('escape-html'); // 用于HTML的转义字符串
const typeis = require('type-is').is;
const statuses = require('statuses');
const destroy = require('destroy'); // 处理不同的API和Node.js错误 销毁流
const assert = require('assert');
const extname = require('path').extname; // 方法返回 path 的扩展名
const vary = require('vary'); // 操纵HTTP Vary标头
const only = require('only');
const util = require('util');
```

> 对象方法
