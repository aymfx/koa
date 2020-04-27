// eslint-disable-next-line no-debugger
const Koa = require('../lib/application.js');
const app = new Koa();

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
