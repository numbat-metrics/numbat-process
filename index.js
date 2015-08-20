
var blocked = require('blocked')
var cpuPercent = require('cpu-percent')
var Emitter = require('numbat-emitter')
var procfs = require('procfs-stats')

var DEFAULT_TIMEOUT = 10000

var lagIdInc = 0
var eventLoopLag = {}

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

  var percent = 0

  var cpuStop = cpuPercent.pid(process.pid,function(err,_percent){
    if(err) percent = 0
    percent = _percent<1?1:_percent
  },options.cpuInterval||1000)

  cpuStop.unref()

  // get new event loop lag data array
  var lagId = ++lagIdInc
  eventLoopLag[lagId] = []
 
  var stop = _interval(function(cb){

    metric(emitter,'cpu.percent',percent)

    // memory
    var mem = process.memoryUsage();
    Object.keys(mem).forEach(function(k){
      metric(emitter,'memory.'+k,mem[k])
    });

    // event loop lag
    var lag = computeLag(lagId)  

    metric(emitter,'js.eventloop',lag)
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
    delete eventLoopLag[lagId]   
  }

}

blocked(function(ms){
  var keys = Object.keys(eventLoopLag);
  var k;
  for(var i=0;i<eventLoopLag.length;++i){
    k = keys[i]
    eventLoopLag[k].push([ms,Date.now()])
    if(eventLoopLag[k].length > 20) eventLoopLag[k].shift()
  }
})

function computeLag(id){
  var lag = eventLoopLag[id]
  if(!lag) return -1

  eventLoopLag = []
  var start;
  var sum = 0;
  for(var i=0;i<lag.length;++i){
    if(!start) start = lag[i][1]
    sum += lag[i][0]
  }

  return sum/lag.length

}

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
