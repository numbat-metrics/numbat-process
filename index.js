'use strict'

var cpuPercent = require('cpu-percent')
var Emitter = require('numbat-emitter')
var procfs = require('procfs-stats')
var blocked = require('blocked')

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
    procStats.fds(function (_, fds) {
      if (fds) metric(emitter, 'fds.count', fds.length || 0)
      cb()
    })
  }, interval || DEFAULT_TIMEOUT)

  return function () {
    stop()
    cpuStop()
  }
}

module.exports.Emitter = Emitter

var eventLoopLagKey = -1
var eventLoopLag = (new Array(20)).map(function () { return 0 })

blocked(function (ms) {
  eventLoopLagKey++
  if (eventLoopLagKey > 20) eventLoopLagKey = 0
  eventLoopLag[eventLoopLagKey] = ms
}, {interval: 200})

function computeLag () {
  var sum = 0
  for (var i = 0; i < eventLoopLag.length; ++i) {
    sum += eventLoopLag[i]
  }

  return sum / eventLoopLag.length
}

// setTimeout loop with callback to prevent metrics gathering cycles from stacking.
function _interval (fn, duration) {
  var stopped = false
  var i = null

  function loop () {
    if (stopped) return
    i = setTimeout(function () {
      fn(loop)
    }, duration)
    i.unref()
  }

  loop()

  return function () {
    stopped = true
    clearTimeout(i)
  }
}

function metric (em, name, value) {
  em.metric({
    name: name,
    value: value === undefined ? 1 : value
  })
}
