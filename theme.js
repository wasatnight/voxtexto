(() => {
  const key = "voxtexto-theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;
  try { preference = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  const explicit = () => preference === "dark" || preference === "light";
  function apply() {
    const dark = explicit() ? preference === "dark" : system.matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#16151f" : "#f8f8fc");
  }
  apply();
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-theme-toggle]")) return;
    preference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(key, preference); } catch { /* Keep this session usable. */ }
    apply();
  });
  system.addEventListener("change", () => { if (!explicit()) apply(); });
  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) { preference = event.newValue; apply(); }
  });
})();
