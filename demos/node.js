const { inspect } = require('util');
const only = require('only');
console.log(inspect.custom); // Symbol(nodejs.util.inspect.custom)
const Cookies = require('cookies');

const s = {
  a: '1',
  b: '2',
  c: '3',
  get cookies() {
    return this.a;
  },
  set cookies(a) {
    this.a = a;
  }
};

// s.cookies = 2;
s.cookies.set(2);
console.log(s);
