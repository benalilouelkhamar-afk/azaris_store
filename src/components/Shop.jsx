import { useEffect, useState } from "react";
import { useStore, money, discount, typeLabel } from "../store.jsx";

const hideBroken = (e) => (e.currentTarget.style.visibility = "hidden");
export const Img = ({ src, alt = "", className = "" }) => (
  <img className={className} src={src} alt={alt} loading="lazy" onError={hideBroken} />
);

export function Header({ onCart }) {
  const { settings, cartCount } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(scrollY > 10);
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  const close = () => setOpen(false);
  return (
    <>
      {settings.topbar && <div className="topbar">{settings.topbar}</div>}
      <header className={"header" + (scrolled ? " scrolled" : "")}>
        <div className="wrap header-in">
          <a href="#top" className="logo">{settings.name}</a>
          <nav className={"nav" + (open ? " open" : "")} onClick={close}>
            <a href="#collection" data-filter="shoes">Souliers</a>
            <a href="#collection" data-filter="sandals">Sabots</a>
            <a href="#maison">La maison</a>
            <a href="#aide">Aide</a>
          </nav>
          <div className="header-r">
            <button className="cart-link" onClick={onCart}>Panier ({cartCount})</button>
            <button className="menu-btn" onClick={() => setOpen(!open)}>{open ? "Fermer" : "Menu"}</button>
          </div>
        </div>
      </header>
    </>
  );
}

export function ProductCard({ p, onOpen }) {
  const { settings } = useStore();
  const off = discount(p);
  return (
    <article className="card" tabIndex={0} onClick={() => onOpen(p.id)} onKeyDown={(e) => e.key === "Enter" && onOpen(p.id)}>
      <div className="card-m">
        <Img className="main" src={p.images[0]} alt={p.name} />
        <Img className="alt" src={p.images[1] || p.images[0]} />
        {off > 0 && <span className="card-off">-{off}%</span>}
        {p.stock === 0 && <span className="card-off sold">Épuisé</span>}
      </div>
      <div className="card-b">
        <div className="card-t">{typeLabel(p)}</div>
        <h3>{p.name}</h3>
        <div className="card-row">
          <span className="card-p">{money(p.price, settings.currency)}{p.oldPrice > p.price && <s>{money(p.oldPrice, settings.currency)}</s>}</span>
          <span className="card-go">Choisir</span>
        </div>
      </div>
    </article>
  );
}

