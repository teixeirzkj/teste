import "server-only";
import type { Db } from "./db";
import { json } from "./db";
import { hashPassword } from "./password";
import type { Addon, Settings, Size } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "Pizzaria São Paulo",
  tagline: "Feita para ser lembrada",
  logo: "/logo.webp",
  phone: "(74) 99949-6531",
  whatsapp: "74999496531",
  address: "Andaraí",
  city: "Piritiba - BA",
  instagram: "",
  facebook: "",
  email: "",
  hoursText: "Terça a domingo, das 18h às 23h",
  days: [0, 2, 3, 4, 5, 6],
  deliveryFee: 500,
  minOrder: 0,
  deliveryTime: "40–60 min",
  payments: [
    { id: "pix", name: "Pix", active: true, allowChange: false },
    { id: "dinheiro", name: "Dinheiro", active: true, allowChange: true },
    { id: "credito", name: "Cartão de crédito", active: true, allowChange: false },
    { id: "debito", name: "Cartão de débito", active: true, allowChange: false },
  ],
  whatsappHeader: "",
  whatsappFooter: "Obrigado pela preferência! 🍕",
  isOpen: true,
  openMessage: "Estamos recebendo pedidos!",
  closedMessage: "Estamos fechados no momento.",
  defaultCostPercent: 45,
};

const R = (v: number) => Math.round(v * 100);
const pizzaSizes = (p: number, m: number, g: number, f: number, old?: number): Size[] => [
  { name: "Pequena", price: R(p) },
  { name: "Média", price: R(m) },
  { name: "Grande", price: R(g), oldPrice: old ? R(old) : null },
  { name: "Família", price: R(f) },
];
const single = (v: number, old?: number): Size[] => [{ name: "Único", price: R(v), oldPrice: old ? R(old) : null }];

export const PIZZA_ADDONS: Addon[] = [
  { name: "Catupiry", price: 600 },
  { name: "Cheddar", price: 600 },
  { name: "Bacon", price: 700 },
  { name: "Calabresa", price: 600 },
  { name: "Queijo extra", price: 600 },
  { name: "Borda recheada de catupiry", price: 1000 },
  { name: "Borda recheada de cheddar", price: 1000 },
];
const SWEET_ADDONS: Addon[] = [
  { name: "Leite condensado", price: 400 },
  { name: "Morango extra", price: 600 },
  { name: "Borda de chocolate", price: 1000 },
];

type SeedProduct = {
  name: string;
  description: string;
  ingredients: string[];
  image: string;
  sizes: Size[];
  addons?: Addon[];
  promo?: boolean;
  best?: boolean;
  isNew?: boolean;
};

