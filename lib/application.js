'use strict';

/**
 * Module dependencies.
 */

const isGeneratorFunction = require('is-generator-function'); // 判断是不是生成器的包
const debug = require('debug')('koa:application'); // 用于调试  同时可以看到调栈消耗的时间
const onFinished = require('on-finished'); // http请求结束 完成 或者报错的时候回调
const response = require('./response');
const compose = require('koa-compose'); // 合并中间件
const isJSON = require('koa-is-json'); // 判断返回的数据是不是json  body
const context = require('./context');
const request = require('./request');
const statuses = require('statuses'); // 状态🐎
const Emitter = require('events');
const util = require('util');
const Stream = require('stream');
const http = require('http');
const only = require('only'); // 返回对象的白名单属性
const convert = require('koa-convert'); // 用于支持之前版本的中间件
const deprecate = require('depd')('koa'); // 展示一些弃用的东西

/**
 * Expose `Application` class.
 * Inherits from `Emitter.prototype`.
 */

module.exports = class Application extends Emitter {
  /**
   * Initialize a new `Application`.
   *
   * @api public
   */

  constructor() {
    super(); // 继承父元素的方法
    this.proxy = false; // 代理
    this.middleware = []; // 存放中间件的数组
    this.subdomainOffset = 2; // 子域名偏移设置
    this.env = process.env.NODE_ENV || 'development'; // 读取环境变量
    this.context = Object.create(context); // 实例化三个对象
    this.request = Object.create(request);
    this.response = Object.create(response);
    if (util.inspect.custom) {
      // 这段只是为了隐藏输出信息  只暴露一些情况
      console.log(this.inspect, util.inspect.custom); // [Function: inspect] Symbol(nodejs.util.inspect.custom)
      this[util.inspect.custom] = this.inspect; // 只输出白名单的东西  重写了 函数的显示
      console.log();
    }
  }

  /**
   * Shorthand for:
   *
   *    http.createServer(app.callback()).listen(...)
   *
   * @param {Mixed} ...
   * @return {Server}
   * @api public
   */

  listen(...args) {
    // 调用监听方法
    console.log(args); // [ 3002, [Function] ]   3002是端口号 [Function] 是定义启动后的回调函数
    debug('listen');
    const server = http.createServer(this.callback()); // 创建一个服务  callback 下一步讲
    return server.listen(...args);
  }

  /**
   * Return JSON representation.
   * We only bother showing settings.
   *
   * @return {Object}
   * @api public
   */

  toJSON() {
    return only(this, ['subdomainOffset', 'proxy', 'env']); // 只返回白名单的东西 ,在constructor 有调用
  }

  /**
   * Inspect implementation.
   *
   * @return {Object}
   * @api public
   */

  inspect() {
    return this.toJSON();
  }

  /**
   * Use the given middleware `fn`.
   *
   * Old-style middleware will be converted.
   *
   * @param {Function} fn
   * @return {Application} self
   * @api public
   */

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function!');
    } // 先检查传的是不是fn
    if (isGeneratorFunction(fn)) {
      // 之前的版本是生成器来做异步 现在我们需要对这类中间件进行转换 变成 async await
      deprecate(
        'Support for generators will be removed in v3. ' +
          'See the documentation for examples of how to convert old middleware ' +
          'https://github.com/koajs/koa/blob/master/docs/migration.md'
      );
      fn = convert(fn);
    }
    debug('use %s', fn._name || fn.name || '-');
    this.middleware.push(fn); // 然后放到中间件栈里面去
    return this;
  }

  /**
   * Return a request handler callback
   * for node's native http server.
   *
   * @return {Function}
   * @api public
   */

  callback() {
    const fn = compose(this.middleware); // 合并所有的中间件

    if (!this.listenerCount('error')) this.on('error', this.onerror); //  this.listenerCount('error') 没注册error时  我们进行注册

    const handleRequest = (req, res) => {
      const ctx = this.createContext(req, res); // 传原始的req,res 进行封装  最后返回一个封装好的ctx对象
      return this.handleRequest(ctx, fn); // 最后传到真正的handleRequest 函数进行处理
    };

    return handleRequest;
  }

  /**
   * Handle request in callback.
   *
   * @api private
   */

  handleRequest(ctx, fnMiddleware) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err); // 一个错误处理函数
    const handleResponse = () => respond(ctx); // 一个事件处理函数 完成所有中间件后的回调
    onFinished(res, onerror); // 请求结束 完成 或者报错的时候回调
    return fnMiddleware(ctx)
      .then(handleResponse)
      .catch(onerror); // 中间完成后执行了respond 报错执行onerror
  }

  /**
   * Initialize a new context.
   *
   * @api private
   */

  createContext(req, res) {
    // 初始化新的对象  保证不会出现相互干扰的情况
    const context = Object.create(this.context);
    const request = (context.request = Object.create(this.request));
    const response = (context.response = Object.create(this.response));
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url; // 展示的一致的请求url
    context.state = {};
    return context;
  }

  /**
   * Default error handler.
   *
   * @param {Error} err
   * @api private
   */

  onerror(err) {
    if (!(err instanceof Error)) {
      throw new TypeError(util.format('non-error thrown: %j', err));
    } // 如果是错误对象 则直接抛出

    if (404 == err.status || err.expose) return; // 如果是404 或者其他 这直接返回  expose 决定是否会返回错误详情给客户端，否则只展示状态对应的错误文案
    if (this.silent) return; // 保持沉默？

    const msg = err.stack || err.toString(); // string 类型的错误直接展示在控制台
    console.error();
    console.error(msg.replace(/^/gm, '  '));
    console.error();
  }
};

/**
 * Response helper.
 */

function respond(ctx) {
  // allow bypassing koa
  if (false === ctx.respond) return; // 如不想使用Koa 内置的response 处理方法，可以设置 ctx.respond = false;

  if (!ctx.writable) return; // ？？

  const res = ctx.res;
  let body = ctx.body;
  const code = ctx.status;

  // ignore body
  if (statuses.empty[code]) {
    // 找不到状态码就返回null
    // strip headers
    ctx.body = null;
    return res.end();
  }

  if ('HEAD' == ctx.method) {
    // 当请求方法为 HEAD 时，判断响应头是否发送以及响应主体是否为 JSON 格式，若满足则设置响应 Content-Length：
    if (!res.headersSent && isJSON(body)) {
      ctx.length = Buffer.byteLength(JSON.stringify(body));
    }
    return res.end();
  }

  // status body
  if (null == body) {
    // 状态头的判断
    if (ctx.req.httpVersionMajor >= 2) {
      // 在服务器请求的情况下，表示客户端发送的 HTTP 版本。 在客户端响应的情况下，表示连接到的服务器的 HTTP 版本。 可能是 '1.1' 或 '1.0'。
      body = String(code);
    } else {
      body = ctx.message || String(code);
    }
    if (!res.headersSent) {
      // 布尔值（只读）。 如果已发送响应头，则为 true，否则为 false。
      ctx.type = 'text';
      ctx.length = Buffer.byteLength(body);
    }
    return res.end(body);
  }

  // responses  //判断请求流   二进制  字符串 流  json
  if (Buffer.isBuffer(body)) return res.end(body);
  if ('string' == typeof body) return res.end(body);
  if (body instanceof Stream) return body.pipe(res);

  // body: json
  body = JSON.stringify(body);
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body);
  }
  res.end(body);
}
