(function () {
  "use strict";
  const S = window.STORE, P = window.PRODUCTS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("fr-FR") + " " + S.currency;
  const off = (p) => Math.round((1 - p.price / p.oldPrice) * 100);
  const byId = (id) => P.find((p) => p.id === id);
  const typeLabel = (p) => (p.category === "shoes" ? "Soulier" : "Sabot");
  const waLink = (text) => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const FILTERS = [{ id: "all", label: "Tout" }, { id: "shoes", label: "Souliers" }, { id: "sandals", label: "Sabots" }];

  // Hide broken images so the card background shows instead of a broken icon
  document.addEventListener("error", (e) => { if (e.target.tagName === "IMG") e.target.style.visibility = "hidden"; }, true);
  const img = (src, alt = "", cls = "") => `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy">`;

  /* brand + links */
  $$("[data-brand]").forEach((el) => (el.textContent = S.name));
  $("#year").textContent = new Date().getFullYear();
  const sizeHelp = waLink(`Bonjour, j'aimerais un conseil pour choisir ma pointure.`);
  ["#heroWa", "#footGuide", "#mGuide"].forEach((s) => ($(s).href = sizeHelp));
  $("#maisonWa").href = waLink("Bonjour, j'ai une question sur un modèle.");
  $("#waFloat").href = waLink("Bonjour");
  const waFmt = "+" + S.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  const contact = [`<a href="${waLink()}" target="_blank" rel="noopener">WhatsApp ${waFmt}</a>`];
  if (S.email) contact.push(`<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`);
  [["instagram", "Instagram"], ["tiktok", "TikTok"], ["facebook", "Facebook"]].forEach(([k, l]) => { if (S[k]) contact.push(`<a href="${esc(S[k])}" target="_blank" rel="noopener">${l}</a>`); });
  $("#footContact").insertAdjacentHTML("beforeend", contact.join(""));

  /* static images */
  $$("img[data-src]").forEach((el) => { const p = byId(el.dataset.src); if (p) el.src = p.images[0]; });
  $$("[data-open]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); openModal(el.dataset.open); }));

  /* header */
  addEventListener("scroll", () => $("#header").classList.toggle("scrolled", scrollY > 10), { passive: true });
  $("#menuBtn").addEventListener("click", () => {
    const o = $("#nav").classList.toggle("open");
    $("#menuBtn").textContent = o ? "Fermer" : "Menu";
  });
  $("#nav").addEventListener("click", () => { $("#nav").classList.remove("open"); $("#menuBtn").textContent = "Menu"; });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-filter]");
    if (a) { filter = a.dataset.filter; renderFilters(); renderGrid(); }
  });

  /* collection */
  let filter = "all";
  function renderFilters() {
    $("#filters").innerHTML = FILTERS.map((f) => `<button data-f="${f.id}" class="${f.id === filter ? "on" : ""}">${f.label}</button>`).join("");
  }
  function card(p) {
    return `<article class="card" data-id="${p.id}" tabindex="0">
      <div class="card-m">${img(p.images[0], p.name, "main")}${img(p.images[1] || p.images[0], "", "alt")}<span class="card-off">-${off(p)}%</span></div>
      <div class="card-b">
        <div class="card-t">${typeLabel(p)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="card-row"><span class="card-p">${money(p.price)}<s>${money(p.oldPrice)}</s></span><span class="card-go">Choisir</span></div>
      </div>
    </article>`;
  }
  function renderGrid() {
    const list = filter === "all" ? P : P.filter((p) => p.category === filter);
    $("#grid").innerHTML = list.map(card).join("");
  }
  $("#filters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { filter = b.dataset.f; renderFilters(); renderGrid(); } });
  $("#grid").addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); });
  $("#grid").addEventListener("keydown", (e) => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); } });

  /* cart */
  const KEY = "azaris_cart";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((i) => byId(i.id) && i.qty > 0);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} };
  const subtotal = () => cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
  function addToCart(id, size, qty) {
    const ex = cart.find((i) => i.id === id && i.size === size);
    if (ex) ex.qty = Math.min(10, ex.qty + qty); else cart.push({ id, size, qty });
    save(); renderCart();
  }
  function renderCart() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $("#cartCount").textContent = n;
    if (!cart.length) {
      $("#cartItems").innerHTML = `<div class="empty"><h4>Votre panier est vide</h4><p>Découvrez nos modèles.</p><button class="btn btn-line" id="emptyShop">Voir la collection</button></div>`;
      $("#emptyShop").addEventListener("click", () => { closeAll(); location.hash = "collection"; });
    } else {
      $("#cartItems").innerHTML = cart.map((i, k) => {
        const p = byId(i.id);
        return `<div class="ci">
          <div class="ci-img">${img(p.images[0], p.name)}</div>
          <div><h4>${esc(p.name)}</h4><small>Pointure ${i.size}</small>
            <div class="qty"><button data-dec="${k}" aria-label="Moins">−</button><span>${i.qty}</span><button data-inc="${k}" aria-label="Plus">+</button></div></div>
          <div class="ci-r"><b>${money(p.price * i.qty)}</b><button class="ci-del" data-del="${k}">Retirer</button></div>
        </div>`;
      }).join("");
    }
    const sub = subtotal(), ship = cart.length ? S.shippingFee : 0;
    $("#cartSub").textContent = money(sub);
    $("#cartShip").textContent = ship ? money(ship) : "Offerte";
    $("#cartTotal").textContent = money(sub + ship);
    $("#coTotal").textContent = money(sub + ship);
    $("#coSummary").innerHTML = cart.map((i) => { const p = byId(i.id); return `<div><span>${esc(p.name)}, pointure ${i.size} × ${i.qty}</span><b>${money(p.price * i.qty)}</b></div>`; }).join("");
    if ($("#checkout").classList.contains("hidden")) $("#cartFoot").classList.toggle("hidden", !cart.length);
  }
  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.inc) cart[+t.dataset.inc].qty = Math.min(10, cart[+t.dataset.inc].qty + 1);
    if (t.dataset.dec) { const i = cart[+t.dataset.dec]; i.qty--; if (i.qty < 1) cart.splice(+t.dataset.dec, 1); }
    if (t.dataset.del) cart.splice(+t.dataset.del, 1);
    save(); renderCart();
  });

  /* panels */
  function closeAll() {
    $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true");
    $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true");
    $("#cartOverlay").classList.remove("open");
    document.body.classList.remove("lock");
  }
  function openCart(checkout) {
    if (checkout && !cart.length) checkout = false;
    $("#modal").classList.remove("open");
    $("#cartView").classList.toggle("hidden", !!checkout);
    $("#checkout").classList.toggle("hidden", !checkout);
    $("#cartFoot").classList.toggle("hidden", !!checkout || !cart.length);
    $("#drawerTitle").textContent = checkout ? "Livraison" : "Panier";
    renderCart();
    $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false");
    $("#cartOverlay").classList.add("open"); document.body.classList.add("lock");
  }
  $("#cartBtn").addEventListener("click", () => openCart(false));
  $("#drawerClose").addEventListener("click", closeAll);
  $("#cartOverlay").addEventListener("click", closeAll);
  $("#toCheckout").addEventListener("click", () => openCart(true));
  $("#backToCart").addEventListener("click", () => openCart(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

  /* product */
  let cur = null, size = null, qty = 1;
  function openModal(id) {
    const p = byId(id); if (!p) return;
    cur = p; size = null; qty = 1;
    $("#mType").textContent = typeLabel(p);
    $("#mName").textContent = p.name;
    $("#mPrice").textContent = money(p.price);
    $("#mOld").textContent = money(p.oldPrice);
    $("#mOff").textContent = "-" + off(p) + "%";
    $("#mDesc").textContent = p.desc;
    $("#mSpecs").innerHTML = p.specs.map((s) => `<li>${esc(s)}</li>`).join("");
    $("#mSizes").innerHTML = p.sizes.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join("");
    $("#mStock").textContent = p.stock <= 25 ? `Plus que ${p.stock} paires disponibles.` : "En stock.";
    $("#qVal").textContent = 1; $("#mErr").textContent = "";
    const m = $("#mImg"); m.style.visibility = ""; m.src = p.images[0]; m.alt = p.name;
    $("#mThumbs").innerHTML = p.images.map((src, i) => `<button type="button" class="${i ? "" : "on"}" data-i="${i}" aria-label="Photo ${i + 1}">${img(src)}</button>`).join("");
    $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false"); document.body.classList.add("lock");
    $(".modal").scrollTop = 0;
  }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeAll(); });
  $("#mThumbs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#mThumbs button").forEach((x) => x.classList.toggle("on", x === b));
    const m = $("#mImg"); m.style.visibility = ""; m.src = cur.images[+b.dataset.i];
  });
  $("#mSizes").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    size = +b.dataset.size; $$("#mSizes button").forEach((x) => x.classList.toggle("on", x === b)); $("#mErr").textContent = "";
  });
  $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qVal").textContent = qty; });
  $("#qPlus").addEventListener("click", () => { qty = Math.min(10, qty + 1); $("#qVal").textContent = qty; });
  const needSize = () => { if (size) return false; $("#mErr").textContent = "Veuillez choisir votre pointure."; return true; };
  $("#mAdd").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeAll(); toast(`${cur.name} a été ajouté au panier.`); });
  $("#mBuy").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); openCart(true); });

  /* checkout -> WhatsApp */
  $("#checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    $$("input,textarea", f).forEach((el) => el.classList.remove("bad"));
    const phone = (d.phone || "").replace(/[\s.()-]/g, "");
    const ok = {
      name: (d.name || "").trim().length >= 3,
      phone: /^(\+212|00212|0)[5-7]\d{8}$/.test(phone),
      city: (d.city || "").trim().length >= 2,
      address: (d.address || "").trim().length >= 5
    };
    let bad = false;
    for (const k in ok) if (!ok[k]) { f.elements[k].classList.add("bad"); bad = true; }
    if (bad) { $("#coErr").textContent = !ok.phone && ok.name ? "Numéro de téléphone invalide." : "Veuillez remplir tous les champs."; return; }
    if (!cart.length) return;
    $("#coErr").textContent = "";
    const sub = subtotal(), ship = S.shippingFee;
    const msg = [
      `Nouvelle commande ${S.name}`, "",
      ...cart.map((i) => { const p = byId(i.id); return `- ${p.name}, pointure ${i.size}, quantité ${i.qty} : ${money(p.price * i.qty)}`; }), "",
      `Sous-total : ${money(sub)}`, `Livraison : ${ship ? money(ship) : "offerte"}`, `Total : ${money(sub + ship)}`, "",
      `Nom : ${d.name.trim()}`, `Téléphone : ${phone}`, `Ville : ${d.city.trim()}`, `Adresse : ${d.address.trim()}`, "",
      "Paiement à la livraison"
    ].join("\n");
    window.open(waLink(msg), "_blank");
    cart = []; save(); f.reset(); closeAll(); renderCart();
    toast("Merci, votre commande a été préparée dans WhatsApp.");
  });

  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2800); }

  renderFilters(); renderGrid(); renderCart();
})();
