import { Platform } from "react-native";

export function blurActiveElementOnWeb() {
  if (Platform.OS !== "web" || typeof document === "undefined" || typeof HTMLElement === "undefined") {
    return;
  }

  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}
