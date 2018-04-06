const env = require('./lib/env')
const Discord = require('./lib/discord')
const Twitter = require('./lib/twitter')
const withHttp = require('./lib/http')

// Requires env/config.json
const config = env('config') || {}

// Requires env/storage.json
const storage = env('storage') || {}

// Requires env/discord.txt
const discord = new Discord(env('discord'), storage)

// Sending a message to a channel on first ready event
discord.pipe(
  'ready',
  {server: 'Test Server', channel: 'bot'}
)

// Sending multiple messages to a channel on first ready event
discord.pipe(
  [1, 2, 3],
  {server: 'Test Server', channel: 'bot'}
)

if (config.screenName) {
  // Requires env/twitter.json, watching config.screenName account
  const twitter = new Twitter(env('twitter'), config.screenName)

  // Sending twitter avatars to a channel
  discord.pipe(
    twitter.avatar.bind(twitter),
    {server: 'Test Server', channel: 'bot'}
  )

  // Sending tweets to a channel
  discord.pipe(
    onTweet => twitter.tweet(tweet =>
      onTweet({text: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`})
    ),
    {server: 'Test Server', channel: 'bot'}
    // ^ use offline to only send when a user is offline
  )
}

// Bot status report, for status command and HTTP
const statusReport = () =>
  `status:
started: ${discord.startedAt.toUTCString().slice(5)}
ping: ${Math.round(discord.client.ping)}
pid: ${process.pid}`

// Server info for server command
const serverReport = guild =>
  `server:
created at: ${guild.createdAt.toUTCString().slice(5)}`

// Regular commands
discord.commands({
  [/~status/]: message => message.reply(statusReport()),
  [/~server/]: message => message.reply(serverReport(message.guild)),
  [/~set\s+(.+?)\s*=\s*(.+)/]: (_, k, v) => discord.set(k, v),
  [/~get\s+(.+)/]: (message, k) => discord.get(k) && message.channel.send(discord.get(k))
})

// Commands only available to config.admins
discord.commands(config.admins, {
  [/~clear\s+(.+)/]: (message, id) =>
    message.channel.fetchMessages({after: id}).then(messages => {
      message.channel.bulkDelete(Array.from(messages.values())).catch(console.log)
    }).catch(console.log),
  [/~stop\s+(.+)/]: (_, pid) => pid === process.pid.toString() && process.exit()
})

// Start HTTP server and the bot
withHttp(config.port || env('port') || 80, statusReport, discord.start.bind(discord))
