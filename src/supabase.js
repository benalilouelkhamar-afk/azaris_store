import { createClient } from "@supabase/supabase-js";

// URL et clé publique (anon) du projet Supabase.
// Elles se règlent dans le fichier .env (voir .env.example) ou dans les variables d'environnement de l'hébergeur.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const hasBackend = !!supabase;

/* ---------- conversions base <-> application ---------- */
export const fromDbProduct = (r) => ({
  id: r.id, name: r.name, code: r.code, category: r.category, tag: r.tag,
  price: Number(r.price), oldPrice: Number(r.old_price), stock: r.stock,
  desc: r.description, specs: r.specs || [], sizes: r.sizes || [], images: r.images || [],
  hidden: r.hidden, sort: r.sort
});
export const toDbProduct = (p, sort = 0) => ({
  id: p.id, name: p.name, code: p.code || "", category: p.category, tag: p.tag || "",
  price: p.price, old_price: p.oldPrice || 0, stock: p.stock, description: p.desc || "",
  specs: p.specs || [], sizes: p.sizes || [], images: p.images || [], hidden: !!p.hidden, sort: p.sort ?? sort
});
export const fromDbOrder = (r) => ({
  id: r.id, date: r.created_at, items: r.items, subtotal: Number(r.subtotal), shipping: Number(r.shipping), total: Number(r.total),
  customer: { name: r.customer_name, phone: r.customer_phone, city: r.customer_city, address: r.customer_address },
  status: r.status, note: r.note || ""
});
export const toDbOrder = (o) => ({
  id: o.id, created_at: o.date, items: o.items, subtotal: o.subtotal, shipping: o.shipping, total: o.total,
  customer_name: o.customer.name, customer_phone: o.customer.phone, customer_city: o.customer.city || "",
  customer_address: o.customer.address || "", status: o.status, note: o.note || ""
});

export async function uploadImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
}
