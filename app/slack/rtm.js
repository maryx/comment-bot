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

  controller.hears(['comment', 'say something', 'hey'], atBot, (bot, message) => {
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

  controller.hears('spam', allMessages, (bot, message) => {
      bot.reply(message, ':exclamation: ARE YOU READY?!?!? :exclamation:')
      bot.reply(message, ':exclamation::exclamation::exclamation: *ARE YOU READY?!?!?* :exclamation::exclamation::exclamation:')
      var messageCount = 0
      var interval = setInterval(function() {
          bot.startTyping(message)
          app.comments.newComment(message.team, (err, comment, commentId) => {
              if (err) {
                  app.log.error(err.message)
              }
              bot.reply(message, ':rotating_light: :loudspeaker: :exclamation: :white_check_mark: :zap: :bangbang: :eight_spoked_asterisk: :heavy_check_mark: :soon: :mega: :clapping: :ballot_box_with_check: :pikachu: :beepbooping:')
              bot.reply(message, comment || app.messages('NO_COMMENT_INITIATED'))
              messageCount += 1
              if (messageCount >= 10) {
                  clearInterval(interval)
              }
          })
      }, 2000)
  })

  controller.hears(['420', 'weed', 'colorado', 'farm'], allMessages, (bot, message) => {
    bot.reply(message, ':ok_hand::weed::ok_hand::eyes::dank_leaf::eyes::ok_hand::eyes::ok_hand::greg_in_colorado: good shit go౦ԁ sHit:ok_hand: thats :heavy_check_mark: some good:bong::ok_hand:shit right:ok_hand::greg_in_colorado:there:ok_hand::ok_hand::ok_hand: right:heavy_check_mark:there :heavy_check_mark::heavy_check_mark:if i do ƽaү so my self :100: i say so :100: thats what im talking about right there right there (chorus: ʳᶦᵍʰᵗ ᵗʰᵉʳᵉ) mMMMMᎷМ:100: :ok_hand::ok_hand: :ok_hand:НO0ОଠOOOOOОଠଠOoooᵒᵒᵒᵒᵒᵒᵒᵒᵒ:ok_hand: :weed::ok_hand: :dank_leaf: :100: :ok_hand: :eyes: :eyes: :420: :ok_hand::ok_hand:Good shit')
  })

  controller.hears('yahoo', allMessages, (bot, message) => {
    // limit the amount of ambient responses
    if (!ambientCheck(message.team)) {
      return
    }

    bot.reply(message, app.messages('YAHOO_COMMENT'))
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
