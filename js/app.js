(function () {
  "use strict";
  const S = window.STORE, P = window.PRODUCTS, C = window.CATEGORIES;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = (n) => n.toLocaleString("fr-MA") + " " + S.currency;
  const off = (p) => Math.round((1 - p.price / p.oldPrice) * 100);
  const byId = (id) => P.find((p) => p.id === id);
  const waLink = (text) => "https://wa.me/" + S.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");

  /* ---------- fallback image (generated, neon) ---------- */
  function fallbackSrc(name) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#00f0ff'/><stop offset='.55' stop-color='#8b5cff'/><stop offset='1' stop-color='#ff2bd6'/></linearGradient></defs><rect width='400' height='500' fill='#0b0f20'/><g stroke='#00f0ff' stroke-opacity='.08'>${Array.from({length:20},(_,i)=>`<path d='M0 ${i*25}H400M${i*20} 0V500'/>`).join("")}</g><path d='M70 300c40-10 70-60 110-60 30 0 40 30 80 40s70 20 70 45v20H70z' fill='none' stroke='url(#g)' stroke-width='5' stroke-linejoin='round'/><path d='M70 345h260' stroke='url(#g)' stroke-width='5'/><text x='200' y='420' fill='#e8f3ff' font-family='monospace' font-size='22' text-anchor='middle' letter-spacing='4'>${name.toUpperCase()}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function img(src, name, cls = "", alt = "") {
    return `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy" data-fb="${name}">`;
  }
  document.addEventListener("error", (e) => {
    const t = e.target;
    if (t.tagName === "IMG" && t.dataset.fb && !t.dataset.failed) {
      t.dataset.failed = "1";
      t.src = fallbackSrc(t.dataset.fb);
    }
  }, true);

  /* ---------- brand text ---------- */
  $$("[data-brand]").forEach((el) => (el.textContent = S.name));
  $("#year").textContent = new Date().getFullYear();
  $("#footTag").textContent = S.tagline + " Chaussures en cuir véritable fabriquées à la main au Maroc.";
  const waFmt = "+" + S.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  $("#footWa").textContent = "WhatsApp " + waFmt;
  $("#footWa").href = waLink();
  $("#footMail").textContent = S.email; $("#footMail").href = "mailto:" + S.email;
  $("#footIg").href = S.instagram; $("#footTt").href = S.tiktok; $("#footFb").href = S.facebook;
  $("#waFloat").href = waLink("Salam " + S.name + ", bghit nsowl 3la wa7ed l'model.");
  $("#ctaWa").href = waLink("Salam, bghit n3ref l'pointure li mnasba liya.");

  /* ---------- boot ---------- */
  (function boot() {
    const lines = ["> init core.sys", "> loading catalog [" + P.length + " units]", "> calibrating holo-display", "> secure COD channel ... OK", "> welcome."];
    const box = $("#bootLines"), bar = $("#bootBar");
    let i = 0;
    const step = () => {
      if (i < lines.length) {
        box.textContent += lines[i] + "\n";
        bar.style.width = ((i + 1) / lines.length) * 100 + "%";
        i++; setTimeout(step, 170);
      } else {
        setTimeout(() => { $("#boot").classList.add("done"); document.body.classList.add("ready"); }, 250);
      }
    };
    step();
  })();

  /* ---------- particle / starfield canvas ---------- */
  (function canvas() {
    const c = $("#bg"), x = c.getContext("2d");
    let w, h, pts = [], mouse = { x: -999, y: -999 };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr;
      c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
      const n = Math.min(110, Math.floor((innerWidth * innerHeight) / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.4 + 0.4) * dpr, hue: Math.random() < 0.7 ? "0,240,255" : "139,92,255"
      }));
    }
    function draw() {
      x.clearRect(0, 0, w, h);
      const dpr = Math.min(devicePixelRatio || 1, 2), L = 130 * dpr;
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x * dpr, dy = p.y - mouse.y * dpr, d = Math.hypot(dx, dy);
        if (d < 140 * dpr) { p.x += dx / d * 0.8; p.y += dy / d * 0.8; }
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = `rgba(${p.hue},.75)`; x.fill();
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < L) { x.strokeStyle = `rgba(0,240,255,${(1 - d / L) * 0.14})`; x.lineWidth = dpr * 0.6; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
        }
      if (!reduce) requestAnimationFrame(draw);
    }
    addEventListener("resize", size);
    addEventListener("pointermove", (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      const g = $("#cursorGlow"); g.style.left = e.clientX + "px"; g.style.top = e.clientY + "px";
    });
    size(); draw();
  })();

  /* ---------- nav ---------- */
  addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 30), { passive: true });

  /* ---------- glitch ---------- */
  const gl = $(".glitch");
  setInterval(() => { gl.classList.add("is-glitching"); setTimeout(() => gl.classList.remove("is-glitching"), 180); }, 3800);

  /* ---------- hero rotator ---------- */
  (function hero() {
    const picks = P.slice(0, 7);
    const imgEl = $("#heroImg"), dots = $("#heroDots");
    imgEl.dataset.fb = picks[0].name;
    dots.innerHTML = picks.map((_, i) => `<button aria-label="Produit ${i + 1}"></button>`).join("");
    let k = 0, timer;
    function show(i) {
      k = (i + picks.length) % picks.length;
      const p = picks[k];
      imgEl.classList.add("swap");
      setTimeout(() => {
        imgEl.dataset.failed = ""; imgEl.dataset.fb = p.name;
        imgEl.src = p.images[0]; imgEl.alt = p.name;
        $("#heroName").textContent = p.name.toUpperCase();
        $("#heroPrice").textContent = money(p.price);
        imgEl.classList.remove("swap");
      }, 350);
      $$("button", dots).forEach((b, j) => b.classList.toggle("on", j === k));
    }
    function auto() { clearInterval(timer); timer = setInterval(() => show(k + 1), 4200); }
    $$("button", dots).forEach((b, j) => b.addEventListener("click", () => { show(j); auto(); }));
    $("#heroImgWrap").addEventListener("click", () => openModal(picks[k].id));
    $("#heroImgWrap").style.cursor = "pointer";
    show(0); auto();
  })();

  /* ---------- counters ---------- */
  $$(".counter").forEach((el) => {
    const to = +el.dataset.to; let t0;
    const run = (t) => { t0 ??= t; const q = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(run); };
    setTimeout(() => requestAnimationFrame(run), 1300);
  });

  /* ---------- ticker ---------- */
  const tick = ["CUIR VÉRITABLE", "FAIT MAIN AU MAROC", "LIVRAISON " + S.delivery, "PAIEMENT À LA LIVRAISON", "POINTURES EU 36-46", "JUSQU'À -34%"];
  const seg = `<span>${tick.map((t) => `<em>◆</em> ${t}`).join(" ")}</span>`;
  $("#ticker").innerHTML = seg + seg + seg + seg;

  /* ---------- filters + grid ---------- */
  let filter = "all";
  function renderFilters() {
    $("#filters").innerHTML = C.map((c) => {
      const n = c.id === "all" ? P.length : P.filter((p) => p.category === c.id).length;
      return `<button role="tab" data-f="${c.id}" class="${c.id === filter ? "on" : ""}">${c.label}<small>${String(n).padStart(2, "0")}</small></button>`;
    }).join("");
  }
  function card(p) {
    const pct = Math.max(6, Math.min(100, (p.stock / 40) * 100));
    return `<article class="card reveal" data-id="${p.id}" tabindex="0">
      <div class="card-media">
        ${img(p.images[0], p.name, "main", p.name)}
        ${img(p.images[1] || p.images[0], p.name, "alt", "")}
        <span class="tag mono">${p.tag.toUpperCase()}</span>
        <span class="badge">-${off(p)}%</span>
        <i class="corner c1"></i><i class="corner c2"></i><i class="corner c3"></i><i class="corner c4"></i>
      </div>
      <div class="card-body">
        <div class="card-code mono">${p.code} // ${p.category === "shoes" ? "CHAUSSURES" : "SABOTS"}</div>
        <h3 class="card-name">${p.name}</h3>
        <div class="price-row"><span class="price">${money(p.price)}</span><s>${money(p.oldPrice)}</s></div>
        <div class="stockbar">
          <div class="t mono"><span>STOCK</span><b class="${p.stock <= 20 ? "low" : ""}">${p.stock <= 20 ? "PLUS QUE " + p.stock : "DISPONIBLE"}</b></div>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>
        <button class="card-quick" data-quick="${p.id}" aria-label="Voir ${p.name}">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    </article>`;
  }
  function renderGrid() {
    const list = filter === "all" ? P : P.filter((p) => p.category === filter);
    $("#grid").innerHTML = list.map(card).join("");
    $$("#grid .card").forEach((el, i) => { el.style.transitionDelay = i * 60 + "ms"; observe(el); tilt(el); });
  }
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    filter = b.dataset.f; renderFilters(); renderGrid();
  });
  $("#grid").addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); });
  $("#grid").addEventListener("keydown", (e) => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openModal(c.dataset.id); } });

  function tilt(el) {
    if (matchMedia("(hover: none)").matches) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 8}deg) rotateX(${(0.5 - py) * 8}deg) translateY(-4px)`;
      el.style.setProperty("--mx", px * 100 + "%"); el.style.setProperty("--my", py * 100 + "%");
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
  function observe(el) { io.observe(el); }
  $$(".reveal").forEach(observe);

  /* ---------- cart state ---------- */
  const KEY = "anzar_cart_v1";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { cart = []; }
  cart = cart.filter((i) => byId(i.id));
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
    const box = $("#cartItems");
    if (!cart.length) {
      box.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" stroke-width="1.2"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/></svg>Panier khawi.<br/><span class="mono" style="font-size:11px">// AUCUN ARTICLE DÉTECTÉ</span></div>`;
    } else {
      box.innerHTML = cart.map((i, k) => {
        const p = byId(i.id);
        return `<div class="ci">
          ${img(p.images[0], p.name, "", p.name)}
          <div><h4>${p.name}</h4><small>POINTURE ${i.size}</small>
            <div class="qty"><button data-dec="${k}" aria-label="Moins">−</button><span>${i.qty}</span><button data-inc="${k}" aria-label="Plus">+</button></div></div>
          <div class="ci-right"><b>${money(p.price * i.qty)}</b><button class="ci-del" data-del="${k}">SUPPRIMER</button></div>
        </div>`;
      }).join("");
    }
    const sub = subtotal(), ship = cart.length ? S.shippingFee : 0;
    $("#cartSub").textContent = money(sub);
    $("#cartShip").textContent = ship ? money(ship) : "Gratuite";
    $("#cartTotal").textContent = money(sub + ship);
    $("#coTotal").textContent = money(sub + ship);
    $("#toCheckout").disabled = !cart.length;
    $("#toCheckout").style.opacity = cart.length ? 1 : 0.4;
  }
  $("#cartItems").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.inc) cart[+t.dataset.inc].qty++;
    if (t.dataset.dec) { const i = cart[+t.dataset.dec]; i.qty--; if (i.qty < 1) cart.splice(+t.dataset.dec, 1); }
    if (t.dataset.del) cart.splice(+t.dataset.del, 1);
    save(); renderCart();
  });

  /* ---------- drawer ---------- */
  function openDrawer(checkout) {
    $("#drawer").classList.add("open"); $("#cartOverlay").classList.add("open"); document.body.classList.add("lock");
    $("#cartView").classList.toggle("hidden", !!checkout); $("#checkout").classList.toggle("hidden", !checkout);
  }
  function closeDrawer() { $("#drawer").classList.remove("open"); $("#cartOverlay").classList.remove("open"); if (!$("#modal").classList.contains("open")) document.body.classList.remove("lock"); }
  $("#cartBtn").addEventListener("click", () => openDrawer(false));
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#cartOverlay").addEventListener("click", closeDrawer);
  $("#toCheckout").addEventListener("click", () => cart.length && openDrawer(true));
  $("#backToCart").addEventListener("click", () => openDrawer(false));

  /* ---------- modal ---------- */
  let cur = null, size = null, qty = 1;
  function openModal(id) {
    const p = byId(id); if (!p) return;
    cur = p; size = null; qty = 1;
    $("#mCode").textContent = p.code + " // " + p.tag.toUpperCase();
    $("#mName").textContent = p.name;
    $("#mPrice").textContent = money(p.price);
    $("#mOld").textContent = money(p.oldPrice);
    $("#mOff").textContent = "-" + off(p) + "%";
    $("#mDesc").textContent = p.desc;
    $("#mSpecs").innerHTML = p.specs.map((s) => `<li>${s}</li>`).join("");
    $("#mSizes").innerHTML = p.sizes.map((s) => `<button data-size="${s}">${s}</button>`).join("");
    $("#mStock").textContent = p.stock <= 30 ? `⚠ PLUS QUE ${p.stock} PAIRES EN STOCK` : "● EN STOCK — EXPÉDITION RAPIDE";
    $("#qVal").textContent = 1; $("#mErr").textContent = "";
    const m = $("#mImg"); m.dataset.fb = p.name; m.dataset.failed = ""; m.src = p.images[0]; m.alt = p.name;
    $("#mThumbs").innerHTML = p.images.map((src, i) => `<button class="${i ? "" : "on"}" data-i="${i}">${img(src, p.name, "", "")}</button>`).join("");
    $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false"); document.body.classList.add("lock");
  }
  function closeModal() { $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true"); if (!$("#drawer").classList.contains("open")) document.body.classList.remove("lock"); }
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.closest("[data-close]")) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeDrawer(); } });
  $("#mThumbs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#mThumbs button").forEach((x) => x.classList.remove("on")); b.classList.add("on");
    const m = $("#mImg"); m.dataset.failed = ""; m.src = cur.images[+b.dataset.i];
  });
  $("#mSizes").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    size = +b.dataset.size; $$("#mSizes button").forEach((x) => x.classList.toggle("on", x === b)); $("#mErr").textContent = "";
  });
  $("#qMinus").addEventListener("click", () => { qty = Math.max(1, qty - 1); $("#qVal").textContent = qty; });
  $("#qPlus").addEventListener("click", () => { qty = Math.min(10, qty + 1); $("#qVal").textContent = qty; });
  function needSize() {
    if (size) return false;
    $("#mErr").textContent = "// KHTAR L'POINTURE 3AFAK";
    const s = $("#mSizes"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
    return true;
  }
  $("#mAdd").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeModal(); toast(`✓ ${cur.name} (${size}) TZAD L PANIER`); });
  $("#mBuy").addEventListener("click", () => { if (needSize()) return; addToCart(cur.id, size, qty); closeModal(); openDrawer(true); });

  /* ---------- checkout -> WhatsApp ---------- */
  $("#checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    let bad = false;
    $$("input,textarea", f).forEach((el) => el.classList.remove("bad"));
    const phone = (d.phone || "").replace(/[\s.-]/g, "");
    const checks = { name: (d.name || "").trim().length >= 3, phone: /^(\+212|00212|0)[5-7]\d{8}$/.test(phone), city: (d.city || "").trim().length >= 2, address: (d.address || "").trim().length >= 5 };
    for (const k in checks) if (!checks[k]) { f.elements[k].classList.add("bad"); bad = true; }
    if (bad) { $("#coErr").textContent = checks.phone ? "// 3MMER GA3 LES CHAMPS" : "// NUMÉRO DE TÉLÉPHONE MACHI SA7I7"; return; }
    if (!cart.length) return;
    $("#coErr").textContent = "";
    const sub = subtotal(), ship = S.shippingFee;
    const lines = cart.map((i) => { const p = byId(i.id); return `• ${p.name} | Pointure ${i.size} | x${i.qty} = ${money(p.price * i.qty)}`; });
    const msg = [
      `🛒 *Nouvelle commande - ${S.name}*`, "",
      ...lines, "",
      `Sous-total: ${money(sub)}`, `Livraison: ${ship ? money(ship) : "Gratuite"}`, `*Total: ${money(sub + ship)}*`, "",
      `👤 Nom: ${d.name.trim()}`, `📞 Tél: ${phone}`, `🏙️ Ville: ${d.city.trim()}`, `📍 Adresse: ${d.address.trim()}`, "",
      "💵 Paiement à la livraison"
    ].join("\n");
    window.open(waLink(msg), "_blank");
    cart = []; save(); renderCart(); f.reset(); closeDrawer();
    toast("✓ COMMANDE TSIFTAT — GHADI N3AYTO LIK QRIB");
  });

  /* ---------- toast ---------- */
  let tt;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2600); }

  renderFilters(); renderGrid(); renderCart();
})();
