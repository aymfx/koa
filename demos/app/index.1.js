const isGeneratorFunction = require('is-generator-function'); // 判断是不是生成器的包

function s1() {}

let s2 = null;

function * s3() {
  yield 43;
  return Infinity;
}

let s4 = s3();

console.log(s4.next());