const CATALOG: { name: string; image: string; products: SeedProduct[] }[] = [
  {
    name: "Pizzas",
    image: "/img/calabresa.webp",
    products: [
      {
        name: "Calabresa",
        description: "A clássica que nunca sai de moda, com calabresa fatiada e cebola.",
        ingredients: ["Molho de tomate", "Mussarela", "Calabresa", "Cebola", "Orégano"],
        image: "/img/calabresa.webp",
        sizes: pizzaSizes(32.9, 42.9, 52.9, 64.9),
        best: true,
      },
      {
        name: "Frango com Catupiry",
        description: "Frango desfiado temperado coberto com o legítimo Catupiry.",
        ingredients: ["Molho de tomate", "Mussarela", "Frango desfiado", "Catupiry", "Orégano"],
        image: "/img/frango-catupiry.webp",
        sizes: pizzaSizes(34.9, 44.9, 54.9, 66.9),
        best: true,
      },
      {
        name: "Mussarela",
        description: "Muito queijo, rodelas de tomate e orégano. Simples e perfeita.",
        ingredients: ["Molho de tomate", "Mussarela", "Tomate", "Orégano"],
        image: "/img/mussarela.webp",
        sizes: pizzaSizes(29.9, 38.9, 48.9, 59.9),
      },
      {
        name: "Margherita",
        description: "Tomate, mussarela e manjericão fresco com um fio de azeite.",
        ingredients: ["Molho de tomate", "Mussarela", "Tomate", "Manjericão fresco", "Azeite"],
        image: "/img/margherita.webp",
        sizes: pizzaSizes(32.9, 42.9, 52.9, 64.9),
      },
      {
        name: "Portuguesa",
        description: "Recheio generoso de presunto, ovos, cebola, ervilha e azeitona.",
        ingredients: ["Molho de tomate", "Mussarela", "Presunto", "Ovos", "Cebola", "Ervilha", "Azeitona"],
        image: "/img/portuguesa.webp",
        sizes: pizzaSizes(34.9, 44.9, 54.9, 66.9),
        best: true,
      },
      {
        name: "Pepperoni",
        description: "Fatias de pepperoni levemente picante sobre mussarela derretida.",
        ingredients: ["Molho de tomate", "Mussarela", "Pepperoni", "Orégano"],
        image: "/img/pepperoni.webp",
        sizes: pizzaSizes(36.9, 46.9, 56.9, 69.9),
        isNew: true,
      },
      {
        name: "Bacon com Cebola",
        description: "Bacon crocante, cebola roxa e muito queijo.",
        ingredients: ["Molho de tomate", "Mussarela", "Bacon", "Cebola roxa", "Orégano"],
        image: "/img/bacon-cebola.webp",
        sizes: pizzaSizes(34.9, 44.9, 54.9, 66.9),
      },
    ],
  },
  {
    name: "Pizzas Especiais",
    image: "/img/sao-paulo-especial.webp",
    products: [
      {
        name: "São Paulo",
        description: "A assinatura da casa: búfala, rúcula, burrata e parmesão.",
        ingredients: ["Molho de tomate", "Mussarela de búfala", "Rúcula", "Burrata", "Parmesão", "Azeite"],
        image: "/img/sao-paulo-especial.webp",
        sizes: pizzaSizes(42.9, 54.9, 66.9, 79.9),
        best: true,
        isNew: true,
      },
      {
        name: "Quatro Queijos",
        description: "Mussarela, provolone, parmesão e catupiry. Puxa-puxa garantido.",
        ingredients: ["Mussarela", "Provolone", "Parmesão", "Catupiry"],
        image: "/img/quatro-queijos.webp",
        sizes: pizzaSizes(38.9, 48.9, 54.9, 72.9, 62.9),
        promo: true,
      },
      {
        name: "Rúcula com Tomate Seco",
        description: "Rúcula fresca, tomate seco e mussarela de búfala.",
        ingredients: ["Molho de tomate", "Mussarela de búfala", "Rúcula", "Tomate seco", "Parmesão"],
        image: "/img/rucula-tomate-seco.webp",
        sizes: pizzaSizes(39.9, 49.9, 59.9, 72.9),
      },
      {
        name: "Napolitana",
        description: "Tomate, parmesão e manjericão sobre mussarela.",
        ingredients: ["Molho de tomate", "Mussarela", "Tomate", "Parmesão", "Manjericão"],
        image: "/img/napolitana.webp",
        sizes: pizzaSizes(36.9, 46.9, 56.9, 69.9),
      },
      {
        name: "Toscana",
        description: "Calabresa artesanal, tomate cereja, manjericão e azeitona preta.",
        ingredients: ["Molho de tomate", "Mussarela", "Calabresa artesanal", "Tomate cereja", "Manjericão", "Azeitona preta"],
        image: "/img/toscana.webp",
        sizes: pizzaSizes(39.9, 49.9, 59.9, 72.9),
      },
      {
        name: "Moda da Casa",
        description: "Presunto, pimentão, milho, azeitona e catupiry.",
        ingredients: ["Molho de tomate", "Mussarela", "Presunto", "Pimentão", "Milho", "Azeitona", "Catupiry"],
        image: "/img/moda-da-casa.webp",
        sizes: pizzaSizes(38.9, 48.9, 58.9, 71.9),
      },
    ],
  },
  {
    name: "Pizzas Doces",
    image: "/img/doce-morango.webp",
    products: [
      {
        name: "Chocolate com Morango",
        description: "Chocolate ao leite cremoso com morangos frescos.",
        ingredients: ["Chocolate ao leite", "Morango", "Leite condensado"],
        image: "/img/doce-morango.webp",
        sizes: pizzaSizes(34.9, 44.9, 54.9, 66.9),
        addons: SWEET_ADDONS,
      },
      {
        name: "Brigadeiro",
        description: "Chocolate, brigadeiro de colher e granulado.",
        ingredients: ["Chocolate", "Brigadeiro", "Granulado"],
        image: "/img/doce-chocolate.webp",
        sizes: pizzaSizes(32.9, 42.9, 52.9, 64.9),
        addons: SWEET_ADDONS,
      },
    ],
  },
  {
    name: "Combos",
    image: "/img/combo-familia.webp",
    products: [
      {
        name: "Combo Família",
        description: "2 pizzas grandes tradicionais + refrigerante 2 litros.",
        ingredients: ["2 pizzas grandes", "Refrigerante 2L"],
        image: "/img/combo-familia.webp",
        sizes: single(109.9, 129.9),
        addons: [],
        promo: true,
        best: true,
      },
      {
        name: "Combo Casal",
        description: "1 pizza grande tradicional + refrigerante 1 litro.",
        ingredients: ["1 pizza grande", "Refrigerante 1L"],
        image: "/img/combo-casal.webp",
        sizes: single(59.9, 69.9),
        addons: [],
        promo: true,
      },
      {
        name: "Combo Noite de Jogo",
        description: "1 pizza família + borda recheada + refrigerante 2 litros.",
        ingredients: ["1 pizza família", "Borda recheada", "Refrigerante 2L"],
        image: "/img/pepperoni-box.webp",
        sizes: single(89.9),
        addons: [],
        isNew: true,
      },
    ],
  },
  {
    name: "Bebidas",
    image: "/img/refrigerante.webp",
    products: [
      {
        name: "Refrigerante lata 350ml",
        description: "Gelado. Consulte os sabores disponíveis.",
        ingredients: [],
        image: "/img/refri-lata.webp",
        sizes: single(6),
        addons: [],
      },
      {
        name: "Refrigerante 2 litros",
        description: "Perfeito para dividir.",
        ingredients: [],
        image: "/img/refrigerante.webp",
        sizes: single(14),
        addons: [],
      },
      {
        name: "Suco natural de laranja",
        description: "500ml, feito na hora.",
        ingredients: [],
        image: "/img/suco-laranja.webp",
        sizes: single(9),
        addons: [],
      },
      {
        name: "Limonada suíça",
        description: "500ml, cremosa e refrescante.",
        ingredients: [],
        image: "/img/limonada.webp",
        sizes: single(10),
        addons: [],
      },
      {
        name: "Suco de morango",
        description: "500ml, com fruta de verdade.",
        ingredients: [],
        image: "/img/suco-morango.webp",
        sizes: single(10),
        addons: [],
      },
    ],
  },
  {
    name: "Adicionais",
    image: "/img/borda-recheada.webp",
    products: [
      {
        name: "Borda recheada",
        description: "Catupiry ou cheddar — informe nas observações.",
        ingredients: [],
        image: "/img/borda-recheada.webp",
        sizes: single(10),
        addons: [],
      },
    ],
  },
];

