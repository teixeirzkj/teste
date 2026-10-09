"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Addon, Category, Product, Settings } from "@/lib/types";

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  image: string | null;
  size: string;
  unitPrice: number; // estimativa exibida; o servidor recalcula no pedido
  addons: Addon[];
  /** Sabores extras (pizza fracionada). O sabor principal é o próprio produto. */
  flavors?: { id: number; name: string }[];
  notes: string;
  qty: number;
};

type StoreData = { settings: Settings; categories: Category[]; products: Product[] };

type Ctx = StoreData & {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key">) => void;
  replace: (key: string, item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  modal: { product: Product; editing?: CartItem } | null;
  openProduct: (product: Product, editing?: CartItem) => void;
  closeProduct: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  /** Mesa do cliente (QR Code da mesa: /?mesa=10). */
  table: number | null;
};

const StoreCtx = createContext<Ctx | null>(null);
const KEY = "psp-cart-v1";

export function StoreProvider({ data, children }: { data: StoreData; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [modal, setModal] = useState<Ctx["modal"]>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [table, setTable] = useState<number | null>(null);

  // Lê a mesa do link do QR Code e lembra durante a visita.
  useEffect(() => {
    const { tablesEnabled, tableCount } = data.settings;
    if (!tablesEnabled) return;
    let n = Number(new URLSearchParams(window.location.search).get("mesa"));
    try {
      if (n) sessionStorage.setItem("psp-mesa", String(n));
      else n = Number(sessionStorage.getItem("psp-mesa"));
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Number.isInteger(n) && n >= 1 && n <= tableCount) setTable(n);
  }, [data.settings]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as CartItem[];
        // Descarta itens de produtos que não existem mais.
        const ids = new Set(data.products.map((p) => p.id));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(saved.filter((i) => ids.has(i.productId)));
      }
    } catch {}
    setLoaded(true);
  }, [data.products]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    setItems((cur) => {
      const same = cur.find(
        (c) =>
          c.productId === item.productId &&
          c.size === item.size &&
          c.notes === item.notes &&
          (c.flavors ?? []).map((f) => f.id).sort().join() === (item.flavors ?? []).map((f) => f.id).sort().join() &&
          c.addons.map((a) => a.name).sort().join() === item.addons.map((a) => a.name).sort().join()
      );
      if (same) return cur.map((c) => (c === same ? { ...c, qty: Math.min(50, c.qty + item.qty) } : c));
      return [...cur, { ...item, key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
      add,
      replace: (key, item) => setItems((cur) => cur.map((c) => (c.key === key ? { ...item, key } : c))),
      setQty: (key, qty) =>
        setItems((cur) => (qty <= 0 ? cur.filter((c) => c.key !== key) : cur.map((c) => (c.key === key ? { ...c, qty: Math.min(50, qty) } : c)))),
      remove: (key) => setItems((cur) => cur.filter((c) => c.key !== key)),
      clear: () => setItems([]),
      cartOpen,
      setCartOpen,
      modal,
      openProduct: (product, editing) => setModal({ product, editing }),
      closeProduct: () => setModal(null),
      toast,
      showToast,
      table,
    }),
    [data, items, add, cartOpen, modal, toast, showToast, table]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fora do StoreProvider");
  return c;
}

/** Trava o scroll do body enquanto um modal está aberto. */
export function useLockBody(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
