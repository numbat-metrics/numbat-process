# numbat-process
Monitor your process with numbat

```js
var emitter = ... // emiter can be an instance or options to pass to numbat-emitter
var numproc = require('numbat-process')

numproc('myapplication',emitter)

```

now every 10 seconds your application will emit these metrics!

```js

'myapplication.memory.rss'
'myapplication.memory.heapTotal'
'myapplication.memory.heapUsed'
'myapplication.js.eventloop'
'myapplication.js.handles'
'myapplication.js.requests'
'myapplication.fds.count'
'myapplication.cpu.percent'

```


## API

- `var stop = module.exports(prefix,options,interval)`
  - prefix, string metrics prefix. required.
  - options, emitter object or config object for numbat-emitter
  - interval, number ms to poll and report stats. default 10000
  - RETURN: stop function. call it to stop emitting metrics.

