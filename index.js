
var blocked = require('blocked')
var cpuPercent = require('cpu-percent')
var Emitter = require('numbat-emitter')
var procfs = require('procfs-stats')

var DEFAULT_TIMEOUT = 10000

var eventLoopLag = 0;

module.exports = function(options,interval){

  var emitter
  options = options||{}

  if(typeof options.metric === 'function'){
    emitter = options
  } else {
    emitter = new Emitter(options)
  }

  var procStats = procfs(process.pid)

  // cpu - never reports 0.  on a graph zero means it's failing to report anything

  var cpuStop = cpuPercent.pid(process.pid,function(percent){
    metric(emitter,'cpu.percent',percent<1?1:percent)
  },interval||DEFAULT_TIMEOUT)

  cpuStop.unref()

  var stop = _interval(function(cb){

    // memory
    var mem = process.memoryUsage();
    Object.keys(mem).forEach(function(k){
      metric(emitter,'memory.'+k,mem[k])
    });

    // event loop lag
    metric(emitter,'js.eventloop',eventLoopLag)
    metric(emitter,'js.handles',process._getActiveHandles().length)
    metric(emitter,'js.requests',process._getActiveRequests().length)

    // fds
    procStats.fds(function(err,fds){
      if(fds) metric(emitter,'fds.count',fds.length||0)
      cb();
    })

  },interval||DEFAULT_TIMEOUT)

  return function(){
    stop()
    cpuStop()
  }

}

blocked(function(ms){
  eventLoopLag = ms;
})

// setTimeout loop with callback to prevent metrics gathering cycles from stacking.
function _interval(fn,duration){
  var i, stopped;
  (function loop(){
    if(stopped) return;
    i = setTimeout(function(){
      fn(loop)
    },duration)
    i.unref()
  }())

  return function(){
    stopped = true;
    clearTimeout(i)
  }

}


function metric(em,name,value){
  em.metric({
    name: name,
    value: value === undefined?1:value 
  })
}
