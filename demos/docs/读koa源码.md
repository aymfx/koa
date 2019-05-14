## 源码的结构
 - application.js
 - context.js
 - request.js
 - response.js

## 入口文件

>   "main": "lib/application.js",

# 先对application 的引入的包文件进行分析 ==>

##  is-generator-function  判断是不是生成器的包

```js
const isGeneratorFunction = require('is-generator-function'); // 判断是不是生成器的包

function s1() {}

let s2 = null;

function * s3() {
  yield 43;
  return Infinity;
}

let s4 = s3();

console.log(isGeneratorFunction(s1)); //false
console.log(isGeneratorFunction(s2));//false
console.log(isGeneratorFunction(s3));//true
```

##  debug 用于调试  同时可以看到调栈消耗的时间

``` js
let debug = require('debug')('request');
debug('1');
function testTime(params) {
  setTimeout(() => {
    debug('3');
  }, 1000);
}
debug('2');
testTime();

// debug('结束时间1');
// debug('结束时间2');
// debug('结束时间3');
// debug('结束时间4');
// debug('结束时间5');

```

##  on-finished http请求结束 完成 或者报错的时候回调

``` js
const Koa = require('../');
const app = new Koa();
let onFinished = require('on-finished');

app.use(async ctx => {
  ctx.body = 'heh';
  onFinished(ctx, (err, res) => {
    console.log('11');
  });
});

app.listen(3000, () => {
  console.log('监听好了');
});
```

> const isJSON = require('koa-is-json');  //判断返回的数据是不是json  body

##  statuses 状态🐎

```js
const status = require('statuses');

status(403) // => 403
status('403') // => 403
status('forbidden') // => 403
status('Forbidden') // => 403
status(306)
```



