var test = require('tape')

var numproc = require('../') 

test("gathers proc metrics",function(t){

  var metrics = {}

  var stop = numproc('testing',{
    metric:function(key,value){
      metrics[key] = value
    }
  },500)

  setTimeout(function(){

    var keys = [
      'testing.memory.rss'
      ,'testing.memory.heapTotal'
      ,'testing.memory.heapUsed'
      ,'testing.js.eventloop'
      ,'testing.js.handles'
      ,'testing.js.requests'
      ,'testing.fds.count'
      ,'testing.cpu.percent'
    ]

    keys.forEach(function(key){
      t.ok(metrics[key] !== undefined,'should track '+key)
    })

    stop()
    t.end();

  },1020)

})






