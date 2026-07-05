import BagAPI from "../APIs/BagAPI"
import JobAPI from "../APIs/JobAPI"
import WaitingAPI from "../APIs/WaitingAPI"
import { IDB } from "../types/DBTypes"

const db: IDB = {
  provider: {},
  me: { username: "noname", access: [], id: "0", joined: 0, skin: {}, trophies: [] },
  bag: new BagAPI(),
  job: new JobAPI(),
  pmc: undefined,
  pmx: undefined,
  version: 0,
  onduty: 0,
  waiting: new WaitingAPI()
}
export default db
