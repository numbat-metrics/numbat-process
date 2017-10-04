var test = require('tape')
var df = require('../lib/df')

test('can df', function (t) {
  df.df(['.'], function (err, data) {
    t.ok(!err, 'shouldnt have error')
    t.ok(data, 'have data')
    console.log(data + '')
    t.end()
  })
})

test('can parse', function (t) {
  var str = 'Filesystem     1K-blocks      Used Available Use% Mounted on\n  /dev/sda2      475219048 179079580 271976652  40% /'
  var res = df.parse(str)

  console.log(res)

  t.equals(res.length, 1, 'should have one entry in result')
  var entry = res[0]
  t.equals(entry.available, '271976652', 'should have correct available')
  t.equals(entry['use%'], '40%', 'should have correct use %')

  t.end()
})

test('can parse another with inodes', function (t) {
  var str = 'Filesystem 512-blocks      Used  Available Capacity iused      ifree %iused  Mounted on\n/dev/disk1 1951531008 554946344 1396072664    29% 2803794 4292163485    0%   /'

  var res = df.parse(str)

  console.log(res)
  t.equals(res[0].ifree, '4292163485', 'should have expected ifree')

  t.end()
})
