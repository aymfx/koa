// eslint-disable-next-line no-debugger
const Koa = require('../lib/application.js');
const app = new Koa();
// console.log(app, 1212);s

app.use(async ctx => {
  // ctx.cookies = '1995';
  // throw new Error('xxx');
  console.log(ctx);
  ctx.status = 200;
  ctx.set('ETag', '129');
  // 缓存是好的
  if (ctx.fresh) {
    ctx.status = 304;
    return;
  }
  ctx.body = 'wod20是是是';
});

// app.on('error', err => {
//   // console.error('server error', err);
// });
app.listen(3001);
app.context.name = 'ly';
