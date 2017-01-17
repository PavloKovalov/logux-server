var reporter = require('../reporter')

function normalizeNewlines (string) {
  // use local copy of Jest newline normalization function
  // until Jest doens't apply normalization on comprasion
  return string.replace(/\r\n|\r/g, '\n')
}

function reportersOut () {
  return normalizeNewlines(reporter.apply({}, arguments))
}

it('uses current time by default', function () {
  expect(reporter.now().getTime()).toBeCloseTo(Date.now(), -1)
})

var ServerConnection = require('logux-sync').ServerConnection
var createServer = require('http').createServer
var SyncError = require('logux-sync').SyncError
var path = require('path')

var BaseServer = require('../base-server')
var Client = require('../client')

var app = new BaseServer({
  env: 'development',
  pid: 21384,
  nodeId: 'server:H1f8LAyzl',
  subprotocol: '2.5.0',
  supports: '2.x || 1.x'
})
app.listenOptions = { host: '127.0.0.1', port: 1337 }

var ws = {
  upgradeReq: {
    headers: { },
    connection: {
      remoteAddress: '127.0.0.1'
    }
  },
  on: function () { }
}

var authed = new Client(app, new ServerConnection(ws), 1)
authed.sync.otherSubprotocol = '1.0.0'
authed.sync.otherProtocol = [0, 0]
authed.user = { id: 100 }
authed.nodeId = '100:550e8400-e29b-41d4-a716-446655440000'

var unauthed = new Client(app, new ServerConnection(ws), 1)

var ownError = new SyncError(authed.sync, 'timeout', 5000, false)
var clientError = new SyncError(authed.sync, 'timeout', 5000, true)

describe('mocked output', function () {
  var originNow = reporter.now
  beforeAll(function () {
    reporter.now = function () {
      return new Date((new Date()).getTimezoneOffset() * 60000)
    }
  })
  afterAll(function () {
    reporter.now = originNow
  })

  it('reports listen', function () {
    var out = reportersOut('listen', app)

    expect(out).toMatchSnapshot()
  })

  it('reports production', function () {
    var wss = new BaseServer({
      env: 'production',
      pid: 21384,
      nodeId: 'server:H1f8LAyzl',
      subprotocol: '1.0.0',
      supports: '1.x'
    })
    wss.listenOptions = { cert: 'A', host: '0.0.0.0', port: 1337 }

    var out = reportersOut('listen', wss)

    expect(out).toMatchSnapshot()
  })

  it('reports http', function () {
    var http = new BaseServer({
      env: 'development',
      pid: 21384,
      nodeId: 'server:H1f8LAyzl',
      subprotocol: '1.0.0',
      supports: '1.x'
    })
    http.listenOptions = { server: createServer() }

    var out = reportersOut('listen', http)

    expect(out).toMatchSnapshot()
  })

  it('reports connect', function () {
    var out = reportersOut('connect', app, '127.0.0.1')

    expect(out).toMatchSnapshot()
  })

  it('reports authenticated', function () {
    var out = reportersOut('authenticated', app, authed)

    expect(out).toMatchSnapshot()
  })

  it('reports disconnect', function () {
    var out = reportersOut('disconnect', app, authed)

    expect(out).toMatchSnapshot()
  })

  it('reports expel', function () {
    var out = reportersOut('disconnect', app, unauthed)

    expect(out).toMatchSnapshot()
  })

  it('reports error', function () {
    var file = __filename
    var jest = path.join(__dirname, '..', 'node_modules', 'jest', 'index.js')
    var error = new Error('Some mistake')
    error.stack = error.name + ': ' + error.message + '\n' +
    '    at Object.<anonymous> (' + file + ':28:13)\n' +
    '    at Module._compile (module.js:573:32)\n' +
    '    at at runTest (' + jest + ':50:10)\n' +
    '    at process._tickCallback (internal/process/next_tick.js:103:7)'
    var out = reportersOut('runtimeError', app, undefined, error)

    expect(out).toMatchSnapshot()
  })

  it('reports client-error', function () {
    var out = reportersOut('clientError', app, authed, clientError)

    expect(out).toMatchSnapshot()
  })

  it('reports authed-error', function () {
    var out = reportersOut('syncError', app, authed, ownError)

    expect(out).toMatchSnapshot()
  })

  it('reports unauthed-error', function () {
    var out = reportersOut('syncError', app, unauthed, clientError)

    expect(out).toMatchSnapshot()
  })

  it('reports destroy', function () {
    var out = reportersOut('destroy', app)

    expect(out).toMatchSnapshot()
  })
})
