const EventEmitter = require('events').EventEmitter
const express = require('express')
const Cashbox = require('cashbox')
const deap = require('deap')
const morgan = require('morgan')
const Persist = require('beepboop-persist')

module.exports = (config) => {
  var app = new EventEmitter()

  app.config = config
  app.log = require('./logger')(config.logging)
  app.messages = require('./messages/')

  app.log.debug('config: ', app.config)

  // Setup cache/data api
  app.cache = new Cashbox(deap({
    error: app.log.error.bind(app.log)
  }, app.config.cache))

  // Beep Boop persistence service
  app.persist = Persist({
    debug: true
  })

  // Setup webserver
  app.http = express()
  app.http.use(morgan(':date[iso] - :method :url :status :res[content-length] - :response-time ms'))

  // Root status route
  app.http.get('/', (req, res) => {
    res.json({
      status: 'ok'
    })
  })

  // Setup comments api and test routes
  app.comments = require('./comments/')(app)
  app.http.get('/comments', (req, res) => {
    app.comments.all((err, comments) => {
      if (err) {
        app.log.error('Error fetching comments: ', err.message)
        res.send(err.message)
      }

      res.json(comments)
    })
  })
  app.http.get('/comments/random', (req, res) => {
    app.comments.random((err, comment) => {
      if (err) {
        app.log.error('Error fetching comments: ', err.message)
        return res.send(err.message)
      }

      res.send(comment)
    })
  })
  app.http.get('/comments/new-random/:identifier', (req, res) => {
    app.comments.newComment(req.params.identifier, (err, comment) => {
      if (err) {
        app.log.error('Error fetching comments: ', err.message)
        return res.send(err.message)
      }

      res.send(comment)
    })
  })

  // mount persist and slack routers
  app.http.use('/persist', require('./persist/')(app))
  app.http.use('/slack', require('./slack/')(app))

  app.http.listen(app.config.port, (err) => {
    if (err) {
      return app.log.error(err)
    }

    app.log.info('http server started on port %s', app.config.port)
  })
}
