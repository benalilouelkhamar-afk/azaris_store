import { useEffect, useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { Header, ProductCard, ProductModal, CartDrawer, Toast, Img } from "../components/Shop.jsx";

const FILTERS = [{ id: "all", label: "Tout" }, { id: "shoes", label: "Souliers" }, { id: "sandals", label: "Sabots" }];

export default function Home() {
  const { visible, byId, settings, wa } = useStore();
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState("cart");
  const [toast, setToast] = useState("");
  const tt = useRef();

  useEffect(() => { document.title = `${settings.name} | Mocassins, derbies et sabots`; }, [settings.name]);
  useEffect(() => { document.body.classList.toggle("lock", !!modal || cartOpen); }, [modal, cartOpen]);
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && (setModal(null), setCartOpen(false));
    const filt = (e) => { const a = e.target.closest("[data-filter]"); if (a) setFilter(a.dataset.filter); };
    addEventListener("keydown", esc); document.addEventListener("click", filt);
    return () => { removeEventListener("keydown", esc); document.removeEventListener("click", filt); };
  }, []);

  const showToast = (t) => { setToast(t); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(""), 2800); };
  const openCart = (s = "cart") => { setModal(null); setStep(s); setCartOpen(true); };
  const list = filter === "all" ? visible : visible.filter((p) => p.category === filter);
  const pick = (id, i = 0) => byId(id)?.images[i] || visible[0]?.images[0];
  const sizeHelp = wa("Bonjour, j'aimerais un conseil pour choisir ma pointure.");
  const waFmt = "+" + settings.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  const minPrice = visible.length ? Math.min(...visible.map((p) => p.price)) : 0;

  return (
    <>
      <Header onCart={() => openCart("cart")} />
      <main id="top">
        <section className="hero wrap">
          <div className="hero-txt">
            <p className="small">Collection 2026</p>
            <h1>Le cuir qui<br />raconte <em>votre</em><br />chemin.</h1>
            <p className="lead">Des souliers pensés comme des objets de famille : une coupe juste, des finitions soignées et une patine qui s'embellit à chaque pas.</p>
            <div className="hero-cta">
              <a href="#collection" className="btn btn-gold">Voir la collection</a>
              <a className="text-link" href={sizeHelp} target="_blank" rel="noopener">Conseil pointure</a>
            </div>
            <dl className="hero-info">
              <div><dt>À partir de</dt><dd>{minPrice} {settings.currency}</dd></div>
              <div><dt>Pointures</dt><dd>36 à 46</dd></div>
              <div><dt>Livraison</dt><dd>24 à 72h</dd></div>
            </dl>
          </div>
          <div className="hero-visual">
            <button className="arch" onClick={() => setModal("chunky-brownie-90s")}><Img src={pick("chunky-brownie-90s")} alt="" /></button>
            <button className="inset" onClick={() => setModal("atlass-98")}><Img src={pick("atlass-98")} alt="" /></button>
          </div>
        </section>

        <section className="collection" id="collection">
          <div className="wrap">
            <div className="sec-head">
              <h2>Nos modèles</h2>
              <div className="filters">
                {FILTERS.map((f) => <button key={f.id} className={f.id === filter ? "on" : ""} onClick={() => setFilter(f.id)}>{f.label}</button>)}
              </div>
            </div>
            <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} onOpen={setModal} />)}</div>
          </div>
        </section>

        <section className="maison wrap" id="maison">
          <div className="maison-img"><Img src={pick("shadow-step")} alt="" /></div>
          <div className="maison-txt">
            <p className="small">La maison</p>
            <h2>Peu de modèles,<br /><em>bien choisis.</em></h2>
            <p>Chez {settings.name}, chaque paire est sélectionnée pour sa ligne, sa tenue et son confort au quotidien. Mocassins à semelle franche, derbies sur plateforme et sabots décorés à la main : des pièces faciles à porter, qui gardent leur allure avec le temps.</p>
            <p>Une question sur un modèle ou sur votre pointure ? Notre équipe vous répond directement sur WhatsApp.</p>
            <a className="btn btn-line" href={wa("Bonjour, j'ai une question sur un modèle.")} target="_blank" rel="noopener">Nous écrire</a>
          </div>
        </section>

        <section className="services wrap">
          <div><h3>Livraison 24 à 72h</h3><p>Nous livrons dans toutes les villes du Maroc. Un conseiller vous appelle avant l'expédition pour confirmer la commande.</p></div>
          <div><h3>Paiement à la livraison</h3><p>Aucun paiement en ligne. Vous réglez en espèces au livreur, à la réception de votre colis.</p></div>
          <div><h3>Échange de pointure</h3><p>La taille ne convient pas ? Contactez-nous à la réception et nous organisons l'échange.</p></div>
        </section>

        <section className="aide wrap" id="aide">
          <h2>Questions fréquentes</h2>
          <div className="faq">
            <details><summary>Comment passer commande ?</summary><p>Choisissez votre modèle et votre pointure, ajoutez-le au panier puis remplissez le formulaire (nom, téléphone, ville, adresse). Votre commande nous est envoyée sur WhatsApp et nous vous rappelons pour la confirmer.</p></details>
            <details><summary>Quels sont les frais de livraison ?</summary><p>{Number(settings.shippingFee) ? `La livraison coûte ${settings.shippingFee} ${settings.currency} partout au Maroc.` : "La livraison est offerte partout au Maroc."}</p></details>
            <details><summary>Comment choisir ma pointure ?</summary><p>Nos modèles taillent normalement. Si vous hésitez entre deux pointures, écrivez-nous sur WhatsApp avec la longueur de votre pied en centimètres.</p></details>
            <details><summary>Les sabots sont-ils tous identiques ?</summary><p>Les sabots sont décorés à la main. De légères différences d'une paire à l'autre sont possibles et font partie de leur charme.</p></details>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap foot-in">
          <div className="foot-brand"><div className="logo">{settings.name}</div><p>Mocassins, derbies et sabots livrés partout au Maroc.</p></div>
          <div><h4>Boutique</h4><a href="#collection" data-filter="shoes">Souliers</a><a href="#collection" data-filter="sandals">Sabots</a><a href="#collection" data-filter="all">Tous les modèles</a></div>
          <div><h4>Aide</h4><a href="#aide">Questions fréquentes</a><a href="#aide">Livraison et paiement</a><a href={sizeHelp} target="_blank" rel="noopener">Guide des pointures</a></div>
          <div>
            <h4>Contact</h4>
            <a href={wa()} target="_blank" rel="noopener">WhatsApp {waFmt}</a>
            {settings.email && <a href={"mailto:" + settings.email}>{settings.email}</a>}
            {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener">Instagram</a>}
            {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener">TikTok</a>}
            {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener">Facebook</a>}
          </div>
        </div>
        <div className="wrap foot-bottom"><span>© {new Date().getFullYear()} {settings.name}. Tous droits réservés.</span></div>
      </footer>

      {modal && <ProductModal id={modal} onClose={() => setModal(null)} onAdded={(t) => { setModal(null); showToast(t); }} onBuy={() => openCart("checkout")} />}
      <CartDrawer open={cartOpen} step={step} setStep={setStep} onClose={() => setCartOpen(false)} onDone={(t) => { setCartOpen(false); setStep("cart"); showToast(t); }} />

      <a className="wa-float" href={wa("Bonjour")} target="_blank" rel="noopener" aria-label="WhatsApp">
        <svg viewBox="0 0 32 32" width="26" height="26"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.3z" /></svg>
      </a>
      <Toast text={toast} />
    </>
  );
}
