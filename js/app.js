(function () {
  "use strict";
  const S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("fr-FR") + " " + S.currency;
  const off = (p) => Math.round((1 - p.price / p.oldPrice) * 100);
  const byId = (id) => P.find((p) => p.id === id);
  const typeLabel = (p) => (p.category === "shoes" ? "Souliers" : "Sabots custom");
  const waLink = (text) => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TINTS = ["#e6e9e2", "#ece6dc", "#e3e7ea", "#e9e4e9", "#efe7d9", "#e1e9e6", "#f0e3e3"];
  const SEG = [{ id: "all", label: "Tout" }, { id: "shoes", label: "Souliers" }, { id: "sandals", label: "Sabots custom" }];

  /* ---------- images + fallback ---------- */
  function placeholder(name, tint) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='${tint || "#e4e8e1"}'/><text x='200' y='212' fill='#6b7a73' font-family='Arial,sans-serif' font-weight='700' font-size='26' text-anchor='middle'>${esc(name)}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function img(src, name, cls = "", alt = "", tint = "") {
    return `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy" data-name="${esc(name)}" data-tint="${tint}">`;
  }
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" && "name" in t.dataset && !t.src.startsWith("data:")) t.src = placeholder(t.dataset.name, t.dataset.tint);
  }, true);
  P.forEach((p, i) => (p.tint = TINTS[i % TINTS.length]));

  /* ---------- brand, links, contact ---------- */
  $$("[data-brand]").forEach((el) => (el.textContent = S.name));
  $(".logo-mark").textContent = S.name.charAt(0);
  $("#year").textContent = new Date().getFullYear();
  const sizeHelp = waLink(`Bonjour ${S.name}, pouvez-vous m'aider à choisir ma pointure ?`);
  ["#heroWa", "#footGuide", "#mGuide"].forEach((s) => ($(s).href = sizeHelp));
  $("#faqWa").href = waLink(`Bonjour ${S.name}, j'ai une question.`);
  $("#waFloat").href = waLink(`Bonjour ${S.name} !`);
  const waFmt = "+" + S.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  const contact = [`<a href="${waLink()}" target="_blank" rel="noopener">WhatsApp ${waFmt}</a>`];
  if (S.email) contact.push(`<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`);
  [["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"]].forEach(([k, l]) => { if (S[k]) contact.push(`<a href="${esc(S[k])}" target="_blank" rel="noopener">${l}</a>`); });
  contact.push("<span>Réponse rapide, 7j/7</span>");
  $("#footContact").insertAdjacentHTML("beforeend", contact.join(""));

  /* ---------- hero tiles ---------- */
  const hA = byId("atlass-98"), hB = byId("naruto");
  $("#heroImgA").innerHTML = img(hA.images[0], hA.name, "", hA.name, hA.tint);
  $("#heroImgB").innerHTML = img(hB.images[0], hB.name, "", hB.name, hB.tint);
  $$("[data-open]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); openModal(el.dataset.open); }));

  /* ---------- marquee ---------- */
  const mq = P.map((p) => `<span>${esc(p.name)}</span>`).join("");
  $("#marquee").innerHTML = mq + mq;

  /* ---------- header ---------- */
  addEventListener("scroll", () => $("#header").classList.toggle("scrolled", scrollY > 10), { passive: true });
  $("#menuBtn").addEventListener("click", () => { $("#nav").classList.toggle("open"); $("#menuBtn").classList.toggle("open"); });
  $("#nav").addEventListener("click", () => { $("#nav").classList.remove("open"); $("#menuBtn").classList.remove("open"); });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-filter]");
    if (a) { filter = a.dataset.filter; renderFilters(); renderGrid(); }
  });

  /* ---------- shop ---------- */
  let filter = "all";
  function renderFilters() {
    $("#filters").innerHTML = SEG.map((c) => {
      const n = c.id === "all" ? P.length : P.filter((p) => p.category === c.id).length;
      return `<button role="tab" data-f="${c.id}" aria-selected="${c.id === filter}" class="${c.id === filter ? "on" : ""}">${c.label}<small>${n}</small></button>`;
    }).join("");
  }
  function card(p) {
    return `<article class="card reveal" data-id="${p.id}" tabindex="0" aria-label="${esc(p.name)}, ${money(p.price)}">
      <div class="card-media" style="--tint:${p.tint}">
        ${img(p.images[0], p.name, "main", p.name, p.tint)}
        ${img(p.images[1] || p.images[0], p.name, "alt", "", p.tint)}
        <span class="badge">-${off(p)}%</span>
        ${p.stock <= 25 ? `<span class="low">Plus que ${p.stock}</span>` : ""}
      </div>
      <div class="card-body">
        <div>
          <div class="card-type">${typeLabel(p)}</div>
          <h3 class="card-name">${esc(p.name)}</h3>
          <div class="price-row"><span class="price">${money(p.price)}</span><s>${money(p.oldPrice)}</s></div>
        </div>
        <span class="plus" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
      </div>
    </article>`;
  }
  function renderGrid() {
    const list = filter === "all" ? P : P.filter((p) => p.category === filter);
    $("#grid").innerHTML = list.map(card).join("");
    $$("#grid .card").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); setTimeout(() => (el.style.transitionDelay = ""), 1200); });
  }
  $("#filters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { filter = b.dataset.f; renderFilters(); renderGrid(); } });
  $("#grid").addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); });
  $("#grid").addEventListener("keydown", (e) => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); } });

  /* ---------- spotlight (quick buy) ---------- */
  (function spotlight() {
    const p = byId("shadow-step");
    let sz = null;
    $("#spot").innerHTML = `
      <div class="spot-media">${img(p.images[0], p.name, "", p.name, p.tint)}<span class="badge">-${off(p)}%</span></div>
      <div class="spot-info">
        <span class="kicker">Le modèle du moment</span>
        <h2>${esc(p.name)}</h2>
        <p>${esc(p.desc)}</p>
        <div class="price-row"><span class="price">${money(p.price)}</span><s>${money(p.oldPrice)}</s></div>
        <div class="m-label"><span>Choisissez votre pointure</span></div>
        <div class="sizes" id="spotSizes">${p.sizes.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join("")}</div>
        <div class="m-error" id="spotErr"></div>
        <div class="spot-actions">
          <button class="btn btn-dark" id="spotBuy">Ajouter au panier</button>
          <button class="btn btn-ghost" id="spotMore">Voir toutes les photos</button>
        </div>
      </div>`;
    $("#spotSizes").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      sz = +b.dataset.size; $$("#spotSizes button").forEach((x) => x.classList.toggle("on", x === b)); $("#spotErr").textContent = "";
    });
    $("#spotBuy").addEventListener("click", () => {
      if (!sz) { $("#spotErr").textContent = "Choisissez d'abord votre pointure."; shake($("#spotSizes")); return; }
      addToCart(p.id, sz, 1); toast(`${p.name} · T.${sz} ajouté au panier`);
    });
    $("#spotMore").addEventListener("click", () => openModal(p.id));
  })();

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.08 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- cart ---------- */
  const KEY = "azaris_cart_v1";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((i) => byId(i.id) && i.qty > 0);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} };
  const subtotal = () => cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
  function addToCart(id, size, qty) {
    const ex = cart.find((i) => i.id === id && i.size === size);
    if (ex) ex.qty = Math.min(10, ex.qty + qty); else cart.push({ id, size, qty });
    save(); renderCart();
    const b = $("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  function renderCart() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $("#cartCount").textContent = n;
    const box = $("#cartItems");
    if (!cart.length) {
      box.innerHTML = `<div class="empty"><div class="empty-ico"><svg viewBox="0 0 24 24"><path d="M4 7h16l-1.4 11.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg></div><h4>Votre panier est vide</h4><p>Trouvez la paire qui vous ressemble.</p><button class="btn btn-dark" id="emptyShop">Voir les modèles</button></div>`;
      $("#emptyShop").addEventListener("click", () => { closeAll(); location.hash = "shop"; });
    } else {
      box.innerHTML = cart.map((i, k) => {
        const p = byId(i.id);
        return `<div class="ci">
          ${img(p.images[0], p.name, "", p.name, p.tint)}
          <div><h4>${esc(p.name)}</h4><small>Pointure ${i.size}</small>
            <div class="qty"><button data-dec="${k}" aria-label="Moins">−</button><span>${i.qty}</span><button data-inc="${k}" aria-label="Plus">+</button></div></div>
          <div class="ci-right"><b>${money(p.price * i.qty)}</b><button class="ci-del" data-del="${k}">Retirer</button></div>
        </div>`;
      }).join("");
    }
    const sub = subtotal(), ship = cart.length ? S.shippingFee : 0;
    $("#cartSub").textContent = money(sub);
    $("#cartShip").textContent = ship ? money(ship) : "Offerte";
    $("#cartTotal").textContent = money(sub + ship);
    $("#coTotal").textContent = money(sub + ship);
    $("#drawerTitle").textContent = n ? `Panier · ${n}` : "Panier";
    $("#coSummary").innerHTML = cart.map((i) => { const p = byId(i.id); return `<div><span>${esc(p.name)} · T.${i.size} × ${i.qty}</span><b>${money(p.price * i.qty)}</b></div>`; }).join("");
    if ($("#checkout").classList.contains("hidden")) $("#cartFoot").classList.toggle("hidden", !cart.length);
  }
  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.inc) cart[+t.dataset.inc].qty = Math.min(10, cart[+t.dataset.inc].qty + 1);
    if (t.dataset.dec) { const i = cart[+t.dataset.dec]; i.qty--; if (i.qty < 1) cart.splice(+t.dataset.dec, 1); }
    if (t.dataset.del) cart.splice(+t.dataset.del, 1);
    save(); renderCart();
  });

  /* ---------- sheets ---------- */
  function openSheet(el) {
    $$(".sheet.open").forEach((s) => s !== el && s.classList.remove("open"));
    el.classList.add("open"); el.setAttribute("aria-hidden", "false");
    $("#scrim").classList.add("open"); document.body.classList.add("lock");
  }
  function closeAll() {
    $$(".sheet").forEach((s) => { s.classList.remove("open"); s.setAttribute("aria-hidden", "true"); });
    $("#scrim").classList.remove("open"); document.body.classList.remove("lock");
  }
  function openCart(checkout) {
    if (checkout && !cart.length) checkout = false;
    $("#cartView").classList.toggle("hidden", !!checkout);
    $("#checkout").classList.toggle("hidden", !checkout);
    $("#cartFoot").classList.toggle("hidden", !!checkout || !cart.length);
    renderCart();
    if (checkout) $("#drawerTitle").textContent = "Livraison";
    openSheet($("#drawer"));
  }
  $("#scrim").addEventListener("click", closeAll);
  $("#cartBtn").addEventListener("click", () => openCart(false));
  $("#drawerClose").addEventListener("click", closeAll);
  $("#toCheckout").addEventListener("click", () => openCart(true));
  $("#backToCart").addEventListener("click", () => openCart(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

  /* ---------- product sheet ---------- */
  let cur = null, size = null, qty = 1;
  function openModal(id) {
    const p = byId(id); if (!p) return;
    cur = p; size = null; qty = 1;
    $("#mTag").textContent = typeLabel(p) + " · " + p.code;
    $("#mName").textContent = p.name;
    $("#mPrice").textContent = money(p.price);
    $("#mOld").textContent = money(p.oldPrice);
    $("#mOff").textContent = "-" + off(p) + "%";
    $("#mDesc").textContent = p.desc;
    $("#mSpecs").innerHTML = p.specs.map((s) => `<span>${esc(s)}</span>`).join("");
    $("#mSizes").innerHTML = p.sizes.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join("");
    const st = $("#mStock"); st.classList.toggle("low", p.stock <= 25);
    st.textContent = p.stock <= 25 ? `Plus que ${p.stock} paires disponibles` : "En stock, expédié sous 24h";
    $("#qVal").textContent = 1; $("#mErr").textContent = "";
    const m = $("#mImg"); m.dataset.name = p.name; m.dataset.tint = p.tint; m.src = p.images[0]; m.alt = p.name;
    $("#mThumbs").innerHTML = p.images.map((src, i) => `<button type="button" class="${i ? "" : "on"}" data-i="${i}" aria-label="Photo ${i + 1}">${img(src, "", "", "", p.tint)}</button>`).join("");
    $("#modal .sheet-body").scrollTop = 0;
    openSheet($("#modal"));
  }
  $("#modal").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeAll(); });
  $("#mThumbs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#mThumbs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#mImg").src = cur.images[+b.dataset.i];
  });
  $("#mSizes").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    size = +b.dataset.size; $$("#mSizes button").forEach((x) => x.classList.toggle("on", x === b)); $("#mErr").textContent = "";
  });
  $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qVal").textContent = qty; });
  $("#qPlus").addEventListener("click", () => { qty = Math.min(10, qty + 1); $("#qVal").textContent = qty; });
  function shake(el) { el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  function needSize() {
    if (size) return false;
    $("#mErr").textContent = "Choisissez d'abord votre pointure.";
    shake($("#mSizes")); $("#mSizes").scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }
  $("#mAdd").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeAll(); toast(`${cur.name} · T.${size} ajouté au panier`); });
  $("#mBuy").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); openCart(true); });

  /* ---------- checkout -> WhatsApp ---------- */
  $("#checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    $$("input,textarea", f).forEach((el) => el.classList.remove("bad"));
    const phone = (d.phone || "").replace(/[\s.()-]/g, "");
    const checks = {
      name: (d.name || "").trim().length >= 3,
      phone: /^(\+212|00212|0)[5-7]\d{8}$/.test(phone),
      city: (d.city || "").trim().length >= 2,
      address: (d.address || "").trim().length >= 5
    };
    let bad = false;
    for (const k in checks) if (!checks[k]) { f.elements[k].classList.add("bad"); bad = true; }
    if (bad) { $("#coErr").textContent = !checks.phone && checks.name ? "Numéro invalide. Exemple : 06 12 34 56 78" : "Merci de remplir tous les champs."; return; }
    if (!cart.length) return;
    $("#coErr").textContent = "";
    const sub = subtotal(), ship = S.shippingFee;
    const lines = cart.map((i) => { const p = byId(i.id); return `• ${p.name} | Pointure ${i.size} | x${i.qty} = ${money(p.price * i.qty)}`; });
    const msg = [
      `*Nouvelle commande ${S.name}*`, "",
      ...lines, "",
      `Sous-total : ${money(sub)}`, `Livraison : ${ship ? money(ship) : "Offerte"}`, `*Total : ${money(sub + ship)}*`, "",
      `Nom : ${d.name.trim()}`, `Téléphone : ${phone}`, `Ville : ${d.city.trim()}`, `Adresse : ${d.address.trim()}`, "",
      "Paiement à la livraison"
    ].join("\n");
    window.open(waLink(msg), "_blank");
    cart = []; save(); f.reset(); closeAll(); renderCart();
    toast("Merci ! Votre commande est prête dans WhatsApp.");
  });

  /* ---------- toast ---------- */
  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2800); }

  renderFilters(); renderGrid(); renderCart();
})();
