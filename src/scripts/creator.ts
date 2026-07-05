import "webfont-awesome-pro/scss/allstyles.scss"
import "../styles/creator.scss"
import { Dashboard } from "./Creator/Dashboard"
import { vfs } from "./lib/VirtualFileSystem"

async function startCreator(): Promise<void> {
  // const initializeDB = await idb.init()
  await vfs.init()
  // console.log(initializeDB)

  const dashboard = new Dashboard()
  dashboard.init()
}

window.onload = () => startCreator()
