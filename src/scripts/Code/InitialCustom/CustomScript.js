export class CustomGame {
  constructor(config, lib) {
    this.id = "custom-game"

    this.job = config.job
    this.socket = config.socket
    this.peers = config.peers

    this.asset = lib.asset
    this.audio = lib.audio

    this.me = config.me
  }

  setGame(game) {
    this.game = game
  }

  destroy() {}

  init() {}
}
