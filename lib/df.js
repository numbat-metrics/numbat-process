var cp = require('child_process')
var eos = require('end-of-stream')

module.exports.df = function (args, cb) {
  var proc = cp.spawn('df', args)

  var c = 3
  var out = []
  var err = []
  var streamErr
  eos(proc.stdout, function (err) {
    if (err) streamErr = err
    if (!--c) done()
  })
  eos(proc.stderr, function (err) {
    if (err) streamErr = err
    if (!--c) done()
  })

  proc.stdout.on('data', (b) => out.push(b))
  proc.stderr.on('data', (b) => err.push(b))

  proc.on('exit', function (code) {
    if (!--c) done(code)
  })

  function done (code) {
    var e = streamErr
    if (code) {
      e = new Error('df exit code ' + code)
    }
    cb(e, Buffer.concat(out), Buffer.concat(err))
  }
}

module.exports.parse = function (str) {
  var lines = (str + '').trim().split('\n')
  var header = lines.shift().split(/[\s]+/)

  var ret = []
  lines.forEach(function (l) {
    var fields = l.trim().split(/[\s]+/)
    var o = {}
    fields.forEach((v, i) => {
      o[header[i].toLowerCase()] = fields[i]
    })

    ret.push(o)
  })
  return ret
}
