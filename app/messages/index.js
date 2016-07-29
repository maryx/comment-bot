'use strict'

var messages = require('./messages')
var inject = require('./inject')

module.exports = function (key, params) {
  key = (key || '').toUpperCase()

  var value = messages[key]

  if (!value) {
    return 'Someone programmed me incorrectly...'
  }

  if (Array.isArray(value)) {
    value = value[Math.floor(Math.random() * value.length)]
  }

  return params === undefined ? value : inject(value, params)
}
