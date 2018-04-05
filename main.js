const env = require('./lib/env')
const Discord = require('./lib/discord')
const Twitter = require('./lib/twitter')
const withHttp = require('./lib/http')

const config = env('config')

const discord = new Discord(env('discord'), config.storage)

const twitter = new Twitter(env('twitter'), config.screenName)

const formatDate = date => date && date.toUTCString().slice(5)

const statusReport = () =>
  `status:
started: ${formatDate(discord.startedAt)}
ping: ${discord.client.ping}
pid: ${process.pid}`

const serverReport = guild =>
  `server:
created at: ${formatDate(guild.createdAt)}`

discord.pipe(
  'ready',
  {server: 'Test Server', channel: 'bot'}
)

discord.pipe(
  [1, 2, 3],
  {server: 'Test Server', channel: 'bot'}
)

discord.pipe(
  twitter.avatar.bind(twitter),
  {server: 'Test Server', channel: 'bot'}
)

discord.pipe(
  onTweet => twitter.tweet(tweet => {
    console.log(tweet)
    onTweet({text: `...`})
  }),
  {server: 'Test Server', channel: 'bot'}
)

discord.commands({
  [/~server/]: message => message.reply(serverReport(message.guild)),
  [/~status/]: message => message.reply(statusReport()),
  [/~set\s+(.+?)\s*=\s*(.+)/]: (_, k, v) => discord.set(k, v),
  [/~get\s+(.+)/]: (message, k) => discord.get(k) && message.channel.send(discord.get(k))
})

discord.commands(config.admins, {
  [/~clear\s+(.+)/]: (message, id) =>
    message.channel.fetchMessages({after: id}).then(messages => {
      message.channel.bulkDelete(Array.from(messages.values()))
    }),
  [/~stop\s+(.+)/]: (_, pid) => pid === process.pid.toString() && process.exit()
})

withHttp(config.port || env('port') || 80, statusReport, discord.start.bind(discord))
