import { useMemo, useState, useEffect } from "react";
import { useStore, money, discount, typeLabel, ORDER_STATUS, newOrderId } from "../store.jsx";
import { uploadImage } from "../supabase.js";
import { Img } from "../components/Shop.jsx";
import "../admin.css";

const SESSION = "azaris_admin";
const fmtDate = (iso) => new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "produit";

const act = (promise) => Promise.resolve(promise).catch((e) => alert("Erreur : " + (e?.message || e)));

function download(name, text, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export default function Admin() {
  const { settings, hasBackend, session, isAdmin, admin } = useStore();
  const [localOk, setLocalOk] = useState(() => sessionStorage.getItem(SESSION) === "1");
  const [tab, setTab] = useState("dash");
  useEffect(() => { document.title = `Administration | ${settings.name}`; document.body.classList.remove("lock"); }, [settings.name]);
  if (hasBackend) {
    if (!session) return <Login />;
    if (isAdmin === null) return <Gate text="Vérification du compte..." />;
    if (!isAdmin) return <Gate text={`Le compte ${session.user.email} n'a pas accès à l'administration.`} onOut={() => admin.signOut()} />;
  } else if (!localOk) return <Login onOk={() => { sessionStorage.setItem(SESSION, "1"); setLocalOk(true); }} />;
  const logout = () => { if (hasBackend) act(admin.signOut()); else { sessionStorage.removeItem(SESSION); setLocalOk(false); } };

  const TABS = [["dash", "Tableau de bord"], ["orders", "Commandes"], ["products", "Produits"], ["settings", "Paramètres"]];
  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo">{settings.name}<small>Administration</small></div>
        <nav>{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</nav>
        <div className="adm-side-foot">
          <a href="#top">Voir la boutique</a>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <main className="adm-main">
        {tab === "dash" && <Dashboard go={setTab} />}
        {tab === "orders" && <Orders />}
        {tab === "products" && <Products />}
        {tab === "settings" && <Settings />}
      </main>
    </div>
  );
}

function Gate({ text, onOut }) {
  const { settings } = useStore();
  return (
    <div className="adm-login">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="adm-logo">{settings.name}<small>Administration</small></div>
        <p>{text}</p>
        {onOut && <button type="button" className="a-btn full" onClick={onOut}>Changer de compte</button>}
        <a href="#top" className="adm-back">Retour à la boutique</a>
      </form>
    </div>
  );
}

function Login({ onOk }) {
  const { settings, hasBackend, admin } = useStore();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!hasBackend) return pw === settings.adminPassword ? onOk() : setErr("Mot de passe incorrect.");
    setBusy(true); setErr("");
    try { await admin.signIn(email.trim(), pw); } catch { setErr("E-mail ou mot de passe incorrect."); }
    setBusy(false);
  };
  return (
    <div className="adm-login">
      <form onSubmit={submit}>
        <div className="adm-logo">{settings.name}<small>Administration</small></div>
        {hasBackend && <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" autoFocus required /></label>}
        <label>Mot de passe<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus={!hasBackend} /></label>
        <p className="adm-err">{err}</p>
        <button className="a-btn a-gold full" disabled={busy}>{busy ? "Connexion..." : "Se connecter"}</button>
        <a href="#top" className="adm-back">Retour à la boutique</a>
      </form>
    </div>
  );
}

function Head({ title, sub, children }) {
  return <div className="adm-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div><div className="adm-head-r">{children}</div></div>;
}

