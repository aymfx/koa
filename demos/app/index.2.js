let debug = require('debug')('request');

function testTime(params) {
  debug('记录开始时间');
  setTimeout(() => {
    debug('结束时间');
    testTime();
  }, 1000);
}

testTime();

debug('结束时间');
debug('结束时间');
debug('结束时间');
debug('结束时间');

