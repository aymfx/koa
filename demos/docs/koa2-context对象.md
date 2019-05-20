## context 对象 分析

## 引用的包

```js
/**
 * Module dependencies.
 */

const util = require('util');
const createError = require('http-errors');
const httpAssert = require('http-assert');
const delegate = require('delegates'); // 基本用法就是将内部对象的变量或者函数绑定在暴露在外层的变量上
const statuses = require('statuses'); // 状态码
const Cookies = require('cookies'); // cookie

const COOKIES = Symbol('context#cookies');
```

### delegates 分析

> https://juejin.im/post/5b9339136fb9a05d3634ba13

- getter：外部对象可以直接访问内部对象的值
- setter：外部对象可以直接修改内部对象的值
- access：包含 getter 与 setter 的功能
- method：外部对象可以直接调用内部对象的函数

koa2 中的一些参数委托于 ctx 上面 如

ctx.body 设置响应体
ctx.status 设置响应状态码
ctx.redirect() 请求重定向

### 分析函数

```js
proto = module.exports = {};
```

> inspect

```js

/**
   * util.inspect() implementation, which
   * just returns the JSON output.
   *
   * @return {Object}
   * @api public
   */

  inspect() {
    if (this === proto) return this; //除非是自己调自己 否则返回部分数据
    return this.toJSON();
  },
```

> toJSON

```js

  /**
   * Return JSON representation.
   *
   * Here we explicitly invoke .toJSON() on each
   * object, as iteration will otherwise fail due
   * to the getters and cause utilities such as
   * clone() to fail.
   *
   * @return {Object}
   * @api public
   */
  //获取白名单的信息
  toJSON() {
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: '<original node req>',
      res: '<original node res>',
      socket: '<original node socket>'
    };
  },
```

> httpAssert 比较好用的网络断言 throw 用于抛出网络错误

```js
/**
 * Similar to .throw(), adds assertion.
 *
 *    this.assert(this.user, 401, 'Please login!');
 *
 * See: https://github.com/jshttp/http-assert
 *
 * @param {Mixed} test
 * @param {Number} status
 * @param {String} message
 * @api public
 */

assert: httpAssert;

  /**
   * Throw an error with `status` (default 500) and
   * `msg`. Note that these are user-level
   * errors, and the message may be exposed to the client.
   *
   *    this.throw(403)
   *    this.throw(400, 'name required')
   *    this.throw('something exploded')
   *    this.throw(new Error('invalid'))
   *    this.throw(400, new Error('invalid'))
   *
   * See: https://github.com/jshttp/http-errors
   *
   * Note: `status` should only be passed as the first parameter.
   *
   * @param {String|Number|Error} err, msg or status
   * @param {String|Number|Error} [err, msg or status]
   * @param {Object} [props]
   * @api public
   */

  throw(...args) {
    throw createError(...args);
  },
```

> onerror 错误处理机制

```js
 /**
  * Default error handling.
  *
  * @param {Error} err
  * @api private
  */

 onerror(err) {
   // don't do anything if there is no error.
   // this allows you to pass `this.onerror`
   // to node-style callbacks.
   if (null == err) return; // 没有任何错误就是没错

   if (!(err instanceof Error)) {
     // err不是Error实例时，使用err创建一个Error实例
     err = new Error(util.format('non-error thrown: %j', err));
   }

   let headerSent = false; // 如果res不可写或者请求头已发出
   if (this.headerSent || !this.writable) {
     headerSent = err.headerSent = true;
   }

   // delegate
   this.app.emit('error', err, this); // 自定义类型的错误交给application定义de错误处理判断

   // nothing we can do here other
   // than delegate to the app-level
   // handler and log.
   if (headerSent) {
     return;
   }

   const { res } = this;

   // first unset all headers
   /* istanbul ignore else */
   if (typeof res.getHeaderNames === 'function') {
     // 移除所有设置过的响应头
     res.getHeaderNames().forEach(name => res.removeHeader(name));
   } else {
     res._headers = {}; // Node < 7.7
   }
   // 设置错误头部
   // then set those specified
   this.set(err.headers);

   // force text/plain
   this.type = 'text';
   // 找不到文件错误码设为404
   // ENOENT support
   if ('ENOENT' == err.code) err.status = 404;

   // default to 500
   if ('number' != typeof err.status || !statuses[err.status]) {
     err.status = 500;
   }
   // 设置相应头
   // respond
   const code = statuses[err.status];
   const msg = err.expose ? err.message : code;
   this.status = err.status;
   this.length = Buffer.byteLength(msg);
   res.end(msg);
 },

```

> cookie 设置

```js
  get cookies() {
    if (!this[COOKIES]) {
      this[COOKIES] = new Cookies(this.req, this.res, {
        keys: this.app.keys,
        secure: this.request.secure
      });
    }
    return this[COOKIES];
  },

  set cookies(_cookies) {
    this[COOKIES] = _cookies;
  }

```

> 代码覆盖率

```js
/**
 * Custom inspection implementation for newer Node.js versions.
 *
 * @return {Object}
 * @api public
 */

/* istanbul ignore else */

// 代码覆盖工具隐藏  http://www.ruanyifeng.com/blog/2015/06/istanbul.html
if (util.inspect.custom) {
  module.exports[util.inspect.custom] = module.exports.inspect; // 设置白名单
}
```

> 代理

```js
/**
 * Response delegation.
 */

// 将request 和response的事件委托到proto 也就是实例化的ctx

delegate(proto, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('set')
  .method('append')
  .method('flushHeaders')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

/**
 * Request delegation.
 */

delegate(proto, 'request')
  .method('acceptsLanguages')
  .method('acceptsEncodings')
  .method('acceptsCharsets')
  .method('accepts')
  .method('get')
  .method('is')
  .access('querystring')
  .access('idempotent')
  .access('socket')
  .access('search')
  .access('method')
  .access('query')
  .access('path')
  .access('url')
  .access('accept')
  .getter('origin')
  .getter('href')
  .getter('subdomains')
  .getter('protocol')
  .getter('host')
  .getter('hostname')
  .getter('URL')
  .getter('header')
  .getter('headers')
  .getter('secure')
  .getter('stale')
  .getter('fresh')
  .getter('ips')
  .getter('ip');
```
