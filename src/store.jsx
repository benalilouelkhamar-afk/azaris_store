import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from "./data/defaults.js";
import { supabase, hasBackend, fromDbProduct, toDbProduct, fromDbOrder, toDbOrder } from "./supabase.js";

const K = { products: "azaris_products", settings: "azaris_settings", cart: "azaris_cart", orders: "azaris_orders" };
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const persist = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } };

export const money = (n, cur = "DH") => Number(n || 0).toLocaleString("fr-FR") + " " + cur;
export const discount = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const typeLabel = (p) => (p.category === "shoes" ? "Soulier" : "Sabot");
export const ORDER_STATUS = ["Nouvelle", "Confirmée", "Expédiée", "Livrée", "Annulée"];
export const newOrderId = () => "CMD-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
const { adminPassword: _pw, ...PUBLIC_DEFAULTS } = DEFAULT_SETTINGS;

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => (hasBackend ? [] : load(K.products, DEFAULT_PRODUCTS)));
  const [settings, setSettings] = useState(() => (hasBackend ? PUBLIC_DEFAULTS : { ...DEFAULT_SETTINGS, ...load(K.settings, {}) }));
  const [cart, setCart] = useState(() => load(K.cart, []));
  const [orders, setOrders] = useState(() => (hasBackend ? [] : load(K.orders, [])));
  const [loading, setLoading] = useState(hasBackend);
  const [loadError, setLoadError] = useState("");
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------- local persistence ---------- */
  useEffect(() => persist(K.cart, cart), [cart]);
  useEffect(() => { if (!hasBackend) persist(K.products, products); }, [products]);
  useEffect(() => { if (!hasBackend) persist(K.settings, settings); }, [settings]);
  useEffect(() => { if (!hasBackend) persist(K.orders, orders); }, [orders]);

  /* ---------- backend: catalogue + settings ---------- */
  const fetchCatalog = useCallback(async () => {
    if (!hasBackend) return;
    const [p, s] = await Promise.all([
      supabase.from("products").select("*").order("sort").order("created_at"),
      supabase.from("settings").select("data").eq("id", 1).maybeSingle()
    ]);
    if (p.error) setLoadError("Impossible de charger les produits.");
    else setProducts(p.data.map(fromDbProduct));
    if (s.data?.data) setSettings({ ...PUBLIC_DEFAULTS, ...s.data.data });
    setLoading(false);
  }, []);
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  /* ---------- backend: auth ---------- */
  useEffect(() => {
    if (!hasBackend) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!hasBackend || !session) { setIsAdmin(false); return; }
    setIsAdmin(null); // en cours de vérification
    supabase.from("admins").select("user_id").eq("user_id", session.user.id).maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  /* ---------- backend: orders for admins (with realtime) ---------- */
  const fetchOrders = useCallback(async () => {
    if (!hasBackend) return;
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(1000);
    if (!error) setOrders(data.map(fromDbOrder));
  }, []);
  useEffect(() => {
    if (!hasBackend || !isAdmin) return;
    fetchOrders();
    fetchCatalog();
    const ch = supabase.channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (pl) => {
        if (pl.eventType === "INSERT") setOrders((os) => (os.some((o) => o.id === pl.new.id) ? os : [fromDbOrder(pl.new), ...os]));
        if (pl.eventType === "UPDATE") setOrders((os) => os.map((o) => (o.id === pl.new.id ? fromDbOrder(pl.new) : o)));
        if (pl.eventType === "DELETE") setOrders((os) => os.filter((o) => o.id !== pl.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, fetchOrders, fetchCatalog]);

  /* ---------- derived ---------- */
  const byId = useCallback((id) => products.find((p) => p.id === id), [products]);
  const visible = useMemo(() => products.filter((p) => !p.hidden), [products]);
  const cartLines = useMemo(() => cart.map((i) => ({ ...i, product: byId(i.id) })).filter((l) => l.product), [cart, byId]);
  const subtotal = cartLines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = cartLines.length ? Number(settings.shippingFee) || 0 : 0;
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const wa = useCallback((text) => "https://wa.me/" + settings.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""), [settings.whatsapp]);

  /* ---------- cart ---------- */
  const addToCart = (id, size, qty = 1) =>
    setCart((c) => {
      const ex = c.find((i) => i.id === id && i.size === size);
      if (ex) return c.map((i) => (i === ex ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
      return [...c, { id, size, qty }];
    });
  const setQty = (idx, qty) => setCart((c) => (qty < 1 ? c.filter((_, i) => i !== idx) : c.map((x, i) => (i === idx ? { ...x, qty: Math.min(10, qty) } : x))));
  const removeLine = (idx) => setCart((c) => c.filter((_, i) => i !== idx));

  /* ---------- checkout ---------- */
  // Returns the WhatsApp URL synchronously (so the browser does not block the new tab);
  // the order is saved in the background.
  function placeOrder(customer) {
    const order = {
      id: newOrderId(),
      date: new Date().toISOString(),
      items: cartLines.map((l) => ({ id: l.id, name: l.product.name, size: l.size, qty: l.qty, price: l.product.price })),
      subtotal, shipping, total: subtotal + shipping, customer, status: "Nouvelle", note: ""
    };
    const cur = settings.currency;
    const msg = [
      `Nouvelle commande ${settings.name} (${order.id})`, "",
      ...order.items.map((i) => `- ${i.name}, pointure ${i.size}, quantité ${i.qty} : ${money(i.price * i.qty, cur)}`), "",
      `Sous-total : ${money(subtotal, cur)}`,
      `Livraison : ${shipping ? money(shipping, cur) : "offerte"}`,
      `Total : ${money(order.total, cur)}`, "",
      `Nom : ${customer.name}`, `Téléphone : ${customer.phone}`, `Ville : ${customer.city}`, `Adresse : ${customer.address}`, "",
      "Paiement à la livraison"
    ].join("\n");

    if (hasBackend) {
      supabase.rpc("place_order", {
        p_id: order.id,
        p_items: order.items.map(({ id, size, qty }) => ({ id, size, qty })),
        p_customer: customer
      }).then(({ error }) => { if (error) console.warn("Commande non enregistrée :", error.message); });
    } else {
      setOrders((o) => [order, ...o]);
    }
    setProducts((ps) => ps.map((p) => {
      const sold = order.items.filter((i) => i.id === p.id).reduce((s, i) => s + i.qty, 0);
      return sold ? { ...p, stock: Math.max(0, (p.stock || 0) - sold) } : p;
    }));
    setCart([]);
    return { order, url: wa(msg) };
  }

  /* ---------- admin actions ---------- */
  const fail = (error) => { if (error) throw new Error(error.message); };
  const admin = {
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      fail(error);
    },
    async signOut() { if (hasBackend) await supabase.auth.signOut(); },
    async saveProduct(prod, isNew) {
      if (hasBackend) {
        const sort = isNew ? products.length : undefined;
        const { data, error } = await supabase.from("products").upsert(toDbProduct(prod, sort)).select().single();
        fail(error);
        prod = fromDbProduct(data);
      }
      setProducts((ps) => (isNew ? [...ps, prod] : ps.map((p) => (p.id === prod.id ? prod : p))));
    },
    async updateProduct(id, patch) {
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      if (hasBackend) {
        const map = { stock: "stock", hidden: "hidden", price: "price", oldPrice: "old_price" };
        const cols = Object.fromEntries(Object.entries(patch).filter(([k]) => map[k]).map(([k, v]) => [map[k], v]));
        const { error } = await supabase.from("products").update(cols).eq("id", id);
        fail(error);
      }
    },
    async deleteProduct(id) {
      if (hasBackend) fail((await supabase.from("products").delete().eq("id", id)).error);
      setProducts((ps) => ps.filter((p) => p.id !== id));
    },
    async resetCatalog() {
      if (hasBackend) {
        fail((await supabase.from("products").upsert(DEFAULT_PRODUCTS.map((p, i) => toDbProduct(p, i)))).error);
        await fetchCatalog();
      } else setProducts(DEFAULT_PRODUCTS);
    },
    async saveSettings(next) {
      if (hasBackend) {
        const { adminPassword, ...data } = next;
        fail((await supabase.from("settings").upsert({ id: 1, data })).error);
        setSettings({ ...PUBLIC_DEFAULTS, ...data });
      } else setSettings(next);
    },
    async updateOrder(id, patch) {
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, ...patch } : o)));
      if (hasBackend) fail((await supabase.from("orders").update(patch).eq("id", id)).error);
    },
    async addOrder(order) {
      if (hasBackend) fail((await supabase.from("orders").insert(toDbOrder(order))).error);
      setOrders((os) => [order, ...os.filter((o) => o.id !== order.id)]);
    },
    async deleteOrder(id) {
      if (hasBackend) fail((await supabase.from("orders").delete().eq("id", id)).error);
      setOrders((os) => os.filter((o) => o.id !== id));
    },
    async clearOrders() {
      if (hasBackend) fail((await supabase.from("orders").delete().neq("id", "")).error);
      setOrders([]);
    },
    refresh: () => Promise.all([fetchOrders(), fetchCatalog()])
  };

  const value = {
    hasBackend, loading, loadError, session, isAdmin,
    products, visible, byId,
    settings,
    cart, cartLines, cartCount, subtotal, shipping, addToCart, setQty, removeLine,
    orders, placeOrder, wa, admin
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
