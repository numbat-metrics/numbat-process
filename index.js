
var blocked = require('blocked')
var cpuPercent = require('cpu-percent')
var df = require('./lib/df')
var Emitter = require('numbat-emitter')
var procfs = require('procfs-stats')

var DEFAULT_TIMEOUT = 10000

module.exports = function (options, interval) {
  var emitter
  options = options || {}

  if (typeof options.metric === 'function') {
    emitter = options
  } else {
    emitter = new Emitter(options)
  }

  var procStats = procfs(process.pid)

  // cpu - never reports 0.  on a graph zero means it's failing to report anything

  var percent = 0

  var cpuStop = cpuPercent.pid(process.pid, function (err, _percent) {
    if (err) percent = 0
    percent = _percent < 1 ? 1 : _percent
  }, options.cpuInterval || 1000)

  cpuStop.unref()

  var dfing = 0

  var stop = _interval(function (cb) {
    metric(emitter, 'cpu.percent', percent)

    // memory
    var mem = process.memoryUsage()
    Object.keys(mem).forEach(function (k) {
      metric(emitter, 'memory.' + k, mem[k])
    })

    var lag = computeLag()

    metric(emitter, 'js.eventloop', lag)
    metric(emitter, 'js.handles', process._getActiveHandles().length)
    metric(emitter, 'js.requests', process._getActiveRequests().length)

    // fds
    procStats.fds(function (_err, fds) {
      if (fds) metric(emitter, 'fds.count', fds.length || 0)
      cb()
    })

    if (dfing === 0 && options.disk) {
      dfing = 2
      df.df([], function (err, data) {
        dfing--
        if (err) return

        var report = filterDisks(df.parse(data) || [], options.disk)
        report.forEach(function (o) {
          metric(emitter, 'disk.use.' + o.mounted, +(o['use%'] || '0').replace(/[^\d]/g, ''))
          metric(emitter, 'disk.available.' + o.mounted, +o.available)
        })
      })

      df.df(['-i'], function (err, data) {
        dfing--
        if (err) return

        var report = filterDisks(df.parse(data) || [], options.disk)
        report.forEach(function (o) {
          // mac||linux
          metric(emitter, 'disk.inode-use.' + o.mounted, +(o['%iused'] || o['iused%'] || '0').replace(/[^\d]/g, ''))
          metric(emitter, 'disk.inode-available.' + o.mounted, +(o['ifree'] || 0))
        })
      })
    }
  }, interval || DEFAULT_TIMEOUT)

  return function () {
    stop()
    cpuStop()
  }
}

module.exports.Emitter = Emitter
var eventLoopLength = 20
var eventLoopLagKey = 0
var eventLoopLag = (new Array(eventLoopLength)).map(function () { return 0 })

blocked(function (ms) {
  eventLoopLag[eventLoopLagKey] = ms
  eventLoopLagKey = (eventLoopLagKey + 1) % eventLoopLength
}, {interval: 200})

function computeLag () {
  var sum = 0
  for (var i = 0; i < eventLoopLag.length; ++i) {
    sum += eventLoopLag[i]
  }

  if (sum === 0) return 0
  return sum / eventLoopLag.length
}

// setTimeout loop with callback to prevent metrics gathering cycles from stacking.
function _interval (fn, duration) {
  var i, stopped;
  (function loop () {
    if (stopped) return
    i = setTimeout(function () {
      fn(loop)
    }, duration)
    i.unref()
  }())

  return function () {
    stopped = true
    clearTimeout(i)
  }
}

function metric (em, name, value) {
  em.metric({
    name: name,
    value: (isNaN(value) || value === undefined) ? 1 : value
  })
}

function filterDisks (disks, filter) {
  return disks.filter((o) => {
    // filter only specific mounts.
    if (filter && Array.isArray(filter)) {
      return filter.indexOf(o.mounted) === 0
    }

    // filter all things that look like normal storage disks
    return o.filesystem.indexOf('/dev') === 0
  })
}
