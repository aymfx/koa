## request 对象 分析

## 引用的包

```js
/**
 * Module dependencies.
 */

const URL = require('url').URL;
const net = require('net');
const accepts = require('accepts'); // 允许接受的类型
const contentType = require('content-type'); // Create and parse HTTP Content-Type header according to RFC 7231
const stringify = require('url').format;
const parse = require('parseurl');
const qs = require('querystring'); // 解析body数据
const typeis = require('type-is');
const fresh = require('fresh'); // 刷新机制 不懂  英文太难了
const only = require('only');
const util = require('util');

const IP = Symbol('context#ip');
```


