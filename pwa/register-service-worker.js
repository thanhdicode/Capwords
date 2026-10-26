if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => {
        // The app remains usable online when installation or SW registration is unavailable.
      });
  });
}
