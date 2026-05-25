/**
 * After a new deploy, cached entry JS may request old hashed chunks (404).
 * Reload once so the browser picks up the current HTML + asset manifest.
 */
export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  const reloadOnce = () => {
    const key = "share-snap:chunk-reload";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.location.reload();
  };

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnce();
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "";
    if (
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed")
    ) {
      event.preventDefault();
      reloadOnce();
    }
  });
}
