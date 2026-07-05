import { Bag } from "../Contents/Bag"
import Setting from "../Contents/Setting"
import { Hint, hintHasUnread } from "../Events/Hint"
import { IPhoneApp } from "../types/DBTypes"

const phonelist: IPhoneApp[] = [
  {
    id: "tutor_ongoing",
    g: [0],
    n: "PHONE_TUTOR",
    cl: { "0": "b-tutor-0", "1": "b-tutor-1", "2": "b-tutor-2" },
    ic: "fa-brands fa-readme",
    r(config) {
      config.classBefore?.destroy?.()
    }
  },
  {
    id: "hint",
    g: [2],
    n: "PHONE_HINT",
    ic: "fa-duotone fa-solid fa-sneaker-running",
    hasUnread: () => hintHasUnread(),
    async r(config) {
      new Hint(config).init()
    }
  },
  {
    id: "backpack",
    g: [1, 2],
    n: "PHONE_BACKPACK",
    ic: "fa-sharp-duotone fa-solid fa-backpack",
    r(config) {
      new Bag(config).init()
    }
  },
  {
    id: "setting",
    g: [0, 1, 2],
    n: "PHONE_SETTING",
    ic: "fa-sharp-duotone fa-solid fa-gear",
    r(config) {
      new Setting(config).init()
    }
  }
]

export default phonelist
