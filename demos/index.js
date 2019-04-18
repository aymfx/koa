const Koa = require('../');
const http = require('http');
const app = new Koa();

// app.use(async ctx => {
//   ctx.body = 'heh';
// })
// ;

// app.listen(3000, () => {
//   console.log('监听好了');
// });

http.createServer(3000, () => {
  console.log('监听好了');
});
