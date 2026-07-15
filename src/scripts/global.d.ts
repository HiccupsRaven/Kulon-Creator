declare module "*.scss"
declare module "*.sass"
declare module "*.css"

declare interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: UserChoice
  prompt(): Promise<UserChoice>
}

declare interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}
