# numbat-process

Monitor your process with numbat

[![Build Status](https://travis-ci.org/numbat-metrics/numbat-process.svg?branch=master)](https://travis-ci.org/numbat-metrics/numbat-process)

```js
var numproc = require('numbat-process')

numproc({
    uri: 'tcp://localhost:8000',
    app: 'myapplication'
})

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

- `var stop = module.exports(options,interval)`
  - options, emitter object or config object for numbat-emitter
  - interval, number ms to poll and report stats. default 10000
  - RETURN: stop function. call it to stop emitting metrics.
