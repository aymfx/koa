// eslint-disable-next-line no-debugger
const Koa = require('../lib/application.js');
const app = new Koa();
// console.log(app, 1212);s
app.use(async ctx => {
  ctx.cookies.set('name', 'tobi', { signed: true });
  ctx.body = 'Hello World';
});

app.listen(3001);
