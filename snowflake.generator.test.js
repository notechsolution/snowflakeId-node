const test = require('ava');
const SnowFlakeId = require('./snowflakeId');

test('SnowFlakeId #1 normal generate', (t) => {
  const generator = new SnowFlakeId({
    dataCenter: 3,
    worker: 5
  });
  const uid = generator.next();
  const result = generator.parse(uid);
  t.is(result.dataCenter, 3);
  t.is(result.worker, 5);
});

test('SnowFlakeId #2 default value', (t) => {
  const generator = new SnowFlakeId();
  const uid = generator.next();
  const result = generator.parse(uid);
  t.is(result.dataCenter, 0);
  t.is(result.worker, 0);
});

test('SnowFlakeId #3 should throw error when dataCenter is exceed the limitation', (t) => {
  const error = t.throws(() => {
    const generator = new SnowFlakeId({
      dataCenter: 32,
      worker: 5
    });
  });
  t.is(error.message, '[SnowFlake]Provided dataCenter-32/worker-5 is exceed the limitation of bits: {"sequence":12,"worker":5,"dataCenter":5}');
});

test('SnowFlakeId #4 should not throw error when worker is the celling of the limitation', (t) => {
  const generator = new SnowFlakeId({
    dataCenter: 31,
    worker: 31
  });
  t.pass('celling checking pass');
});

test.skip(`test IDs`, (t) => {
  const generator = new SnowFlakeId({
    dataCenter: 0
  });
  const uid = generator.parse('48086370702721024');
  console.log(JSON.stringify(uid));
  t.pass('celling checking pass');
});