export function ProductModal({ id, onClose, onAdded, onBuy }) {
  const { byId, settings, addToCart, wa } = useStore();
  const p = byId(id);
  const [img, setImg] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  useEffect(() => { setImg(0); setSize(null); setQty(1); setErr(""); }, [id]);
  if (!p) return null;
  const soldOut = p.stock === 0;
  const go = (buy) => {
    if (!size) return setErr("Veuillez choisir votre pointure.");
    addToCart(p.id, size, qty);
    buy ? onBuy() : onAdded(`${p.name} a été ajouté au panier.`);
  };
  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={p.name}>
        <button className="close" onClick={onClose}>Fermer</button>
        <div className="m-gal">
          <div className="m-main"><Img key={p.images[img]} src={p.images[img]} alt={p.name} /></div>
          <div className="m-thumbs">
            {p.images.map((src, i) => (
              <button key={src + i} className={i === img ? "on" : ""} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`}><Img src={src} /></button>
            ))}
          </div>
        </div>
        <div className="m-info">
          <p className="small">{typeLabel(p)}</p>
          <h2>{p.name}</h2>
          <p className="m-price">
            {money(p.price, settings.currency)}{" "}
            {p.oldPrice > p.price && <><s>{money(p.oldPrice, settings.currency)}</s> <span className="m-off">-{discount(p)}%</span></>}
          </p>
          <p className="m-desc">{p.desc}</p>
          <div className="m-label"><span>Pointure</span><a href={wa("Bonjour, j'aimerais un conseil pour choisir ma pointure.")} target="_blank" rel="noopener">Guide des pointures</a></div>
          <div className="sizes">
            {p.sizes.map((s) => <button key={s} className={s === size ? "on" : ""} onClick={() => { setSize(s); setErr(""); }}>{s}</button>)}
          </div>
          <p className="m-error">{err}</p>
          {soldOut ? (
            <p className="m-note">Ce modèle est momentanément épuisé.</p>
          ) : (
            <>
              <div className="m-actions">
                <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Moins">−</button><span>{qty}</span><button onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Plus">+</button></div>
                <button className="btn btn-gold grow" onClick={() => go(false)}>Ajouter au panier</button>
              </div>
              <button className="btn btn-line full" onClick={() => go(true)}>Commander maintenant</button>
            </>
          )}
          {p.specs?.length > 0 && <ul className="m-specs">{p.specs.map((s) => <li key={s}>{s}</li>)}</ul>}
          {!soldOut && <p className="m-note">{p.stock <= 25 ? `Plus que ${p.stock} paires disponibles.` : "En stock."}</p>}
        </div>
      </div>
    </div>
  );
}

const PHONE_RE = /^(\+212|00212|0)[5-7]\d{8}$/;

export function CartDrawer({ open, step, setStep, onClose, onDone }) {
  const { cartLines, subtotal, shipping, setQty, removeLine, settings, placeOrder } = useStore();
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [bad, setBad] = useState({});
  const [err, setErr] = useState("");
  const cur = settings.currency;
  const total = subtotal + shipping;
  const checkout = step === "checkout" && cartLines.length > 0;

  const submit = (e) => {
    e.preventDefault();
    const phone = form.phone.replace(/[\s.()-]/g, "");
    const ok = { name: form.name.trim().length >= 3, phone: PHONE_RE.test(phone), city: form.city.trim().length >= 2, address: form.address.trim().length >= 5 };
    const b = Object.fromEntries(Object.entries(ok).filter(([, v]) => !v).map(([k]) => [k, true]));
    setBad(b);
    if (Object.keys(b).length) return setErr(!ok.phone && ok.name ? "Numéro de téléphone invalide." : "Veuillez remplir tous les champs.");
    setErr("");
    const { url } = placeOrder({ name: form.name.trim(), phone, city: form.city.trim(), address: form.address.trim() });
    window.open(url, "_blank");
    setForm({ name: "", phone: "", city: "", address: "" });
    onDone("Merci, votre commande a été préparée dans WhatsApp.");
  };
  const field = (k) => ({ name: k, value: form[k], className: bad[k] ? "bad" : "", onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <>
      <div className={"overlay side" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open} aria-label="Panier">
        <div className="d-head"><h3>{checkout ? "Livraison" : "Panier"}</h3><button className="close" onClick={onClose}>Fermer</button></div>
        {!checkout ? (
          <>
            <div className="d-body">
              {cartLines.length === 0 ? (
                <div className="empty"><h4>Votre panier est vide</h4><p>Découvrez nos modèles.</p><a className="btn btn-line" href="#collection" onClick={onClose}>Voir la collection</a></div>
              ) : cartLines.map((l, i) => (
                <div className="ci" key={l.id + l.size}>
                  <div className="ci-img"><Img src={l.product.images[0]} alt={l.product.name} /></div>
                  <div><h4>{l.product.name}</h4><small>Pointure {l.size}</small>
                    <div className="qty"><button onClick={() => setQty(i, l.qty - 1)} aria-label="Moins">−</button><span>{l.qty}</span><button onClick={() => setQty(i, l.qty + 1)} aria-label="Plus">+</button></div></div>
                  <div className="ci-r"><b>{money(l.product.price * l.qty, cur)}</b><button className="ci-del" onClick={() => removeLine(i)}>Retirer</button></div>
                </div>
              ))}
            </div>
            {cartLines.length > 0 && (
              <div className="d-foot">
                <div className="totals">
                  <div><span>Sous-total</span><span>{money(subtotal, cur)}</span></div>
                  <div><span>Livraison</span><span>{shipping ? money(shipping, cur) : "Offerte"}</span></div>
                  <div className="grand"><span>Total</span><span>{money(total, cur)}</span></div>
                </div>
                <button className="btn btn-gold full" onClick={() => setStep("checkout")}>Passer la commande</button>
              </div>
            )}
          </>
        ) : (
          <form className="d-body checkout" onSubmit={submit} noValidate>
            <button type="button" className="text-link back" onClick={() => setStep("cart")}>Retour au panier</button>
            <div className="co-sum">
              {cartLines.map((l) => <div key={l.id + l.size}><span>{l.product.name}, pointure {l.size} × {l.qty}</span><b>{money(l.product.price * l.qty, cur)}</b></div>)}
            </div>
            <div className="co-total"><span>Total à payer à la livraison</span><span>{money(total, cur)}</span></div>
            <label>Nom complet<input autoComplete="name" {...field("name")} /></label>
            <label>Téléphone<input type="tel" autoComplete="tel" placeholder="06 00 00 00 00" {...field("phone")} /></label>
            <label>Ville<input list="cities" {...field("city")} /></label>
            <datalist id="cities">{["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan", "Salé", "Nador", "El Jadida", "Béni Mellal", "Safi", "Mohammedia", "Laâyoune", "Khouribga"].map((c) => <option key={c}>{c}</option>)}</datalist>
            <label>Adresse<textarea rows={2} {...field("address")} /></label>
            <p className="m-error">{err}</p>
            <button className="btn btn-gold full" type="submit">Confirmer la commande</button>
            <p className="d-note">Votre commande s'ouvre dans WhatsApp : appuyez sur Envoyer. Nous vous appelons ensuite pour la confirmer.</p>
          </form>
        )}
      </aside>
    </>
  );
}

export function Toast({ text }) {
  return <div className={"toast" + (text ? " show" : "")}>{text}</div>;
}