function RefreshBtn() {
  const { hasBackend, admin } = useStore();
  const [busy, setBusy] = useState(false);
  if (!hasBackend) return null;
  return <button className="a-btn" disabled={busy} onClick={() => { setBusy(true); act(admin.refresh()).finally(() => setBusy(false)); }}>{busy ? "Actualisation..." : "Actualiser"}</button>;
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ go }) {
  const { orders, products, settings } = useStore();
  const cur = settings.currency;
  const valid = orders.filter((o) => o.status !== "Annulée");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status === "Nouvelle").length;
  const low = products.filter((p) => p.stock <= 5);
  const top = useMemo(() => {
    const m = {};
    valid.forEach((o) => o.items.forEach((i) => (m[i.name] = (m[i.name] || 0) + i.qty)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);
  const days = useMemo(() => {
    const out = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - d);
      const next = new Date(day); next.setDate(day.getDate() + 1);
      const sum = valid.filter((o) => { const t = new Date(o.date); return t >= day && t < next; }).reduce((s, o) => s + o.total, 0);
      out.push({ label: day.toLocaleDateString("fr-FR", { weekday: "short" }), sum });
    }
    return out;
  }, [orders]);
  const max = Math.max(1, ...days.map((d) => d.sum));

  return (
    <>
      <Head title="Tableau de bord" sub="Vue d'ensemble de la boutique"><RefreshBtn /></Head>
      <div className="kpis">
        <div className="kpi"><span>Chiffre d'affaires</span><b>{money(revenue, cur)}</b><small>Hors commandes annulées</small></div>
        <div className="kpi"><span>Commandes</span><b>{orders.length}</b><small>{valid.length} valides</small></div>
        <div className="kpi"><span>À confirmer</span><b>{pending}</b><small>Statut « Nouvelle »</small></div>
        <div className="kpi"><span>Panier moyen</span><b>{money(valid.length ? Math.round(revenue / valid.length) : 0, cur)}</b><small>Par commande</small></div>
      </div>
      <div className="adm-cols">
        <section className="panel">
          <h2>Ventes des 7 derniers jours</h2>
          <div className="bars">
            {days.map((d, i) => (
              <div key={i} className="bar-col" title={money(d.sum, cur)}>
                <div className="bar-v">{d.sum ? money(d.sum, cur) : ""}</div>
                <div className="bar" style={{ height: (d.sum / max) * 100 + "%" }} />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Meilleures ventes</h2>
          {top.length ? <ul className="rank">{top.map(([n, q]) => <li key={n}><span>{n}</span><b>{q} vendu{q > 1 ? "s" : ""}</b></li>)}</ul> : <p className="muted">Aucune vente pour le moment.</p>}
          <h2 className="mt">Stock faible</h2>
          {low.length ? <ul className="rank">{low.map((p) => <li key={p.id}><span>{p.name}</span><b className={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Épuisé" : p.stock + " restants"}</b></li>)}</ul> : <p className="muted">Tous les modèles sont en stock.</p>}
        </section>
      </div>
      <section className="panel">
        <div className="panel-h"><h2>Dernières commandes</h2><button className="a-link" onClick={() => go("orders")}>Toutes les commandes</button></div>
        <OrderTable list={orders.slice(0, 6)} compact />
      </section>
    </>
  );
}

/* ---------------- Orders ---------------- */
function StatusSelect({ order }) {
  const { admin } = useStore();
  return (
    <select className={"status s-" + slug(order.status)} value={order.status} onClick={(e) => e.stopPropagation()}
      onChange={(e) => act(admin.updateOrder(order.id, { status: e.target.value }))}>
      {ORDER_STATUS.map((s) => <option key={s}>{s}</option>)}
    </select>
  );
}

function OrderTable({ list, compact, onOpen }) {
  const { settings } = useStore();
  if (!list.length) return <p className="muted">Aucune commande pour le moment.</p>;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr><th>N°</th><th>Date</th><th>Client</th>{!compact && <th>Ville</th>}<th>Articles</th><th>Total</th><th>Statut</th></tr></thead>
        <tbody>
          {list.map((o) => (
            <tr key={o.id} onClick={() => onOpen?.(o)} className={onOpen ? "click" : ""}>
              <td className="mono">{o.id}</td>
              <td>{fmtDate(o.date)}</td>
              <td><b>{o.customer.name}</b><small>{o.customer.phone}</small></td>
              {!compact && <td>{o.customer.city}</td>}
              <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td><b>{money(o.total, settings.currency)}</b></td>
              <td><StatusSelect order={o} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Orders() {
  const { orders, admin, settings, products } = useStore();
  const [q, setQ] = useState("");
  const [note, setNote] = useState(null);
  const [st, setSt] = useState("Toutes");
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const list = orders.filter((o) =>
    (st === "Toutes" || o.status === st) &&
    (!q || [o.id, o.customer.name, o.customer.phone, o.customer.city].join(" ").toLowerCase().includes(q.toLowerCase())));
  const cur = settings.currency;

  const exportCsv = () => {
    const rows = [["N°", "Date", "Nom", "Téléphone", "Ville", "Adresse", "Articles", "Total", "Statut"]];
    orders.forEach((o) => rows.push([o.id, fmtDate(o.date), o.customer.name, o.customer.phone, o.customer.city, o.customer.address,
      o.items.map((i) => `${i.name} T${i.size} x${i.qty}`).join(" / "), o.total, o.status]));
    download("commandes.csv", "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n"), "text/csv");
  };
  const current = open && orders.find((o) => o.id === open.id);
  const waClient = (o) => "https://wa.me/" + o.customer.phone.replace(/^0/, "212").replace(/^\+/, "") + "?text=" +
    encodeURIComponent(`Bonjour ${o.customer.name}, nous vous contactons de la part de ${settings.name} pour confirmer votre commande ${o.id} (${money(o.total, cur)}).`);

  return (
    <>
      <Head title="Commandes" sub={`${orders.length} commande${orders.length > 1 ? "s" : ""}`}>
        <RefreshBtn />
        <button className="a-btn" onClick={exportCsv} disabled={!orders.length}>Exporter (Excel)</button>
        <button className="a-btn a-gold" onClick={() => setAdding(true)}>Ajouter une commande</button>
      </Head>
      <div className="toolbar">
        <input placeholder="Rechercher un nom, un téléphone, une ville..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="chips">{["Toutes", ...ORDER_STATUS].map((s) => <button key={s} className={st === s ? "on" : ""} onClick={() => setSt(s)}>{s} <span>{s === "Toutes" ? orders.length : orders.filter((o) => o.status === s).length}</span></button>)}</div>
      </div>
      <section className="panel"><OrderTable list={list} onOpen={(o) => { setOpen(o); setNote(o.note || ""); }} /></section>

      {current && (
        <div className="a-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
          <div className="a-modal">
            <div className="panel-h"><h2>Commande {current.id}</h2><button className="a-link" onClick={() => setOpen(null)}>Fermer</button></div>
            <p className="muted">{fmtDate(current.date)}</p>
            <div className="detail-grid">
              <div><h3>Client</h3><p><b>{current.customer.name}</b><br />{current.customer.phone}<br />{current.customer.city}<br />{current.customer.address}</p></div>
              <div><h3>Statut</h3><StatusSelect order={current} /></div>
            </div>
            <h3>Articles</h3>
            <ul className="rank">{current.items.map((i, k) => <li key={k}><span>{i.name}, pointure {i.size} × {i.qty}</span><b>{money(i.price * i.qty, cur)}</b></li>)}
              <li><span>Livraison</span><b>{current.shipping ? money(current.shipping, cur) : "Offerte"}</b></li>
              <li className="tot"><span>Total</span><b>{money(current.total, cur)}</b></li></ul>
            <label className="a-field">Note interne<textarea rows={2} value={note ?? ""} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (current.note || "") && act(admin.updateOrder(current.id, { note }))} /></label>
            <div className="a-actions">
              <a className="a-btn a-green" href={waClient(current)} target="_blank" rel="noopener">Contacter sur WhatsApp</a>
              <a className="a-btn" href={"tel:" + current.customer.phone}>Appeler</a>
              <button className="a-btn a-danger" onClick={() => { if (confirm("Supprimer cette commande ?")) act(admin.deleteOrder(current.id).then(() => setOpen(null))); }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      {adding && <NewOrder products={products} onClose={() => setAdding(false)} />}
    </>
  );
}

function NewOrder({ products, onClose }) {
  const { admin, settings } = useStore();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", city: "", address: "", product: products[0]?.id, size: 40, qty: 1 });
  const p = products.find((x) => x.id === f.product);
  const save = (e) => {
    e.preventDefault();
    if (!f.name || !f.phone || !p || busy) return;
    const total = p.price * f.qty + (Number(settings.shippingFee) || 0);
    setBusy(true);
    act(admin.addOrder({
      id: newOrderId(), date: new Date().toISOString(),
      items: [{ id: p.id, name: p.name, size: +f.size, qty: +f.qty, price: p.price }],
      subtotal: p.price * f.qty, shipping: Number(settings.shippingFee) || 0, total,
      customer: { name: f.name, phone: f.phone, city: f.city, address: f.address }, status: "Confirmée", note: "Ajoutée manuellement"
    }).then(onClose)).finally(() => setBusy(false));
  };
  const inp = (k, props = {}) => <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} />;
  return (
    <div className="a-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="a-modal" onSubmit={save}>
        <div className="panel-h"><h2>Nouvelle commande</h2><button type="button" className="a-link" onClick={onClose}>Fermer</button></div>
        <p className="muted">Pour une commande reçue par téléphone, Instagram ou WhatsApp.</p>
        <div className="form-grid">
          <label className="a-field">Nom{inp("name", { required: true })}</label>
          <label className="a-field">Téléphone{inp("phone", { required: true })}</label>
          <label className="a-field">Ville{inp("city")}</label>
          <label className="a-field">Adresse{inp("address")}</label>
          <label className="a-field">Produit<select value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })}>{products.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.price} {settings.currency})</option>)}</select></label>
          <label className="a-field">Pointure<select value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })}>{(p?.sizes || []).map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="a-field">Quantité{inp("qty", { type: "number", min: 1, max: 20 })}</label>
        </div>
        <div className="a-actions"><button className="a-btn a-gold" disabled={busy}>Enregistrer</button></div>
      </form>
    </div>
  );
}

/* ---------------- Products ---------------- */
function Products() {
  const { products, admin, settings } = useStore();
  const [edit, setEdit] = useState(null);
  const cur = settings.currency;
  const blank = { id: "", name: "", code: "", category: "shoes", price: 299, oldPrice: 0, stock: 10, tag: "", desc: "", specs: [], sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46], images: [], hidden: false };
  const update = (id, patch) => act(admin.updateProduct(id, patch));

  return (
    <>
      <Head title="Produits" sub={`${products.length} modèles`}>
        <button className="a-btn" onClick={() => download("produits.json", JSON.stringify(products, null, 2))}>Exporter</button>
        <button className="a-btn" onClick={() => confirm("Revenir au catalogue d'origine ? Vos modifications de produits seront perdues.") && act(admin.resetCatalog())}>Réinitialiser</button>
        <button className="a-btn a-gold" onClick={() => setEdit({ ...blank, _new: true })}>Ajouter un produit</button>
      </Head>
      <section className="panel">
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th></th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Visible</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><div className="thumb"><Img src={p.images[0]} /></div></td>
                  <td><b>{p.name}</b><small>{p.code}</small></td>
                  <td>{typeLabel(p)}</td>
                  <td><b>{money(p.price, cur)}</b>{p.oldPrice > p.price && <small><s>{money(p.oldPrice, cur)}</s> -{discount(p)}%</small>}</td>
                  <td><input className="stock-in" type="number" min={0} value={p.stock} onChange={(e) => update(p.id, { stock: Math.max(0, Math.floor(+e.target.value) || 0) })} /></td>
                  <td><label className="switch"><input type="checkbox" checked={!p.hidden} onChange={(e) => update(p.id, { hidden: !e.target.checked })} /><span /></label></td>
                  <td className="right"><button className="a-link" onClick={() => setEdit(p)}>Modifier</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {edit && <ProductForm initial={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function resizeImage(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const scale = Math.min(1, 900 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * scale); c.height = Math.round(im.height * scale);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.82));
      };
      im.onerror = rej; im.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

function ProductForm({ initial, onClose }) {
  const { products, admin, hasBackend, settings } = useStore();
  const [busy, setBusy] = useState("");
  const [f, setF] = useState({ ...initial, specsText: (initial.specs || []).join("\n"), sizesText: (initial.sizes || []).join(", "), imagesText: (initial.images || []).join("\n") });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const images = f.imagesText.split("\n").map((s) => s.trim()).filter(Boolean);

  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setBusy("upload"); setErr("");
    try {
      const urls = await Promise.all(files.map((file) => (hasBackend ? uploadImage(file) : resizeImage(file))));
      setF((x) => ({ ...x, imagesText: [...x.imagesText.split("\n").filter(Boolean), ...urls].join("\n") }));
    } catch (e2) { setErr("Impossible d'envoyer cette image" + (e2?.message ? " : " + e2.message : ".")); }
    setBusy("");
  };
  const save = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!f.name.trim()) return setErr("Le nom est obligatoire.");
    if (!(+f.price > 0)) return setErr("Le prix doit être supérieur à 0.");
    let id = initial._new ? slug(f.name) : initial.id;
    if (initial._new) { let n = 2; const base = id; while (products.some((p) => p.id === id)) id = `${base}-${n++}`; }
    const prod = {
      id, name: f.name.trim(), code: f.code.trim(), category: f.category, tag: f.tag || "",
      price: +f.price, oldPrice: +f.oldPrice || 0, stock: Math.max(0, +f.stock || 0), desc: f.desc.trim(),
      specs: f.specsText.split("\n").map((s) => s.trim()).filter(Boolean),
      sizes: f.sizesText.split(/[,\s]+/).map(Number).filter((n) => n > 0),
      images, hidden: !!f.hidden
    };
    if (!initial._new) prod.sort = initial.sort;
    setBusy("save"); setErr("");
    try { await admin.saveProduct(prod, !!initial._new); onClose(); }
    catch (e2) { setErr("Enregistrement impossible : " + e2.message); setBusy(""); }
  };
  const del = () => { if (confirm(`Supprimer « ${initial.name} » ?`)) act(admin.deleteProduct(initial.id).then(onClose)); };

  return (
    <div className="a-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="a-modal wide" onSubmit={save}>
        <div className="panel-h"><h2>{initial._new ? "Nouveau produit" : `Modifier ${initial.name}`}</h2><button type="button" className="a-link" onClick={onClose}>Fermer</button></div>
        <div className="form-grid">
          <label className="a-field">Nom<input value={f.name} onChange={set("name")} /></label>
          <label className="a-field">Référence<input value={f.code} onChange={set("code")} /></label>
          <label className="a-field">Catégorie<select value={f.category} onChange={set("category")}><option value="shoes">Soulier</option><option value="sandals">Sabot</option></select></label>
          <label className="a-field">Stock<input type="number" min={0} value={f.stock} onChange={set("stock")} /></label>
          <label className="a-field">Prix ({settings.currency})<input type="number" min={0} value={f.price} onChange={set("price")} /></label>
          <label className="a-field">Ancien prix (barré)<input type="number" min={0} value={f.oldPrice} onChange={set("oldPrice")} /></label>
          <label className="a-field span2">Description<textarea rows={3} value={f.desc} onChange={set("desc")} /></label>
          <label className="a-field">Caractéristiques (une par ligne)<textarea rows={4} value={f.specsText} onChange={set("specsText")} /></label>
          <label className="a-field">Pointures (séparées par des virgules)<textarea rows={4} value={f.sizesText} onChange={set("sizesText")} /></label>
          <div className="a-field span2">
            <span>Photos</span>
            <div className="img-list">
              {images.map((src, i) => (
                <div key={i} className="img-item">
                  <Img src={src} />
                  <button type="button" onClick={() => setF({ ...f, imagesText: images.filter((_, k) => k !== i).join("\n") })}>Retirer</button>
                </div>
              ))}
              <label className="img-add">{busy === "upload" ? "Envoi..." : "Ajouter des photos"}<input type="file" accept="image/*" multiple onChange={upload} hidden /></label>
            </div>
            <details className="urls"><summary>Ou coller des liens d'images</summary><textarea rows={3} value={f.imagesText} onChange={set("imagesText")} placeholder="Un lien par ligne" /></details>
          </div>
          <label className="a-check span2"><input type="checkbox" checked={!f.hidden} onChange={(e) => setF({ ...f, hidden: !e.target.checked })} /> Visible dans la boutique</label>
        </div>
        <p className="adm-err">{err}</p>
        <div className="a-actions">
          <button className="a-btn a-gold" disabled={!!busy}>{busy === "save" ? "Enregistrement..." : "Enregistrer"}</button>
          {!initial._new && <button type="button" className="a-btn a-danger" onClick={del}>Supprimer</button>}
        </div>
      </form>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function Settings() {
  const { settings, admin, orders, products, hasBackend } = useStore();
  const [f, setF] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setSaved(false); };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await admin.saveSettings({ ...f, whatsapp: String(f.whatsapp).replace(/\D/g, ""), shippingFee: +f.shippingFee || 0 }); setSaved(true); }
    catch (e2) { alert("Erreur : " + e2.message); }
    setBusy(false);
  };
  return (
    <>
      <Head title="Paramètres" sub="Informations de la boutique" />
      <form className="panel" onSubmit={save}>
        <div className="form-grid">
          <label className="a-field">Nom de la boutique<input value={f.name} onChange={set("name")} /></label>
          <label className="a-field">Numéro WhatsApp (avec indicatif, ex : 212600000000)<input value={f.whatsapp} onChange={set("whatsapp")} /></label>
          <label className="a-field">Frais de livraison (0 = offerte)<input type="number" min={0} value={f.shippingFee} onChange={set("shippingFee")} /></label>
          <label className="a-field">Bandeau en haut du site<input value={f.topbar} onChange={set("topbar")} /></label>
          <label className="a-field">E-mail<input value={f.email} onChange={set("email")} /></label>
          <label className="a-field">Lien Instagram<input value={f.instagram} onChange={set("instagram")} /></label>
          <label className="a-field">Lien TikTok<input value={f.tiktok} onChange={set("tiktok")} /></label>
          <label className="a-field">Lien Facebook<input value={f.facebook} onChange={set("facebook")} /></label>
          {!hasBackend && <label className="a-field">Mot de passe administration<input value={f.adminPassword} onChange={set("adminPassword")} /></label>}
        </div>
        <div className="a-actions"><button className="a-btn a-gold" disabled={busy}>Enregistrer</button>{saved && <span className="ok">Modifications enregistrées.</span>}</div>
      </form>
      <section className="panel">
        <h2>Données</h2>
        <p className="muted">{hasBackend ? "Les commandes et les produits sont enregistrés en ligne (Supabase) : vous les retrouvez sur tous vos appareils." : "Les commandes et les modifications sont enregistrées dans ce navigateur."}</p>
        <div className="a-actions">
          <button className="a-btn" onClick={() => download("sauvegarde-boutique.json", JSON.stringify({ settings, orders, products }, null, 2))}>Télécharger une sauvegarde</button>
          <button className="a-btn a-danger" onClick={() => confirm("Supprimer toutes les commandes ?") && act(admin.clearOrders())}>Vider les commandes</button>
        </div>
      </section>
    </>
  );
}
