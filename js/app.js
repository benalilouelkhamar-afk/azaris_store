(function () {
  "use strict";
  const S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES, A = window.ASSETS || "";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("fr-FR") + " " + S.currency;
  const off = (p) => Math.round((1 - p.price / p.oldPrice) * 100);
  const byId = (id) => P.find((p) => p.id === id);
  const catLabel = (id) => (C.find((c) => c.id === id) || {}).label || "";
  const waLink = (text) => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- images with graceful fallback ---------- */
  function placeholder(name) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#ece3d7'/><stop offset='1' stop-color='#dccfbe'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><text x='200' y='262' fill='#7a6f65' font-family='Georgia,serif' font-size='30' letter-spacing='3' text-anchor='middle'>${esc(name)}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  // data-fb: comma separated list of fallback URLs, then a placeholder with data-name
  function img(src, name, cls = "", alt = "", fallbacks = []) {
    return `<img class="${cls}" src="${src}" alt="${esc(alt)}" loading="lazy" data-name="${esc(name)}" data-fb="${fallbacks.join(",")}">`;
  }
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName !== "IMG" || !("name" in t.dataset)) return;
    const list = (t.dataset.fb || "").split(",").filter(Boolean);
    if (list.length) { t.dataset.fb = list.slice(1).join(","); t.src = list[0]; }
    else if (!t.src.startsWith("data:")) t.src = placeholder(t.dataset.name);
  }, true);

  /* ---------- brand / links ---------- */
  $$("[data-brand]").forEach((el) => (el.textContent = S.name));
  $("#year").textContent = new Date().getFullYear();
  $("#footTag").textContent = S.tagline + " Chaussures en cuir véritable, fabriquées à la main au Maroc.";
  const waFmt = "+" + S.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  $("#footWa").textContent = "WhatsApp " + waFmt; $("#footWa").href = waLink();
  $("#footMail").textContent = S.email; $("#footMail").href = "mailto:" + S.email;
  $("#footIg").href = $("#hdrIg").href = S.instagram;
  $("#footTt").href = S.tiktok; $("#footFb").href = S.facebook;
  const guideMsg = waLink("Bonjour " + S.name + ", j'aimerais de l'aide pour choisir ma pointure.");
  $("#footWa2").href = guideMsg; $("#mGuide").href = guideMsg;
  $("#waFloat").href = waLink("Bonjour " + S.name + ", j'ai une question sur un modèle.");
  $("#ctaWa").href = guideMsg;

  /* ---------- announcement (mobile marquee needs duplicate) ---------- */
  const at = $(".announce-track"); at.innerHTML += at.innerHTML;
  if (innerWidth > 560) $$("span", at).slice(3).forEach((s) => s.remove());

  /* ---------- hero media ---------- */
  (function hero() {
    const box = $("#heroMedia");
    const poster = A + "images/brand/hero-banner.jpg";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fallbackImg = () => { box.innerHTML = img(poster, "", "", "", [P[0].images[0]]); };
    if (reduce) return fallbackImg();
    const v = document.createElement("video");
    Object.assign(v, { muted: true, autoplay: true, loop: true, playsInline: true, poster });
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.src = A + "videos/hero-video.mp4";
    v.addEventListener("error", fallbackImg);
    box.appendChild(v);
  })();

  /* ---------- categories / story media ---------- */
  const catImgs = { shoes: [A + "images/categories/category-chaussures.png", byId("atlass-98").images[0]], sandals: [A + "images/categories/category-sandales.png", byId("naruto").images[0]] };
  $$("[data-cat]").forEach((el) => { const l = catImgs[el.dataset.cat]; el.innerHTML = img(l[0], "", "", catLabel(el.dataset.cat), l.slice(1)); });
  $("#storyMedia").innerHTML = img(A + "api/local-assets/banners/1790337589650-usciw40i.jpeg", "", "", "Atelier " + S.name, [byId("shadow-step").images[0]]);

  /* ---------- header ---------- */
  addEventListener("scroll", () => $("#header").classList.toggle("scrolled", scrollY > 10), { passive: true });
  $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));
  $("#nav").addEventListener("click", () => $("#nav").classList.remove("open"));
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-filter]");
    if (a) { filter = a.dataset.filter; renderFilters(); renderGrid(); }
  });

  /* ---------- filters + grid ---------- */
  let filter = "all";
  function renderFilters() {
    $("#filters").innerHTML = C.map((c) => {
      const n = c.id === "all" ? P.length : P.filter((p) => p.category === c.id).length;
      return `<button role="tab" data-f="${c.id}" aria-selected="${c.id === filter}" class="${c.id === filter ? "on" : ""}">${c.label}<small>${n}</small></button>`;
    }).join("");
  }
  function card(p) {
    return `<article class="card reveal" data-id="${p.id}" tabindex="0" aria-label="${esc(p.name)}">
      <div class="card-media">
        ${img(p.images[0], p.name, "main", p.name)}
        ${img(p.images[1] || p.images[0], p.name, "alt", "")}
        <span class="badge">-${off(p)}%</span>
        <span class="tag">${esc(p.tag)}</span>
        <button class="quick" type="button">Choisir ma pointure</button>
      </div>
      <div class="card-body">
        <div class="card-cat">${catLabel(p.category)}</div>
        <h3 class="card-name">${esc(p.name)}</h3>
        <div class="price-row"><span class="price">${money(p.price)}</span><s>${money(p.oldPrice)}</s></div>
        ${p.stock <= 25 ? `<div class="card-stock">Plus que ${p.stock} paires</div>` : ""}
      </div>
    </article>`;
  }
  function renderGrid() {
    const list = filter === "all" ? P : P.filter((p) => p.category === filter);
    $("#grid").innerHTML = list.map(card).join("");
    $$("#grid .card").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });
  }
  $("#filters").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { filter = b.dataset.f; renderFilters(); renderGrid(); } });
  $("#grid").addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); });
  $("#grid").addEventListener("keydown", (e) => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); } });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.1 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- cart ---------- */
  const KEY = "anzar_cart_v1";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((i) => byId(i.id) && i.qty > 0);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) {} };
  const subtotal = () => cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);

  function addToCart(id, size, qty) {
    const ex = cart.find((i) => i.id === id && i.size === size);
    if (ex) ex.qty += qty; else cart.push({ id, size, qty });
    save(); renderCart();
    const b = $("#cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  function renderCart() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    $("#cartCount").textContent = n;
    $("#drawerTitle").textContent = n ? `Votre panier (${n})` : "Votre panier";
    const box = $("#cartItems");
    if (!cart.length) {
      box.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><h4>Votre panier est vide</h4><p>Découvrez nos modèles faits main.</p><button class="btn btn-dark" id="emptyShop">Continuer mes achats</button></div>`;
      $("#emptyShop").addEventListener("click", () => { closeDrawer(); location.hash = "collection"; });
    } else {
      box.innerHTML = cart.map((i, k) => {
        const p = byId(i.id);
        return `<div class="ci">
          ${img(p.images[0], p.name, "", p.name)}
          <div><h4>${esc(p.name)}</h4><small>Pointure ${i.size} · ${money(p.price)}</small>
            <div class="qty"><button data-dec="${k}" aria-label="Moins">−</button><span>${i.qty}</span><button data-inc="${k}" aria-label="Plus">+</button></div></div>
          <div class="ci-right"><b>${money(p.price * i.qty)}</b><button class="ci-del" data-del="${k}">Retirer</button></div>
        </div>`;
      }).join("");
    }
    const sub = subtotal(), ship = cart.length ? S.shippingFee : 0;
    $("#cartSub").textContent = money(sub);
    $("#cartShip").textContent = ship ? money(ship) : "Gratuite";
    $("#cartTotal").textContent = money(sub + ship);
    $("#coTotal").textContent = money(sub + ship);
    $(".drawer-foot").classList.toggle("hidden", !cart.length);
    $("#coSummary").innerHTML = cart.map((i) => { const p = byId(i.id); return `<div><span>${esc(p.name)} · T.${i.size} × ${i.qty}</span><b>${money(p.price * i.qty)}</b></div>`; }).join("");
  }
  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.inc) cart[+t.dataset.inc].qty = Math.min(10, cart[+t.dataset.inc].qty + 1);
    if (t.dataset.dec) { const i = cart[+t.dataset.dec]; i.qty--; if (i.qty < 1) cart.splice(+t.dataset.dec, 1); }
    if (t.dataset.del) cart.splice(+t.dataset.del, 1);
    save(); renderCart();
  });

  /* ---------- drawer ---------- */
  const lock = () => document.body.classList.add("lock");
  const unlock = () => { if (!$("#modal").classList.contains("open") && !$("#drawer").classList.contains("open")) document.body.classList.remove("lock"); };
  function openDrawer(checkout) {
    if (checkout && !cart.length) checkout = false;
    $("#drawer").classList.add("open"); $("#cartOverlay").classList.add("open"); lock();
    $("#cartView").classList.toggle("hidden", !!checkout); $("#checkout").classList.toggle("hidden", !checkout);
    $("#drawerTitle").textContent = checkout ? "Finaliser la commande" : $("#drawerTitle").textContent.replace("Finaliser la commande", "Votre panier");
    if (!checkout) renderCart();
  }
  function closeDrawer() { $("#drawer").classList.remove("open"); $("#cartOverlay").classList.remove("open"); unlock(); }
  $("#cartBtn").addEventListener("click", () => openDrawer(false));
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#cartOverlay").addEventListener("click", closeDrawer);
  $("#toCheckout").addEventListener("click", () => openDrawer(true));
  $("#backToCart").addEventListener("click", () => openDrawer(false));

  /* ---------- product modal ---------- */
  let cur = null, size = null, qty = 1;
  function openModal(id) {
    const p = byId(id); if (!p) return;
    cur = p; size = null; qty = 1;
    $("#mTag").textContent = catLabel(p.category) + " · " + p.tag;
    $("#mName").textContent = p.name;
    $("#mPrice").textContent = money(p.price);
    $("#mOld").textContent = money(p.oldPrice);
    $("#mOff").textContent = "-" + off(p) + "%";
    $("#mDesc").textContent = p.desc;
    $("#mSpecs").innerHTML = p.specs.map((s) => `<li>${esc(s)}</li>`).join("");
    $("#mSizes").innerHTML = p.sizes.map((s) => `<button type="button" data-size="${s}">${s}</button>`).join("");
    $("#mStock").textContent = p.stock <= 40 ? `Plus que ${p.stock} paires en stock` : "En stock, expédition rapide";
    $("#qVal").textContent = 1; $("#mErr").textContent = "";
    const m = $("#mImg"); m.dataset.name = p.name; m.dataset.fb = ""; m.src = p.images[0]; m.alt = p.name;
    $("#mThumbs").innerHTML = p.images.map((src, i) => `<button type="button" class="${i ? "" : "on"}" data-i="${i}" aria-label="Photo ${i + 1}">${img(src, p.name)}</button>`).join("");
    $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false"); lock();
    $(".modal").scrollTop = 0;
  }
  function closeModal() { $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true"); unlock(); }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeDrawer(); } });
  $("#mThumbs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#mThumbs button").forEach((x) => x.classList.toggle("on", x === b));
    const m = $("#mImg"); m.dataset.fb = ""; m.src = cur.images[+b.dataset.i];
  });
  $("#mSizes").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    size = +b.dataset.size; $$("#mSizes button").forEach((x) => x.classList.toggle("on", x === b)); $("#mErr").textContent = "";
  });
  $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qVal").textContent = qty; });
  $("#qPlus").addEventListener("click", () => { qty = Math.min(10, qty + 1); $("#qVal").textContent = qty; });
  function needSize() {
    if (size) return false;
    $("#mErr").textContent = "Veuillez choisir votre pointure.";
    const s = $("#mSizes"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
    return true;
  }
  $("#mAdd").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeModal(); toast(`${cur.name} (T.${size}) ajouté au panier`); });
  $("#mBuy").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeModal(); openDrawer(true); });

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
    if (bad) { $("#coErr").textContent = !checks.phone && checks.name ? "Numéro de téléphone invalide (ex : 06 12 34 56 78)." : "Veuillez remplir tous les champs."; return; }
    if (!cart.length) return;
    $("#coErr").textContent = "";
    const sub = subtotal(), ship = S.shippingFee;
    const lines = cart.map((i) => { const p = byId(i.id); return `• ${p.name} | Pointure ${i.size} | x${i.qty} = ${money(p.price * i.qty)}`; });
    const msg = [
      `*Nouvelle commande - ${S.name}*`, "",
      ...lines, "",
      `Sous-total : ${money(sub)}`, `Livraison : ${ship ? money(ship) : "Gratuite"}`, `*Total : ${money(sub + ship)}*`, "",
      `Nom : ${d.name.trim()}`, `Téléphone : ${phone}`, `Ville : ${d.city.trim()}`, `Adresse : ${d.address.trim()}`, "",
      "Paiement à la livraison"
    ].join("\n");
    window.open(waLink(msg), "_blank");
    cart = []; save(); renderCart(); f.reset(); closeDrawer();
    toast("Merci ! Votre commande a été préparée sur WhatsApp.");
  });

  /* ---------- toast ---------- */
  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2800); }

  renderFilters(); renderGrid(); renderCart();
})();
