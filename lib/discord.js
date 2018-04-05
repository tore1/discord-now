const async = require('async')
const Discord = require('discord.js')

let pipeIds = 0

module.exports = class {
  constructor (token, storage = {}) {
    this.token = token
    this.client = new Discord.Client()
    this.readyChannels = {}
    this.readyActions = []
    this.messageActions = []
    this.storage = storage
  }

  set (k, v) {
    this.storage[k] = v
  }

  get (k) {
    return this.storage[k]
  }

  getChannels (checkServer, checkChannel) {
    const channels = []
    for (const server of this.client.guilds.filterArray(checkServer)) {
      for (const channel of server.channels.filterArray(checkChannel)) {
        channels.push(channel)
      }
    }
    return channels
  }

  pipe (what, where) {
    const pipeId = ++pipeIds
    if (Array.isArray(what)) {
      this.readyActions.push(() => {
        for (const channel of this.getChannels(s => s.name === where.server, c => c.name === where.channel)) {
          if (!this.readyChannels[`${channel.id}-${pipeId}`]) {
            async.eachSeries(what, (e, next) => {
              channel.send(e.toString()).then(() => next()).catch(err => console.error(`Discord: ${err.toString()}`))
            }, () => {
              this.readyChannels[`${channel.id}-${pipeId}`] = true
            })
          }
        }
      })
    } else if (typeof what === 'string') {
      this.readyActions.push(() => {
        for (const channel of this.getChannels(s => s.name === where.server, c => c.name === where.channel)) {
          if (!this.readyChannels[`${channel.id}-${pipeId}`]) {
            this.readyChannels[`${channel.id}-${pipeId}`] = true
            channel.send(what).catch(err => console.error(`Discord: ${err.toString()}`))
          }
        }
      })
    } else if (typeof what === 'function') {
      this.readyActions.push(() => {
        for (const channel of this.getChannels(s => s.name === where.server, c => c.name === where.channel)) {
          if (!this.readyChannels[`${channel.id}-${pipeId}`]) {
            this.readyChannels[`${channel.id}-${pipeId}`] = true
            what(data => {
              if (data && data.text) {
                if (where.offline) {
                  this.client.fetchUser(where.offline).then(user => {
                    if (user.presence.status === 'offline') {
                      channel.send(data.text).catch(err => console.error(`Discord: ${err.toString()}`))
                    }
                  })
                } else {
                  channel.send(data.text).catch(err => console.error(`Discord: ${err.toString()}`))
                }
              } else if (data && data.image) {
                channel.send(new Discord.Attachment(data.image))
                  .catch(err => console.error(`Discord: ${err.toString()}`))
              }
            })
          }
        }
      })
    }
  }

  commands (admins, map) {
    if (!map) {
      map = admins
      admins = null
    }
    this.messageActions.push(message => {
      if (admins && !admins.includes(message.author.tag)) {
        return
      }
      try {
        for (const command in map) {
          const match = message.content.trim().match(new RegExp(`^${command.slice(1, -1)}$`))
          if (match) {
            map[command](message, ...match.slice(1))
            return
          }
        }
      } catch (err) {
        console.error(`Discord: ${err.toString()}`)
      }
    })
  }

  start () {
    this.client.on('ready', () => {
      console.info(`Discord: ${this.client.user.tag} client is ready`)
      if (!this.startedAt) {
        this.startedAt = new Date()
      }
      for (const action of this.readyActions) {
        action()
      }
    })
    this.client.on('message', message => {
      // No self replies
      if (message.author.tag === this.client.user.tag) {
        return
      }
      for (const action of this.messageActions) {
        action(message)
      }
    })
    this.client.login(this.token)
  }
}
