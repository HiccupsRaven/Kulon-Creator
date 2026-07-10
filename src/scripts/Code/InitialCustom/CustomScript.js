/*IMPORTSTYLE*/

export class CustomGame {
  constructor(config) {
    this.id = "custom-game"

    this.job = config.job
    this.socket = config.socket
    this.peers = config.peers

    this.asset = config.asset
    this.audio = config.audio

    this.me = config.me
  }

  setGame(game) {
    this.game = game
  }

  destroy() {}

  init() {}
}
