import screenfull from "screenfull"

let isToggled: boolean = false

async function rotateScreen(): Promise<void> {
  if (screenfull.isFullscreen) {
    console.log("rotated")
    if (screen.orientation && "lock" in screen.orientation && typeof screen.orientation["lock"] === "function") {
      try {
        await screen.orientation["lock"]("landscape")
      } catch (_err) {
        // console.warn("Gagal rotate:", err)
      }
    }
  }
}

function listenToChange(): void {
  if (isToggled) return
  isToggled = true
  screenfull.on("change", async () => rotateScreen())
}

export function toggleFullScreen(): void {
  if (screenfull.isEnabled) {
    screenfull.toggle()
    listenToChange()
  }
}
