import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from "./data/defaults.js";

const K = { products: "azaris_products", settings: "azaris_settings", cart: "azaris_cart", orders: "azaris_orders" };

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}

export const money = (n, cur = "DH") => Number(n || 0).toLocaleString("fr-FR") + " " + cur;
export const discount = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const typeLabel = (p) => (p.category === "shoes" ? "Soulier" : "Sabot");
export const ORDER_STATUS = ["Nouvelle", "Confirmée", "Expédiée", "Livrée", "Annulée"];

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => load(K.products, DEFAULT_PRODUCTS));
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load(K.settings, {}) }));
  const [cart, setCart] = useState(() => load(K.cart, []));
  const [orders, setOrders] = useState(() => load(K.orders, []));

  useEffect(() => persist(K.products, products), [products]);
  useEffect(() => persist(K.settings, settings), [settings]);
  useEffect(() => persist(K.cart, cart), [cart]);
  useEffect(() => persist(K.orders, orders), [orders]);

  const byId = useCallback((id) => products.find((p) => p.id === id), [products]);
  const visible = useMemo(() => products.filter((p) => !p.hidden), [products]);
  const cartLines = useMemo(() => cart.map((i) => ({ ...i, product: byId(i.id) })).filter((l) => l.product), [cart, byId]);
  const subtotal = cartLines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const shipping = cartLines.length ? Number(settings.shippingFee) || 0 : 0;
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const wa = useCallback((text) => "https://wa.me/" + settings.whatsapp + (text ? "?text=" + encodeURIComponent(text) : ""), [settings.whatsapp]);

  const addToCart = (id, size, qty = 1) =>
    setCart((c) => {
      const ex = c.find((i) => i.id === id && i.size === size);
      if (ex) return c.map((i) => (i === ex ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
      return [...c, { id, size, qty }];
    });
  const setQty = (idx, qty) => setCart((c) => (qty < 1 ? c.filter((_, i) => i !== idx) : c.map((x, i) => (i === idx ? { ...x, qty: Math.min(10, qty) } : x))));
  const removeLine = (idx) => setCart((c) => c.filter((_, i) => i !== idx));

  function placeOrder(customer) {
    const order = {
      id: "CMD-" + Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      items: cartLines.map((l) => ({ id: l.id, name: l.product.name, size: l.size, qty: l.qty, price: l.product.price })),
      subtotal,
      shipping,
      total: subtotal + shipping,
      customer,
      status: "Nouvelle",
      note: ""
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
    setOrders((o) => [order, ...o]);
    setProducts((ps) => ps.map((p) => {
      const sold = order.items.filter((i) => i.id === p.id).reduce((s, i) => s + i.qty, 0);
      return sold ? { ...p, stock: Math.max(0, (p.stock || 0) - sold) } : p;
    }));
    setCart([]);
    return { order, url: wa(msg) };
  }

  const value = {
    products, setProducts, visible, byId,
    settings, setSettings,
    cart, cartLines, cartCount, subtotal, shipping, addToCart, setQty, removeLine,
    orders, setOrders, placeOrder, wa,
    resetCatalog: () => setProducts(DEFAULT_PRODUCTS)
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
