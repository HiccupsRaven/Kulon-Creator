import { db } from "../data/db"
import { getHero } from "../data/systemObjects"
import { work } from "../data/work"
import { DirectionType, ICloudItem, ICutscenes, IGameObjectData, IGameObjects, IGameSettings, IMapConfig, IMapList, IObjectEvent, IObjectTalk, ProjectResponse } from "../types/CreatorTypes"
import { toText } from "./gen"

const validDirections: DirectionType[] = ["left", "down", "right", "up"]
const validBGMControl: string[] = ["resume", "pause", "next", "previous"]

function hasDupeAlt(matrix: Array<string[] | undefined>): boolean {
  if (!Array.isArray(matrix)) return false
  return matrix.some((arr1, index1) => {
    if (!arr1) return false
    return matrix.some((arr2, index2) => {
      if (!arr2) return false
      if (index1 === index2) return false

      if (arr1.length !== arr2.length) return false

      return arr1.every((element) => arr2.includes(element))
    })
  })
}

export function validateEvent(data: IObjectEvent, events: IObjectEvent[], mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []
  if (data.type === "textMessage") {
    if (!data.text || !data.text.id || !data.text.en || data.text.id.length < 1 || data.text.en.length < 1) {
      errors.push(`Text field can't be empty<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "changeMap") {
    if (!data.map) {
      errors.push(`Destination map must be specified<br/><span class="mono">${prefix}</span>`)
    }

    const mapExists = work[data.map || "undefined"]
    if (!mapExists) {
      errors.push(`The selected map is not found on the current project<br/><span class="mono">${prefix}</span>`)
    }

    if (!data.x || !data.y || isNaN(data.x) || isNaN(data.y) || data.x >= Infinity || data.y >= Infinity) {
      errors.push(`Destination tiles [x,y] must be specified<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.direction || !validDirections.some((k) => data.direction === k)) {
      errors.push(`Destionation facing direction must be specified<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "addStates" || data.type === "addClaims" || data.type === "removeStates" || data.type === "addLocalFlags" || data.type === "removeLocalFlags") {
    const filteredStates = data.states?.filter((state) => state.length >= 1) || []

    if (filteredStates.length < 1) {
      errors.push(`States field can't be empty<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "addHint") {
    if (!data.id) {
      errors.push(`Hint ID can't be empty<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.idx) {
      errors.push(`Hint index can't be empty<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.text || !data.text.id || !data.text.en || data.text.id.length < 1 || data.text.en.length < 1) {
      errors.push(`Text field can't be empty<br/><span class="mono">${prefix}</span>`)
    }

    const filteredStates = data.states?.filter((state) => state.length >= 1) || []
    if (filteredStates.length < 1) {
      errors.push(`States field can't be empty<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "addItem") {
    if (!data.id) {
      errors.push(`Item ID must be specified<br/><span class="mono">${prefix}</span>`)
    }

    const itemExists = db.items.some((k) => k.id === data.id)
    if (!itemExists) {
      errors.push(`The selected item is not found on the current project<br/><span class="mono">${prefix}</span>`)
    }

    const validAmt = typeof data.amount === "number" && !isNaN(data.amount) && data.amount > -99999 && data.amount < 99999

    if (!validAmt) {
      errors.push(`Item amount must be minimum of -99999 and maximum of 99999<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "teleport") {
    if (!data.who) {
      errors.push(`Object must be specified<br/><span class="mono">${prefix}</span>`)
    }

    const tpOriIdx = events.findIndex((k) => k.n === data.n) ?? -1
    const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

    const changeMaps = events.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
    const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

    const npc = typeof work[changeMap || mapId]?.configObjects?.[data.who || "undefined"] !== "undefined"

    const objectExists = data.who === "hero" || npc

    if (!objectExists) {
      errors.push(`The selected object is not found on the certain selected map on the current project<br/><span class="mono">${prefix}</span>`)
    }

    if (!data.x || !data.y || isNaN(data.x) || isNaN(data.y) || data.x >= Infinity || data.y >= Infinity) {
      errors.push(`Destination tiles [x,y] must be specified<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.direction || !validDirections.some((k) => data.direction === k)) {
      errors.push(`Destionation facing direction must be specified<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "walk") {
    if (!data.walk) {
      errors.push(`Walk field must contains at least 1 walk direction<br/><span class="mono">${prefix}</span>`)
    }

    const walkEvents = (data.walk || []).filter((k) => k.direction && k.who)

    walkEvents.forEach((evt) => {
      if (!evt.who) {
        errors.push(`Person must be specified<br/><span class="mono">${prefix}</span>`)
      }

      const tpOriIdx = events.findIndex((k) => k.n === data.n) ?? -1
      const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

      const changeMaps = events.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
      const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

      const npc = work[changeMap || mapId]?.configObjects?.[evt.who || "undefined"]

      const objectExists = evt.who === "hero" ? getHero() : npc

      if (!objectExists) {
        errors.push(`The selected person is not found on the certain selected map on the current project<br/><span class="mono">${prefix}</span>`)
      }

      if (objectExists?.type !== "Person") {
        errors.push(`The selected object is not a Person/NPC<br/><span class="mono">${prefix}</span>`)
      }

      if (!evt.direction || !validDirections.some((k) => evt.direction === k)) {
        errors.push(`Walk direction must be specified<br/><span class="mono">${prefix}</span>`)
      }
    })
  } else if (data.type === "stand") {
    if (!data.who) {
      errors.push(`Person must be specified<br/><span class="mono">${prefix}</span>`)
    }

    const tpOriIdx = events.findIndex((k) => k.n === data.n) ?? -1
    const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

    const changeMaps = events.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
    const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

    const npc = work[changeMap || mapId]?.configObjects?.[data.who || "undefined"]

    const objectExists = data.who === "hero" ? getHero() : npc

    if (!objectExists) {
      errors.push(`The selected person is not found on the certain selected map on the current project<br/><span class="mono">${prefix}</span>`)
    }

    if (objectExists?.type !== "Person") {
      errors.push(`The selected object is not a Person/NPC<br/><span class="mono">${prefix}</span>`)
    }

    if (!data.direction || !validDirections.some((k) => data.direction === k)) {
      errors.push(`Stand facing direction must be specified<br/><span class="mono">${prefix}</span>`)
    }

    const validTime = typeof data.time === "number" && !isNaN(data.time) && data.time >= 1 && data.time < 10000

    if (!validTime) {
      errors.push(`Stand time must be minimum of 1 millisecond and maximum of 10 seconds<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "choices") {
    if (!data.text || !data.text.id || !data.text.en || data.text.id.length < 1 || data.text.en.length < 1) {
      errors.push(`Text field can't be empty<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.options || data.options.length < 1) {
      errors.push(`Choice must have at least 1 option<br/><span class="mono">${prefix}</span>`)
    }

    data.options?.forEach((opt, i) => {
      if (!opt.text || !opt.text.id || !opt.text.en || opt.text.id.length < 1 || opt.text.en.length < 1) {
        errors.push(`Option #${i + 1} text field can't be empty<br/><span class="mono">${prefix}</span>`)
      }
    })
  } else if (data.type === "backsongControl") {
    if (!validBGMControl.some((k) => k === data.action)) {
      errors.push(`The selected BGM control is not found<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "playSound") {
    if (!data.src) {
      errors.push(`Audio source must be specified<br/><span class="mono">${prefix}</span>`)
    }
    const fileExists = db.assets.find((k) => k.id === data.src)
    if (!fileExists) {
      errors.push(`Audio file is not found in current project<br/><span class="mono">${prefix}</span>`)
    }
    if (fileExists?.type !== "audio") {
      errors.push(`The selected source is not an audio file<br/><span class="mono">${prefix}</span>`)
    }

    if (data.which !== "sfx" && data.which !== "ui") {
      errors.push(`The sound type must be set to SFX or UI<br/><span class="mono">${prefix}</span>`)
    }
  } else if (data.type === "addNote") {
    if (!data.name) {
      errors.push(`The note name field can't be empty<br/><span class="mono">${prefix}</span>`)
    }
    if (!data.pages || data.pages.length < 1) {
      errors.push(`Note content must contains at least 1 page<br/><span class="mono">${prefix}</span>`)
    }

    data.pages?.forEach((k, i) => {
      if (!k.id || !k.en || k.id.length < 1 || k.en.length < 1) {
        errors.push(`Page #${i + 1} field can't be empty<br/><span class="mono">${prefix}</span>`)
      }
    })
  }
  // else if (data.type === "objectives") {
  //   if (!data.text || !data.text.id || !data.text.en || data.text.id.length < 1 || data.text.en.length < 1) {
  //     errors.push(`Text field can't be empty<br/><span class="mono">${prefix}</span>`)
  //   }
  // }

  return { errors, pass: errors.length < 1 }
}

export function validateEvents(data: IObjectEvent[], mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []

  data.forEach((event, i) => {
    const newPrefix = `${prefix} > Event #${i + 1}`

    const checked = validateEvent(event, data, mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateCutscene(data: IObjectTalk[], mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []

  const checkReqs = data.filter((k) => Array.isArray(k.required) && k.required.length >= 1).map((k) => k.required)

  if (hasDupeAlt(checkReqs)) {
    errors.push(`Duplicate required values<br/><span class="mono">${prefix}</span>`)
  }

  data.forEach((cutscene, i) => {
    const newPrefix = `${prefix} > Group Event #${i + 1}`

    const checked = validateEvents(cutscene.events, mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateCutscenes(data: ICutscenes, mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []

  Object.keys(data).forEach((k) => {
    const coors = k.split(",")

    const coorText = `Cutscene Space ${coors[0]}x ${coors[1]}y`

    const newPrefix = `${prefix} > ${coorText}`

    const checked = validateCutscene(data[k], mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateObject(data: IGameObjectData, mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []

  if (!data.name) {
    errors.push(`Object does not have a name<br/><span class="mono">${prefix}</span>`)
  }

  const addedPrefix = `${prefix}${data.name ? toText(" " + data.name) : ""}`

  if (!data.x || !data.y || isNaN(data.x) || isNaN(data.y) || data.x >= Infinity || data.y >= Infinity) {
    errors.push(`Object position tiles [x,y] must be specified<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.type === "Person" && (!data.direction || !validDirections.some((k) => data.direction === k))) {
    errors.push(`Person facing direction must be specified<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.type !== "Teleporter" && !data.src) {
    errors.push(`Object image source must be specified<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.src) {
    const sources = typeof data.src === "string" ? [data.src] : data.src

    const srcNotFound = sources.some((src) => !db.assets.some((k) => k.id === src))
    if (srcNotFound) {
      errors.push(`Some of object image sources are not found on the current project<br/><span class="mono">${addedPrefix}</span>`)
    }

    const srcNotImg = sources.some((src) => db.assets.some((k) => k.type === "audio" && k.id === src))
    if (srcNotImg) {
      errors.push(`Some of the selected sources are not an image<br/><span class="mono">${addedPrefix}</span>`)
    }
  }

  if (data.talk) {
    const newPrefix = `${addedPrefix} > On Interaction`

    const checked = validateCutscene(data.talk, mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  }

  if (data.drops) {
    const newPrefix = `${addedPrefix} > On Enemy Defeated`

    const checked = validateCutscene(data.drops, mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  }

  if (data.health && data.type === "Person" && (data.health < 1 || data.health > 100)) {
    errors.push(`Enemy health must be minimum of 1 and maximum of 100<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.type === "Teleporter") {
    if (!data.from?.down?.x || !data.from?.down?.y || isNaN(data.from.down.x) || isNaN(data.from.down.y) || data.from.down.x >= Infinity || data.from.down.y >= Infinity) {
      errors.push(`Teleporter object must have an interaction effect from the bottom <br/><span class="mono">${addedPrefix}</span>`)
    }

    if (!data.from?.up?.x || !data.from?.up?.y || isNaN(data.from.up.x) || isNaN(data.from.up.y) || data.from.up.x >= Infinity || data.from.up.y >= Infinity) {
      errors.push(`Teleporter object must have an interaction effect from the top <br/><span class="mono">${addedPrefix}</span>`)
    }

    if (!data.from?.left?.x || !data.from?.left?.y || isNaN(data.from.left.x) || isNaN(data.from.left.y) || data.from.left.x >= Infinity || data.from.left.y >= Infinity) {
      errors.push(`Teleporter object must have an interaction effect from the left <br/><span class="mono">${addedPrefix}</span>`)
    }

    if (!data.from?.right?.x || !data.from?.right?.y || isNaN(data.from.right.x) || isNaN(data.from.right.y) || data.from.right.x >= Infinity || data.from.right.y >= Infinity) {
      errors.push(`Teleporter object must have an interaction effect from the right <br/><span class="mono">${addedPrefix}</span>`)
    }
  }

  return { errors, pass: errors.length < 1 }
}

export function validateObjects(data: IGameObjects, mapId: string, prefix: string): ProjectResponse {
  const errors: string[] = []

  Object.keys(data).forEach((k, i) => {
    const newPrefix = `${prefix} > Object #${i + 1}`

    const checked = validateObject(data[k], mapId, newPrefix)

    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateMap(data: IMapConfig, prefix: string): ProjectResponse {
  const errors: string[] = []

  if (!data.name) {
    errors.push(`Map does not have a name<br/><span class="mono">${prefix}</span>`)
  }

  const addedPrefix = `${prefix}${data.name ? toText(" " + data.name) : ""}`

  if (!data.lowerSrc) {
    errors.push(`Map does not have a base image<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (!data.upperSrc) {
    errors.push(`Map does not have a layer image<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.lowerSrc) {
    const fileExists = db.assets.find((k) => k.id === data.lowerSrc)
    if (!fileExists) {
      errors.push(`Map base image source is not found on the current project<br/><span class="mono">${addedPrefix}</span>`)
    }

    if (fileExists?.type === "audio") {
      errors.push(`The selected source for map base image is not an image file<br/><span class="mono">${addedPrefix}</span>`)
    }
  }

  if (data.upperSrc) {
    const fileExists = db.assets.find((k) => k.id === data.upperSrc)
    if (!fileExists) {
      errors.push(`Map layer image source is not found on the current project<br/><span class="mono">${addedPrefix}</span>`)
    }

    if (fileExists?.type === "audio") {
      errors.push(`The selected source for map layer image is not an image file<br/><span class="mono">${addedPrefix}</span>`)
    }
  }

  if (!data.safeZone) {
    errors.push(`Map does not have a safe coordinate<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (data.ambience) {
    const fileExists = db.assets.find((k) => k.id === data.ambience)
    if (!fileExists) {
      errors.push(`Map ambience sound source is not found on the current project<br/><span class="mono">${addedPrefix}</span>`)
    }
  }

  if (data.footstep && data.footstep !== "a" && data.footstep !== "b") {
    errors.push(`Map footstep sound must be set to only In-door or Out-door<br/><span class="mono">${addedPrefix}</span>`)
  }

  const checkedObjects = validateObjects(data.configObjects, data.id, addedPrefix)
  if (checkedObjects.errors.length >= 1) errors.push(...checkedObjects.errors)

  const checkedScenes = validateCutscenes(data.cutscenes, data.id, addedPrefix)
  if (checkedScenes.errors.length >= 1) errors.push(...checkedScenes.errors)

  return { errors, pass: errors.length < 1 }
}

export function validateMaps(data: IMapList): ProjectResponse {
  const errors: string[] = []

  Object.keys(data).forEach((k, i) => {
    const prefix = `Map #${i + 1}`
    const checked = validateMap(data[k], prefix)
    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateItem(data: ICloudItem, prefix: string): ProjectResponse {
  const errors: string[] = []

  if (!data.name || !data.name.en || !data.name.id || data.name.id.length < 1 || data.name.en.length < 1) {
    errors.push(`Item does not have a name<br/><span class="mono">${prefix}</span>`)
  }

  const addedPrefix = `${prefix}${data.name.en ? toText(" " + data.name.en) : ""}`

  if (!data.desc || !data.desc.en || !data.desc.id || data.desc.id.length < 1 || data.desc.en.length < 1) {
    errors.push(`Item does not have a description<br/><span class="mono">${addedPrefix}</span>`)
  }

  if (!data.src) {
    errors.push(`Item does not have an image source<br/><span class="mono">${addedPrefix}</span>`)
  }

  const srcValid = db.assets.find((k) => k.id === data.src)
  if (!srcValid) {
    errors.push(`Item image source is not found on the current project<br/><span class="mono">${addedPrefix}</span>`)
  }
  if (srcValid?.type === "audio") {
    errors.push(`The selected source is not an image<br/><span class="mono">${addedPrefix}</span>`)
  }

  return { errors, pass: errors.length < 1 }
}
export function validateItems(data: ICloudItem[]): ProjectResponse {
  const errors: string[] = []

  data.forEach((k, i) => {
    const prefix = `Managements > Items > #${i + 1}`
    const checked = validateItem(k, prefix)
    if (checked.errors.length >= 1) errors.push(...checked.errors)
  })

  return { errors, pass: errors.length < 1 }
}

export function validateSettings(data: IGameSettings, isTest?: boolean): ProjectResponse {
  const errors: string[] = []

  const prefix: string = "Game Settings"

  if (!data.project || data.project.length < 1) {
    errors.push(`Project Name field can't be empty<br/><span class="mono">${prefix} > General > Project Name</span>`)
  }

  data.spawn?.forEach((k, i) => {
    const pn = i + 1
    const player = `Player ${pn}`

    if (isTest) {
      if (!k.x || !k.y || isNaN(k.x) || isNaN(k.y) || k.x >= Infinity || k.y >= Infinity) {
        errors.push(`The Initial Spawn Tiles [x,y] must be specified for ${player}<br/><span class="mono">${prefix} > Spawn > P${pn}</span>`)
      }

      if (!k.map || k.map.length < 1) {
        errors.push(`The Initial Spawn Map must be specified for ${player}<br/><span class="mono">${prefix} > Spawn > P${pn}</span>`)
      }

      if (!k.direction || !validDirections.some((direction) => k.direction === direction)) {
        errors.push(`The Initial Spawn Facing Direction must be specified for ${player}<br/><span class="mono">${prefix} > Spawn > P${pn}</span>`)
      }
    }

    if (k.map) {
      const mapExists = work[k.map || "undefined"]
      if (!mapExists) {
        errors.push(`The Initial Spawn Map for ${player} is not found on the current project<br/><span class="mono">${prefix} > Spawn > P${pn}</span>`)
      }
    }
  })

  if (!isTest) return { errors, pass: errors.length < 1 }

  if (!data.name || !data.name.id || !data.name.en || data.name.id.length < 1 || data.name.en.length < 1) {
    errors.push(`Server Name field can't be empty<br/><span class="mono">${prefix} > General > Server Name</span>`)
  }

  if (!data.desc || !data.desc.id || !data.desc.en || data.desc.id.length < 1 || data.desc.en.length < 1) {
    errors.push(`Server Description field can't be empty<br/><span class="mono">${prefix} > General > Server Description</span>`)
  }

  if (!data.type || data.type < 1 || data.type > 2) {
    errors.push(`Server Type must be specified<br/><span class="mono">${prefix} > General > Server Type</span>`)
  }

  if (!data.mode || data.mode < 1 || data.mode > 2) {
    errors.push(`Game Mode must be specified<br/><span class="mono">${prefix} > General > Game Mode</span>`)
  }

  if (!data.ready || data.ready < 1 || data.ready > 2) {
    errors.push(`Server Ready must be specified<br/><span class="mono">${prefix} > General > Server Ready</span>`)
  }

  if (!data.min || data.min < 1 || data.min > 12) {
    errors.push(`Minimum Player can be only set to 1 - 12<br/><span class="mono">${prefix} > Players > Min Player</span>`)
  }

  if (!data.max || data.max < 1 || data.max > 12) {
    errors.push(`Maximum Player can be only set to 1 - 12<br/><span class="mono">${prefix} > Players > Max Player</span>`)
  }

  if (data.min && data.max && data.min > data.max) {
    errors.push(`Min Player must be less than Max Players<br/><span class="mono">${prefix} > Players > Min Player</span>`)
  }

  if (typeof data.price !== "number" || data.price < 0 || data.price > 2048) {
    errors.push(`Entry Fee can be only set to 0 - 2048<br/><span class="mono">${prefix} > Pricing & Payout > Entry Fee</span>`)
  }

  if (!data.payout || !data.payout[0] || !data.payout[1]) {
    errors.push(`Payout Hexsa or Payout Payout Token can't be empty<br/><span class="mono">${prefix} > Pricing & Payout > Payout</span>`)
  }

  if (data.payout?.[0] && (data.payout[0] < 1 || data.payout[0] > 32)) {
    errors.push(`Payout Hexsa can be only set to 1 - 32<br/><span class="mono">${prefix} > Pricing & Payout > Payout: Hexsa</span>`)
  }

  if (data.payout?.[1] && (data.payout[1] < 1 || data.payout[1] > 64)) {
    errors.push(`Payout Token can be only set to 1 - 64<br/><span class="mono">${prefix} > Pricing & Payout > Payout: Token</span>`)
  }

  const filteredReqs = data.reqs?.filter((state) => state.length >= 1) || []

  if (filteredReqs.length < 1) {
    errors.push(`State Requirements field can't be empty<br/><span class="mono">${prefix} > Gameplay > State Requirements</span>`)
  }

  return { errors, pass: errors.length < 1 }
}
