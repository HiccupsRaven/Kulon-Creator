import SaveList from "../data/SaveList"
import { checkMissionEnd } from "../manager/WorkWorld"

export const StateManager = {
  add: (state: string, value: boolean | string): void => {
    SaveList[state] = value
    checkMissionEnd()
  },
  remove: (state: string): void => {
    SaveList[state] = false
    delete SaveList[state]
  }
}
