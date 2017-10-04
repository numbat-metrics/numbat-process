var test = require('tape')

var numproc = require('../')

test('gathers proc metrics', function (t) {
  var metrics = {}

  var stop = numproc({
    metric: function (attrs) {
      metrics[attrs.name] = attrs.value
    },
    disk: true// ['/']
  }, 500)

  setTimeout(function () {
    var keys = [
      'memory.rss',
      'memory.heapTotal',
      'memory.heapUsed',
      'js.eventloop',
      'js.handles',
      'js.requests',
      'fds.count',
      'cpu.percent',
      'disk.use./',
      'disk.available./',
      'disk.inode-use./',
      'disk.inode-available./'
    ]

    console.log(metrics)
    keys.forEach(function (key) {
      t.ok(metrics[key] !== undefined, 'should track ' + key)
    })

    stop()
    t.end()
  }, 1020)
})
