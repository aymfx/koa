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
