import { IGameSettings } from "../Creator/types/CreatorTypes"
import db from "../data/db"
import MapList from "../data/MapList"
import { IGameObjectData, IMapList } from "../types/MapsTypes"

export default function SetNextMap(nextMap: IMapList, nextSettings: IGameSettings): void {
  const userIds = db.job.players?.map((usr) => usr.id) || null
  const userMe = db.me.id

  Object.keys(MapList).forEach((previousMap) => {
    delete MapList[previousMap]
  })
  Object.keys(nextMap).forEach((key) => {
    const clonedMap = JSON.parse(JSON.stringify(nextMap[key]))

    MapList[key] = {
      name: clonedMap.name,
      id: clonedMap.id,
      lowerSrc: clonedMap.lowerSrc,
      upperSrc: clonedMap.upperSrc,
      ambience: clonedMap.ambience,
      configObjects: clonedMap.configObjects,
      walls: clonedMap.walls || {},
      cutscenes: clonedMap.cutscenes || {},
      safeZone: clonedMap.safeZone,
      footstep: clonedMap.footstep,
      useWeather: clonedMap.useWeather
    }

    Object.values(MapList[key].configObjects).forEach((obj: IGameObjectData) => {
      obj.talk?.forEach((tlk) => {
        const reqs = tlk.required ? "required" : null
        if (reqs && userIds) {
          const hasTemplate = tlk[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            tlk[reqs] = tlk[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => tlk[reqs]?.push(fg))
        }
        tlk.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
      obj.drops?.forEach((drops) => {
        const reqs = drops.required ? "required" : null
        if (reqs && userIds) {
          const hasTemplate = drops[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            drops[reqs] = drops[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => drops[reqs]?.push(fg))
        }
        drops.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
    })

    Object.values(MapList[key].cutscenes).forEach((obj) => {
      obj.forEach((tlk) => {
        const reqs = tlk.required ? "required" : null
        if (reqs && userIds) {
          const hasTemplate = tlk[reqs]?.filter((fg) => fg.includes("{UID}"))
          const convertedTemplates: string[] = []
          hasTemplate?.forEach((fg) => {
            const txt = fg.replace("{UID}", "")
            userIds.forEach((uid) => convertedTemplates.push(`${txt}${uid}`))
            tlk[reqs] = tlk[reqs]?.filter((old_fg) => old_fg !== fg)
          })
          convertedTemplates.forEach((fg) => tlk[reqs]?.push(fg))
        }
        tlk.events.forEach((evt) => {
          if (userMe && (evt.type === "addStates" || evt.type === "removeStates")) {
            const hasTemplate = evt.states?.filter((fg) => fg.includes("{ME}"))
            const convertedTemplates: string[] = []
            hasTemplate?.forEach((fg) => {
              const txt = fg.replace("{ME}", "")
              convertedTemplates.push(`${txt}${userMe}`)
              evt.states = evt.states?.filter((old_fg) => old_fg !== fg)
            })
            convertedTemplates.forEach((fg) => evt.states?.push(fg))
          }
        })
      })
    })
  })

  const spawner = nextSettings.spawn!

  spawner.forEach((player, i) => {
    // Object.keys(MapList).forEach((k) => (MapList[k].configObjects.hero = heroConfig))
    Object.keys(MapList).forEach((k) => {
      if (!MapList[k].configObjects) MapList[k].configObjects = {}

      const npcId = i === 0 ? "hero" : `player_${i + 1}`

      if (player.map === MapList[k].id) {
        MapList[k].configObjects[npcId] = {
          type: "Person",
          x: player.x!,
          y: player.y!,
          direction: player.direction!,
          canControlled: i === 0,
          src: ["hero"]
        }
      } else {
        MapList[k].configObjects[npcId] = {
          type: "Person",
          x: -100,
          y: -100,
          direction: player.direction!,
          canControlled: i === 0,
          src: ["hero"]
        }
      }
    })
  })
}
