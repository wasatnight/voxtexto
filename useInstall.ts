import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function useInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(
        media.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    update();
    const before = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const after = () => {
      setInstalled(true);
      setPrompt(null);
      setShowInstall(false);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", after);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", after);
      media.removeEventListener("change", update);
    };
  }, []);
  async function install() {
    if (!prompt) {
      setShowInstall(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }
  return {
    installed,
    showInstall,
    setShowInstall,
    install,
    native: "__TAURI_INTERNALS__" in window || Boolean(window.voxDesktop),
  };
}
