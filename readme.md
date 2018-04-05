Basic [discord](https://discordapp.com/developers) bot that can be deployed on [now.sh](https://now.sh/). OSS/free plan is ok, except for voice support ([ffmpeg-binaries](https://www.npmjs.com/package/ffmpeg-binaries) requires up to 50MB per some files).

## Features
* Piping twitter avatars into channels.
* Piping tweets into channels.
* Key-value replies.
* Server info.
* Bot status report and HTTP endpoint.
* Admin commands: clearing channels, stopping orphan bot instances.

## Usage
* Create `env/discord.txt` (discord bot token), `env/twitter.json` ([twit](https://github.com/ttezel/twit) options, for twitter features), etc.
* `sh now local` : deploy locally (use `sudo` or `port` environment variable if needed, do `npm i` first to install dependencies).
* `sh now stop` : stop all running [now](https://zeit.co/) instances.
* `sh now deploy` : deploy on [now](https://zeit.co/).
