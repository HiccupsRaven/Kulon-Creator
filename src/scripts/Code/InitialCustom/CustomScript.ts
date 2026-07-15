export class CustomGame implements KulonMod {
  readonly id: string = "custom-game"

  game!: KulonGame

  job: KulonJob
  peers: KulonPeers
  socket: KulonSocket

  asset: KulonAsset
  audio: KulonAudio

  me: string

  constructor(config: IKulonModConfig, lib: IKulonModLib) {
    this.job = config.job
    this.socket = config.socket
    this.peers = config.peers

    this.asset = lib.asset
    this.audio = lib.audio

    this.me = config.me
  }

  setGame(game: KulonGame): void {
    this.game = game
  }

  destroy(): void | Promise<void> {}

  init(): void {}
}
