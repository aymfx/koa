const Koa = require('../');
const app = new Koa();

app.use(async (ctx, next) => {
  ctx.status = 200;
  console.log(ctx.status, 1212);
  ctx.body = 1212;
  // ctx.redirect('back');
  console.log(ctx.length, 222);
});

app.use(async ctx => {});
app.listen(3002, () => {
  console.log('监听好了');
});
