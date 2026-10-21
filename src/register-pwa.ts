// Registration is production-only, so editing the app does not cache development source.
// A new worker waits until old tabs close. Never force a reload over an unsaved transcript.
if (
  import.meta.env.PROD &&
  "serviceWorker" in navigator &&
  !("__TAURI_INTERNALS__" in window)
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL(`${import.meta.env.BASE_URL}sw.js`, location.href), {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        /* The app still works online when a browser blocks service workers. */
      });
  });
}
