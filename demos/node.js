const { inspect } = require('util');
const only = require('only');
console.log(inspect.custom); // Symbol(nodejs.util.inspect.custom)

const s = {
  a: '1',
  b: '2',
  c: '3'
};

console.log(only(s, ['a']));
