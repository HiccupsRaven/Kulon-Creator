import { kel } from "../lib/kel"
import { IPMRaw } from "../types/DBTypes"

const OBJECTS_URL: string[] = []

let MOD_SCRIPT: string = "default value"

export function setModScript(scriptString: string): void {
  MOD_SCRIPT = scriptString
}

export async function loadModScript(): Promise<IPMRaw> {
  // const sourceCode = /* REAL THING */ MOD_SCRIPT

  const sourceCode = /* PLACEHOLDER TO TEST */ `function eroot() {
  return document.querySelector(".app");
}
const idAliases = ["id", "#"];
const childAliases = ["child", "e"];
const attrAliases = ["a", "attr"];
function getIdValue(cla) {
  for (const key of idAliases) {
    if (key in cla) return cla[key];
  }
  return void 0;
}
function getAttrValue(cla) {
  for (const key of attrAliases) {
    if (key in cla) return cla[key];
  }
  return void 0;
}
function getChildValue(cla) {
  for (const key of childAliases) {
    const k = key;
    if (key in cla) return Array.isArray(cla[k]) ? cla[k] : [cla[k]];
  }
  return void 0;
}
function kel(tagName, className, prop) {
  const el = document.createElement(tagName);
  idAliases.forEach((alias) => {
    if (prop?.[alias]) {
      const idVal = getIdValue({ [alias]: prop[alias] });
      if (idVal) el.id = idVal;
    }
  });
  if (className) el.className = className;
  attrAliases.forEach((alias) => {
    if (prop?.[alias]) {
      const attrVal = getAttrValue({ [alias]: prop[alias] });
      if (attrVal) {
        if (typeof attrVal === "object" && attrVal !== null) {
          Object.keys(attrVal).forEach((attribute) => {
            if (attrVal && attrVal[attribute] && typeof attrVal[attribute] === "string") {
              el.setAttribute(attribute, attrVal[attribute]);
            }
          });
        }
      }
    }
  });
  childAliases.forEach((alias) => {
    if (prop?.[alias]) {
      const childVal = getChildValue({ [alias]: prop[alias] });
      if (childVal) {
        childVal.forEach((childElement) => {
          if (typeof childElement === "string") {
            el.innerHTML += childElement;
          } else {
            el.append(childElement);
          }
        });
      }
    }
  });
  return el;
}
class Participant {
  constructor(id, username) {
    this.id = id;
    this.name.innerHTML = username;
    this.updateEgg();
    this.el.append(this.name, this.egg);
  }
  id;
  took = 0;
  el = kel("div", "player");
  name = kel("span", "name");
  egg = kel("span", "egg");
  get eggs() {
    return this.took;
  }
  updateEgg() {
    this.egg.innerHTML = this.took.toString();
  }
  addEgg(count = 1) {
    this.took += count;
    this.updateEgg();
  }
  get html() {
    return this.el;
  }
  destroy() {
    this.name.remove();
    this.egg.remove();
    this.el.remove();
  }
}
class CustomGame {
  id = "minigame/egghunt";
  game;
  job;
  socket;
  el = kel("div", "EggHunt");
  etime = kel("span", "egghunt-time");
  Participants = [];
  endTime;
  endInterval;
  sdate;
  stateManager;
  constructor(config, lib) {
    this.job = config.job;
    this.socket = config.socket;
    this.sdate = lib.sdate;
    this.stateManager = lib.stateManager;
  }
  createElement() {
    this.el.prepend(this.etime);
    eroot().append(this.el);
  }
  writePlayers() {
    this.job.players.forEach((player) => {
      const username = this.job.getUser(player.id).username;
      const participant = new Participant(player.id, username);
      this.Participants.push(participant);
      this.el.append(participant.html);
    });
  }
  addClaim(state, owner) {
    this.stateManager.add(state, owner);
    const participant = this.Participants.find((player) => player.id === owner);
    if (!participant) return;
    participant.addEgg(1);
  }
  setCustom(data) {
    const starttime = data;
    this.endTime = starttime + 1e3 * 60 * 3;
    this.updateTimeOut();
    this.endInterval = setInterval(() => this.updateTimeOut(), 1e3);
  }
  updateTimeOut() {
    const endTime = this.endTime;
    const remaintime = this.sdate.remain(endTime, true);
    if (!remaintime) {
      clearInterval(this.endInterval);
      this.endInterval = void 0;
      this.socket.send("endTime", {});
      return;
    }
    this.etime.innerHTML = remaintime;
  }
  setGame(game) {
    this.game = game;
  }
  destroy() {
    if (this.endInterval) {
      clearInterval(this.endInterval);
      this.endInterval = void 0;
    }
    this.Participants.forEach((player) => player.destroy());
    this.el.remove();
    return;
  }
  init(data) {
    this.createElement();
    this.writePlayers();
    this.setCustom(data);
  }
}
export {
  CustomGame
};`

  const blob = new Blob([sourceCode], { type: "text/javascript" })

  const url = URL.createObjectURL(blob)

  const module = await import(/* webpackIgnore: true */ url)

  return module
}

export function loadModStyle(styleString: string): void {
  const styleLink = kel("style")
  styleLink.id = "game-mod-style"
  styleLink.textContent = styleString

  document.head.appendChild(styleLink)
}

export function unloadMod(): void {
  const styleRel = document.getElementById("game-mod-style")
  if (styleRel) styleRel.remove()

  OBJECTS_URL.forEach((str) => URL.revokeObjectURL(str))
}
