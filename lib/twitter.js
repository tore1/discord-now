const Twit = require('twit')

const screenName = n => JSON.parse(`{"screen_name": "${n}"}`)

module.exports = class {
  constructor (config, screenName) {
    this.screenName = screenName
    this.client = new Twit(config)
    this.currentAvatar = null
  }

  checkAvatar (next) {
    this.client.get('users/show', screenName(this.screenName), (err, data) => {
      if (err) {
        console.error(`Twitter: ${err.toString()}`)
        next()
      } else {
        const newAvatar = data && data.profile_image_url && data.profile_image_url.replace('_normal', '')
        if (!this.currentAvatar && newAvatar) {
          this.currentAvatar = newAvatar
          this.lastAvatarUpdate = new Date()
          next({text: newAvatar})
        } else if (newAvatar && newAvatar !== this.currentAvatar) {
          this.currentAvatar = newAvatar
          this.lastAvatarUpdate = new Date()
          next({image: newAvatar})
        } else {
          next()
        }
      }
    })
  }

  avatar (onData) {
    this.checkAvatar(data => {
      onData(data)
      setTimeout(() => this.avatar(onData), 60 * 1000)
    })
  }

  tweet (onData) {
    this.client.get('users/show', screenName(this.screenName), (err, data) => {
      if (err) {
        console.error(`Twitter: ${err.toString()}`)
      } else {
        const twitterId = data.id_str
        this.client.stream('statuses/filter', {follow: twitterId}).on('tweet', tweet => {
          if (tweet.user.screen_name === this.screenName) {
            onData(tweet)
          }
        })
      }
    })
  }
}