/** Gerador pseudoaleatório determinístico para os dados de demonstração. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ["João Silva", "Maria Souza", "Carlos Lima", "Ana Paula", "Pedro Santos", "Juliana Rocha", "Rafael Alves", "Fernanda Dias", "Lucas Oliveira", "Camila Reis", "Bruno Costa", "Larissa Melo", "Diego Nunes", "Patrícia Gomes", "Tiago Ferreira"];
const STREETS = ["Rua Principal", "Rua da Matriz", "Av. Central", "Rua do Comércio", "Rua Nova", "Travessa São José", "Rua da Feira"];
const DISTRICTS = ["Centro", "Andaraí", "Alto da Boa Vista", "São Pedro", "Bela Vista"];

type SeedProductRow = { id: number; name: string; sizes: Size[]; ingredients: string[]; category: string };

async function seedDemoOrders(db: Db) {
  const rand = rng(20260925);
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];
  const products = (
    await db.query<SeedProductRow>(
      "SELECT p.id, p.name, p.sizes, p.ingredients, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id"
    )
  ).map((p) => ({ ...p, sizes: json<Size[]>(p.sizes, []), ingredients: json<string[]>(p.ingredients, []) }));
  const pizzas = products.filter((p) => p.category.startsWith("Pizza") || p.category === "Combos");
  const drinks = products.filter((p) => p.category === "Bebidas");
  const payments = ["Pix", "Pix", "Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"];
  const origins = ["site", "site", "site", "site", "telefone", "balcao"];

  const orders: Record<string, unknown>[] = [];
  const items: Record<string, unknown>[] = [];
  let number = 1001;
  const now = Date.now();
  const DAY = 86400000;
  for (let d = 44; d >= 0; d--) {
    const dow = new Date(now - d * DAY).getUTCDay();
    const weekend = dow === 0 || dow === 5 || dow === 6;
    const count = Math.floor(rand() * 6) + (weekend ? 9 : 4);
    for (let i = 0; i < count; i++) {
      // Horários locais entre 18h e 23h (UTC 21h–02h).
      const hourLocal = 18 + Math.floor(Math.pow(rand(), 0.8) * 5);
      const baseDay = new Date(now - d * DAY - 3 * 3600000);
      baseDay.setUTCHours(hourLocal, Math.floor(rand() * 60), 0, 0);
      const created = new Date(baseDay.getTime() + 3 * 3600000);
      if (created.getTime() > now) continue;
      const isToday = d === 0;
      const minutesAgo = (now - created.getTime()) / 60000;
      let status = "done";
      if (isToday && minutesAgo < 25) status = "pending";
      else if (isToday && minutesAgo < 50) status = "preparing";
      else if (isToday && minutesAgo < 75) status = "delivering";
      else if (rand() < 0.04) status = "canceled";

      const lines: { p: SeedProductRow; size: string; price: number; qty: number }[] = [];
      const nPizzas = rand() < 0.65 ? 1 : 2;
      for (let k = 0; k < nPizzas; k++) {
        const p = pick(pizzas);
        const s = p.sizes.length > 1 ? p.sizes[Math.min(p.sizes.length - 1, 1 + Math.floor(rand() * 3))] : p.sizes[0];
        lines.push({ p, size: s.name, price: s.price, qty: 1 });
      }
      if (rand() < 0.55) {
        const p = pick(drinks);
        lines.push({ p, size: p.sizes[0].name, price: p.sizes[0].price, qty: rand() < 0.3 ? 2 : 1 });
      }
      const subtotal = lines.reduce((a, it) => a + it.price * it.qty, 0);
      const delivery = rand() < 0.8 ? "delivery" : "pickup";
      const fee = delivery === "delivery" ? 500 : 0;
      const total = subtotal + fee;
      const payment = pick(payments);
      const address = {
        street: pick(STREETS),
        number: String(10 + Math.floor(rand() * 400)),
        district: pick(DISTRICTS),
        complement: rand() < 0.3 ? "Casa" : "",
        reference: rand() < 0.4 ? "Próximo à praça" : "",
        city: "Piritiba - BA",
      };
      const phone = `(74) 9${9000 + Math.floor(rand() * 999)}-${1000 + Math.floor(rand() * 8999)}`;
      const at = created.toISOString();
      const n = number++;
      orders.push({
        number: n,
        customer_name: pick(NAMES),
        phone,
        delivery_type: delivery,
        address,
        payment,
        change_for: payment === "Dinheiro" ? Math.ceil(total / 5000) * 5000 : null,
        subtotal,
        delivery_fee: fee,
        total,
        cost: Math.round(subtotal * 0.45),
        status,
        origin: pick(origins),
        created_at: at,
      });
      for (const it of lines) {
        items.push({
          order_number: n,
          product_id: it.p.id,
          name: it.p.name,
          category: it.p.category,
          size: it.size,
          qty: it.qty,
          unit_price: it.price,
          ingredients: it.p.ingredients,
          total: it.price * it.qty,
          cost: Math.round(it.price * it.qty * 0.45),
        });
      }
    }
  }

  // Inserção em lote (uma query para pedidos e outra para itens), rápida mesmo pela rede.
  await db.query(
    `INSERT INTO orders (number, customer_name, phone, delivery_type, address, payment, change_for, subtotal, delivery_fee, total, cost, status, origin, notes, is_demo, created_at, updated_at)
     SELECT number, customer_name, phone, delivery_type, address, payment, change_for, subtotal, delivery_fee, total, cost, status, origin, '', TRUE, created_at, created_at
     FROM jsonb_to_recordset($1::text::jsonb) AS x(number int, customer_name text, phone text, delivery_type text, address jsonb, payment text,
       change_for int, subtotal int, delivery_fee int, total int, cost int, status text, origin text, created_at timestamptz)`,
    [JSON.stringify(orders)]
  );
  await db.query(
    `INSERT INTO order_items (order_id, product_id, name, category, size, qty, unit_price, addons, ingredients, notes, total, cost)
     SELECT o.id, x.product_id, x.name, x.category, x.size, x.qty, x.unit_price, '[]'::jsonb, x.ingredients, '', x.total, x.cost
     FROM jsonb_to_recordset($1::text::jsonb) AS x(order_number int, product_id int, name text, category text, size text, qty int,
       unit_price int, ingredients jsonb, total int, cost int)
     JOIN orders o ON o.number = x.order_number`,
    [JSON.stringify(items)]
  );
  await db.query("SELECT setval('order_number_seq', GREATEST((SELECT COALESCE(MAX(number), 1000) FROM orders), 1000))");
}

export async function ensureSeed(root: Db) {
  const done = await root.query("SELECT value FROM meta WHERE key = 'seeded'");
  if (done.length) return;
  await root.tx(async (db) => {
    // Trava para duas instâncias não semearem ao mesmo tempo.
    await db.query("SELECT pg_advisory_xact_lock(424242)");
    if ((await db.query("SELECT value FROM meta WHERE key = 'seeded'")).length) return;

    await db.query("INSERT INTO settings (id, data) VALUES (1, $1::text::jsonb) ON CONFLICT (id) DO NOTHING", [JSON.stringify(DEFAULT_SETTINGS)]);

    const email = (process.env.ADMIN_EMAIL || "admin@pizzariasaopaulo.com.br").trim().toLowerCase();
    // A senha padrão está no código público: em produção ela nunca é usada.
    if (process.env.VERCEL && !process.env.ADMIN_PASSWORD) {
      throw new Error("Defina ADMIN_PASSWORD nas variáveis de ambiente da Vercel antes do primeiro acesso.");
    }
    const password = process.env.ADMIN_PASSWORD || "saopaulo2026";
    await db.query("INSERT INTO admins (name, email, password_hash, role, active) VALUES ('Administrador', $1, $2, 'admin', TRUE) ON CONFLICT (email) DO NOTHING", [
      email,
      hashPassword(password),
    ]);

    for (const [ci, cat] of CATALOG.entries()) {
      const [c] = await db.query<{ id: number }>("INSERT INTO categories (name, image, sort, active) VALUES ($1, $2, $3, TRUE) RETURNING id", [cat.name, cat.image, ci]);
      const rows = cat.products.map((p, pi) => ({
        category_id: c.id,
        name: p.name,
        description: p.description,
        ingredients: p.ingredients,
        image: p.image,
        sizes: p.sizes,
        addons: p.addons ?? PIZZA_ADDONS,
        is_promo: !!p.promo,
        is_best: !!p.best,
        is_new: !!p.isNew,
        sort: pi,
      }));
      await db.query(
        `INSERT INTO products (category_id, name, description, ingredients, image, sizes, addons, active, is_promo, is_best, is_new, sort)
         SELECT category_id, name, description, ingredients, image, sizes, addons, TRUE, is_promo, is_best, is_new, sort
         FROM jsonb_to_recordset($1::text::jsonb) AS x(category_id int, name text, description text, ingredients jsonb, image text,
           sizes jsonb, addons jsonb, is_promo boolean, is_best boolean, is_new boolean, sort int)`,
        [JSON.stringify(rows)]
      );
    }

    if (process.env.SEED_DEMO_ORDERS !== "false") await seedDemoOrders(db);
    await db.query("INSERT INTO meta (key, value) VALUES ('seeded', $1)", [new Date().toISOString()]);
  });
}
