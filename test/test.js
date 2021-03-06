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

    keys.forEach(function (key) {
      t.ok(metrics[key] !== undefined, 'should track ' + key)
    })

    stop()
    t.end()
  }, 1020)
})

function tracker () {
  var metrics = {}

  return {
    handler: function (attrs) {
      metrics[attrs.name] = attrs.value
    },
    metrics
  }
}

test('should be disabled when options.disabled === true', function (t) {
  process.env.NUMBAT_PROCESS_DISABLED = false
  var track = tracker()
  var stop = numproc({metric: track.handler, disabled: true}, 500)
  t.ok(stop.disabled === true, 'should be disabled')

  setTimeout(function () {
    t.ok(Object.keys(track.metrics).length === 0, 'should not collect any metrics when disabled')

    stop()
    t.end()
  }, 1020)
})

test('should be disabled when NUMBAT_PROCESS_DISABLED === true', function (t) {
  process.env.NUMBAT_PROCESS_DISABLED = true
  var track = tracker()
  var stop = numproc({metric: track.handler}, 500)
  t.ok(stop.disabled === true, 'should be disabled')

  setTimeout(function () {
    t.ok(Object.keys(track.metrics).length === 0, 'should not collect any metrics when disabled')

    stop()
    t.end()
  }, 1020)
})

test('should be prefer options.disabled to NUMBAT_PROCESS_DISABLED', function (t) {
  process.env.NUMBAT_PROCESS_DISABLED = false
  var track = tracker()
  var stop = numproc({metric: track.handler, disabled: true}, 500)
  t.ok(stop.disabled === true, 'should be disabled')
  stop()

  process.env.NUMBAT_PROCESS_DISABLED = true
  track = tracker()
  stop = numproc({metric: track.handler, disabled: false}, 500)
  t.ok(stop.disabled === undefined, 'should NOT be disabled')
  stop()

  t.end()
})
