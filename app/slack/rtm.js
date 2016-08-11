const Botkit = require('botkit')
const BeepBoop = require('beepboop-botkit')

// Setup slack rtm connections w/ botkit & beepboop
module.exports = (app) => {
  var ambientCheck = require('./ambient-check')(app)

  var controller = Botkit.slackbot({
    retry: Infinity,
    logger: botkitLogger(app.log)
  })

  var beepboop = BeepBoop.start(controller, {
    debug: true,
    logger: beepboopLogger(app.log)
  })

  // Send a message to the user that added the bot right after it connects
  beepboop.on('botkit.rtm.started', function (bot, resource, meta) {
    var slackUserId = resource.SlackUserID

    if (meta.isNew && slackUserId) {
      app.log.info('welcoming user %s', slackUserId)
      bot.api.im.open({ user: slackUserId }, function (err, response) {
        if (err) {
          return app.log.error(err)
        }
        var dmChannel = response.channel.id
        bot.say({channel: dmChannel, text: 'Thanks for adding me to your team!'})
        bot.say({channel: dmChannel, text: '/invite me to a channel!'})
      })
    }
  })

  var atBot = ['direct_message', 'direct_mention', 'mention']
  var allMessages = ['direct_message', 'direct_mention', 'mention', 'ambient']

  controller.hears('comment', atBot, (bot, message) => {
    // filter out a matching slash command
    if (message.text === '/comment') {
      return
    }

    bot.startTyping(message)

    app.comments.newComment(message.team, (err, comment, commentId) => {
      if (err) {
        app.log.error(err.message)
      }

      bot.reply(message, comment || app.messages('NO_COMMENT'))
    })
  })

  controller.hears(['shrug', 'dunno', 'dont know', "don't know", 'no idea', 'idk', 'hmmm'], allMessages, (bot, message) => {
    // limit the amount of ambient responses
    if (!ambientCheck(message.team)) {
      return
    }

    bot.reply(message, ':thinking_face: ...')
    bot.startTyping(message)

    // make it seem like bot is typing a comment for a bit
    setTimeout(() => {
        bot.reply(message, app.messages('SHRUG_COMMENT'))
    }, 2000)
  })

  controller.hears('yahoo', allMessages, (bot, message) => {
    // limit the amount of ambient responses
    if (!ambientCheck(message.team)) {
      return
    }

    bot.reply(message, app.messages('YAHOO_COMMENT'))
    bot.startTyping(message)

    app.comment.newComment(message.team, (err, comment, commentId) => {
      if (err) {
        app.log.error(err.message)
      }

      // make it seem like bot is typing a comment for a bit
      setTimeout(() => {
        bot.reply(message, comment || app.messages('NO_COMMENT_INITIATED'))
      }, 2000)
    })
  })

  controller.hears(['great', 'geez', 'wow', 'genius', 'seriously', 'yeah right', 'whatever', 'totally', 'lmao'], ['ambient'], (bot, message) => {
    // limit the amount of ambient responses
    if (!ambientCheck(message.team)) {
      return
    }

    bot.reply(message, app.messages('SNARKY_COMMENT'))
    bot.startTyping(message)

    app.comments.newComment(message.team, (err, comment, commentId) => {
      if (err) {
        app.log.error(err.message)
      }
      // make it seem like bot is typing a comment for a bit
      setTimeout(() => {
        bot.reply(message, comment || app.messages('NO_COMMENT_INITIATED'))
      }, 2000)
    })
  })

  controller.hears(['ok', 'alright', 'just', 'still', 'agree', 'well,', 'team', 'basically', 'analysis', 'another', 'does', 'there', 'your'], ['ambient'], (bot, message) => {
    // limit the amount of ambient responses
    if (!ambientCheck(message.team)) {
      return
    }

    bot.reply(message, app.messages('USELESS_COMMENT'))
    bot.startTyping(message)

    app.comments.newComment(message.team, (err, comment, commentId) => {
      if (err) {
        app.log.error(err.message)
      }
      // make it seem like bot is typing a comment for a bit
      setTimeout(() => {
        bot.reply(message, comment || app.messages('NO_COMMENT_INITIATED'))
      }, 2000)
    })
  })

  controller.hears(['good one', 'nice', 'thanks', 'wow', 'thank you'], atBot, (bot, message) => {
    bot.reply(message, app.messages('THANKS'))
  })

  controller.hears(['help', 'what do you do'], atBot, (bot, message) => {
    bot.reply(message, app.messages('HELP'))
  })
}

function beepboopLogger (log) {
  return {
    debug: log.beepboop.bind(log),
    error: log.error.bind(log)
  }
}

function botkitLogger (log) {
  return {
    log: function (lvl) {
      var args = Array.prototype.slice.call(arguments, 1)
      // isolate botkit debug messages - chatty
      if (lvl === 'debug') {
        return
      }

      log.botkit.apply(log, args)
    }
  }
}
