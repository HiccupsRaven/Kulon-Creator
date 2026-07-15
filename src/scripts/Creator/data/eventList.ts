import { IEventTypes } from "../types/CreatorTypes"

const EVENT_LIST: IEventTypes = [
  { id: "textMessage", ic: "message-dots", name: "Text Message", desc: "Play revealing text message to current player" },
  { id: "changeMap", ic: "map", name: "Change Map", desc: "Send player to certain map" },
  { id: "addStates", ic: "book", name: "Add States", desc: "Add flags to all players in the current session" },
  { id: "addClaims", ic: "gavel", name: "Add Claims", desc: "Add flags to current player and broadcast the new flags-holder to all players in the session" },
  { id: "removeStates", ic: "book", name: "Remove States & Claims", desc: "Remove flags from all players in the session" },
  { id: "addHint", ic: "key-skeleton", name: "Add Hint", desc: "Set new hint across the players in the session" },
  { id: "addItem", ic: "backpack", name: "Add Item", desc: "Add item to players shared inventory in the session" },
  { id: "teleport", ic: "person-from-portal", name: "Teleport", desc: "Move current player to certain coordinate" },
  { id: "walk", ic: "person-walking", name: "Walk", desc: "Set the current player to walk 1 tile to certain direction" },
  { id: "stand", ic: "person", name: "Stand", desc: "Set the current player to stand in the certain time" },
  { id: "choices", ic: "comments", name: "Choices", desc: "Give the current player choices to choose" },
  { id: "addLocalFlags", ic: "book", name: "Add Local States", desc: "Add flags to only current player without noticing any player" },
  { id: "removeLocalFlags", ic: "book", name: "Remove Local States", desc: "Remove flags from only current player without noticing any player" },
  { id: "customEvent", ic: "gamepad", name: "Custom Event", desc: "Set the current player to play your custom event" },
  { id: "backsongControl", ic: "music", name: "Background Music Controls", desc: "Control the background music for the current player" },
  { id: "playSound", ic: "music-note", name: "Play Sound", desc: "Play certain sound for the current player" },
  { id: "payout", ic: "credit-card", name: "Mission Complete", desc: "Set all players in the session to play the mission completed events and receiving the payout", keyOnly: true },
  { id: "missionBoard", ic: "clapperboard", name: "Mission Board", desc: "Umm.. just to open mission board?", keyOnly: true, disabled: true },
  { id: "lobby", ic: "network-wired", name: "Enter/Exit Lobby", desc: "Does nothing since players already connected to the session", keyOnly: true, disabled: true },
  { id: "jumpscare", ic: "ghost", name: "Jumpscare", desc: "Just to spawn a ghost and walk them across the screen in a few seconds", keyOnly: true },
  { id: "addNote", ic: "note-sticky", name: "Add Note", desc: "Add note item that can be read in the inventory to all players in the session" },
  { id: "readnote", ic: "note-sticky", name: "Read Current Note", desc: "Just to immediately reading the note for the current player", keyOnly: true },
  { id: "objectives", ic: "ballot-check", name: "Set Objective", desc: "Show objective text to all players in the session" },
  { id: "removeObjectives", ic: "ballot-check", name: "Remove Objective", desc: "Remove objective text to all players in the session" }
]

export default EVENT_LIST
