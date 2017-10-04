# numbat-process

Monitor your process with numbat

[![Build Status](https://travis-ci.org/numbat-metrics/numbat-process.svg?branch=master)](https://travis-ci.org/numbat-metrics/numbat-process)

```js
var numproc = require('numbat-process')

numproc({
    uri: 'tcp://localhost:8000',
    app: 'myapplication',
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


### disk stats!

if you pass true in `options.disk` numbat process will also emit local disk metrics.


```
'disk.use./'
'disk.available./'
'disk.inode-use./'
'disk.inode-available./'
```

the format is disk.[type].[mount point]

by default numbat-process emits one metric for every disk with a filesystem column starting with `/dev`.

`/dev/sda1` for example

you can also pass an array of mount points you would like to track instead. if you only want disk metrics for `/` 
set `options.disk = ['/']` and df output will be filtered to only emit metrics for `/`


