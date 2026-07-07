export class CustomGame implements KulonMod {
  readonly id: string = "custom-game"

  game!: KulonGame

  me: string

  job: KulonJob

  peers: KulonPeers

  socket: KulonSocket

  constructor(config: IKulonModConfig) {
    this.me = config.me

    this.job = config.job

    this.socket = config.socket

    this.peers = config.peers
  }

  setGame(game: KulonGame): void {
    this.game = game
  }

  destroy(): void | Promise<void> {}

  init(): void {}
}
