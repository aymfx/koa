const Koa = require('../');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log(1212);
  ctx.cookies.set('name', 'tobi');
  await next();
});

app.use(async ctx => {
  console.log(222);
  ctx.body = 1212;
});
app.listen(3002, () => {
  console.log('监听好了');
});
