export class CustomGame {
  constructor(config) {
    this.id = "custom-game"

    this.me = config.me

    this.job = config.job

    this.socket = config.socket

    this.peers = config.peers
  }

  setGame(game) {
    this.game = game
  }

  destroy() {}

  init() {}
}
