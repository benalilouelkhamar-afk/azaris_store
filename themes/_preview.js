/* Shared helper for theme previews: renders products into [data-grid] using window.CARD(p, i) */
(function () {
  const P = window.PRODUCTS, S = window.STORE;
  const money = (n) => n.toLocaleString("fr-FR") + " " + S.currency;
  const off = (p) => Math.round((1 - p.price / p.oldPrice) * 100);
  window.H = { money, off };
  document.querySelectorAll("[data-grid]").forEach((g) => {
    const n = +(g.dataset.count || P.length);
    const list = g.dataset.cat ? P.filter((p) => p.category === g.dataset.cat) : P;
    g.innerHTML = list.slice(0, n).map((p, i) => window.CARD(p, i)).join("");
  });
  document.querySelectorAll("[data-img]").forEach((el) => {
    const p = P.find((x) => x.id === el.dataset.img);
    if (p) el.src = p.images[+(el.dataset.i || 0)];
  });
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" && !t.dataset.f) { t.dataset.f = 1; t.style.opacity = 0; }
  }, true);
})();
