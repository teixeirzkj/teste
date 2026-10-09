import "server-only";
import type { Db } from "./db";
import { json } from "./db";
import { slugify } from "../format";
import { hashPassword } from "./password";
import type { Settings, Size } from "../types";

export const DEFAULT_SETTINGS: Settings = {
  storeName: "Pizzaria São Paulo",
  tagline: "Feita para ser lembrada",
  logo: "/logo.webp",
  heroImage: "/img/hero-pizza.webp",
  aboutImage: "/img/sobre.webp",
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
  tablesEnabled: false,
  tableCount: 10,
  printWebhookUrl: "",
  printWebhookToken: "",
  printOnSiteOrder: true,
  printOnNewSale: true,
};

const R = (v: number) => Math.round(v * 100);

/**
 * Tamanhos das pizzas: preço do cardápio = Pequena; Média +R$ 5; Grande +R$ 15.
 * Pequena aceita até 2 sabores (meio a meio); Média e Grande até 3 (1/3 cada).
 */
export const pizzaSizes = (p: number): Size[] => [
  { name: "Pequena", price: R(p), flavors: 2 },
  { name: "Média", price: R(p + 5), flavors: 3 },
  { name: "Grande", price: R(p + 15), flavors: 3 },
];
const single = (v: number): Size[] => [{ name: "Único", price: R(v) }];

type SeedProduct = {
  name: string;
  description: string;
  image: string;
  sizes: Size[];
  best?: boolean;
  soldOut?: boolean; // "Esgotado" no cardápio antigo: entra desativado
};

/** Caminho da foto padrão de um produto (arquivos em public/img/produtos). */
const photo = (name: string) => `/img/produtos/${slugify(name.replace(/\(.*?\)/g, "").replace(/[.\s-]+$/, ""))}.webp`;

const pz = (name: string, description: string, price: number, image: string, extra: Partial<SeedProduct> = {}): SeedProduct => ({
  name,
  description,
  image: photo(name),
  sizes: pizzaSizes(price),
  ...extra,
});
const drink = (name: string, price: number, image: string, extra: Partial<SeedProduct> = {}): SeedProduct => ({
  name,
  description: "",
  image: photo(name),
  sizes: single(price),
  ...extra,
});

/** Cardápio da Pizzaria São Paulo (conforme o cardápio que o cliente usa hoje). */
const CATALOG: { name: string; image: string; products: SeedProduct[] }[] = [
  {
    name: "Pizzas",
    image: photo("Calabresa com Mussarela"),
    products: [
      pz("Atum Sólido", "Atum em pedaços com mussarela e tomate, com ou sem cebola!", 45, "bacon-cebola"),
      pz("Brócolis com Palmito", "Brócolis com palmito e catupiry ervas finas.", 40, "sao-paulo-especial"),
      pz("Amoda Dra. (Especial da Casa)", "Lombinho, cebola, milho, mussarela, rodelas de tomate e parmesão.", 40, "moda-da-casa"),
      pz("1 Alho e Óleo (Especial da Casa)", "Alho frito com parmesão ralado.", 40, "mussarela"),
      pz("A Moda da Casa (Especial da Casa)", "Ovo, requeijão, bacon e parmesão ralado. Atenção alérgicos: contém ovos!", 42, "cta-pizza"),
      pz("A Moda do Mestre (Especial da Casa)", "Rocambole de frango recheado com presunto.", 40, "moda-da-casa", { soldOut: true }),
      pz("Brócolis Especial (Especial da Casa)", "Brócolis com requeijão, bacon e tomate com um toque de gorgonzola.", 42, "rucula-tomate-seco"),
      pz("Brócolis Tradicional", "Brócolis com mussarela e tomate.", 40, "sao-paulo-especial"),
      pz("Baiana Tradicional", "Calabresa moída com ou sem cebola, coberta com mussarela.", 40, "pepperoni-box"),
      pz("Bacon", "Bacon com mussarela.", 40, "bacon-cebola"),
      pz("Calabresa com Mussarela", "Calabresa com mussarela e com ou sem cebola.", 40, "calabresa", { best: true }),
      pz("Calabresa com Requeijão", "Calabresa fatiada coberta com requeijão, com ou sem cebola.", 40, "calabresa"),
      pz("Champignon (Especial da Casa)", "Champignon (cogumelo) coberto com requeijão e com mussarela.", 43, "cta-pizza", { soldOut: true }),
      pz("Calafrango Paulista (Especial da Casa)", "Calabresa fatiada, frango desfiado coberto com requeijão e mussarela, com ou sem cebola.", 40, "frango-catupiry"),
      pz("Calabresa Tradicional", "Calabresa acebolada ou sem cebola, sem mussarela.", 40, "calabresa"),
      pz("Calabresa Especial (Especial da Casa)", "Linguiça de pernil coberta com mussarela, com ou sem cebola.", 40, "toscana"),
      pz("Frango com Requeijão Cremoso (Especial da Casa)", "Frango desfiado coberto com requeijão cremoso puro. Original (sem amido e sem gordura hidrogenada).", 40, "frango-catupiry", { best: true }),
      pz("Frango com Catupiry Original (Especial da Casa)", "Frango desfiado coberto com queijo da marca Catupiry original.", 42, "frango-catupiry"),
      pz("Frango com Mussarela", "Frango desfiado com mussarela.", 40, "mussarela"),
      pz("Frango com Milho", "Frango desfiado coberto com milho e com mussarela.", 40, "frango-catupiry"),
      pz("Frango com Bacon (Especial da Casa)", "Frango desfiado coberto com mussarela e/ou requeijão, intercalado com bacon fatiado.", 42, "bacon-cebola"),
      pz("Fim de Noite a Pizza (Especial da Casa)", "Brócolis, milho, calabresa fatiada, mussarela, cheddar, requeijão cremoso, bacon, tomate e cebola.", 42, "moda-da-casa"),
      pz("Glutão (Especial da Casa)", "Lombo fresco recheado com presunto, salame, bacon, pimentões e coberto com mussarela.", 42, "portuguesa", { soldOut: true }),
      pz("Imperial (Especial da Casa)", "Calabresa fatiada, milho, ovos, bacon, tomate e cebola.", 40, "portuguesa"),
      pz("Lombinho ao Alho", "Lombo canadense ao alho frito, coberto com provolone gratinado e parmesão fresco ralado.", 40, "borda-recheada"),
      pz("Lombinho com Requeijão", "Lombo canadense com requeijão catupiry e parmesão ralado.", 40, "quatro-queijos"),
      pz("Lombinho com Catupiry", "Lombinho com catupiry original (duro).", 42, "quatro-queijos"),
      pz("Lombo Fresco 2 (Tradicional da Casa)", "Lombo fresco recheado com calabresa, coberto com mussarela.", 40, "portuguesa", { soldOut: true }),
      pz("Mussarela", "Queijo mussarela e orégano.", 40, "mussarela"),
      pz("Marguerita", "Mussarela, rodelas de tomate e manjericão.", 40, "margherita"),
      pz("Milho Verde", "Mussarela, milho, rodelas de tomate e manjericão.", 40, "margherita"),
      pz("Napolitana", "Mussarela, molho, rodelas de tomate e queijo parmesão ralado.", 40, "napolitana"),
      pz("Portuguesa (Tradicional da PSP)", "Presunto, ovos, cebola, mussarela e rodelas de tomate.", 40, "portuguesa"),
      pz("Portuguesa Especial (Especial da Casa)", "Peito de peru defumado, ovos, cebola, requeijão cremoso e mussarela.", 42, "portuguesa"),
      pz("Peito de Peru (Especial da Casa)", "Peito de peru defumado com requeijão cremoso e cereja. Obs.: pizza agridoce!", 43, "cta-pizza"),
      pz("Pepperoni (Especial da Casa)", "Delicioso pepperoni artesanal com queijo derretido em massa crocante, um clássico irresistível.", 42, "pepperoni", { best: true }),
      pz("Paulista (Especial da Casa)", "Lombinho canadense, cebola, requeijão e provolone.", 42, "cta-pizza"),
      pz("Palmito (Especial da Casa)", "Palmito em rodelas ou em filetes, coberto com requeijão, cheddar, mussarela ou queijo provolone.", 45, "mussarela"),
      pz("Salame Italiano", "Salame tipo italiano com mussarela ou requeijão.", 42, "pepperoni"),
      pz("Toscana (Especial da Casa)", "Mussarela com linguiça toscana, parmesão e cebola.", 40, "toscana"),
      pz("4 Queijos (Especial da Casa)", "Mussarela, requeijão, parmesão e provolone.", 40, "quatro-queijos"),
      pz("5 Queijos (Especial da Casa)", "Mussarela, requeijão, parmesão.", 42, "quatro-queijos"),
      pz("6 Queijos (Especial da Casa)", "Mussarela, requeijão, parmesão, gorgonzola, cheddar e provolone.", 42, "quatro-queijos", { soldOut: true }),
    ],
  },
  {
    name: "Esfiha Aberta",
    image: photo("Esfiha"),
    products: [{ name: "Esfiha", description: "Esfiha tipo Habib's.", image: photo("Esfiha"), sizes: single(5) }],
  },
  {
    name: "Bebidas",
    image: photo("Guaraná litro"),
    products: [
      drink("Água mineral", 2, "bebida-agua"),
      drink("Bohemia lata", 4, "bebida-bohemia", { soldOut: true }),
      drink("Brahma lata", 4, "bebida-brahma"),
      drink("Skol lata", 4, "bebida-skol"),
      drink("Original lata", 5, "bebida-original"),
      drink("Soda limão", 7, "bebida-soda"),
      drink("Sukita laranja", 7, "bebida-sukita"),
      drink("Guaraná litro", 7, "bebida-guarana"),
      drink("Pepsi litro", 7, "bebida-pepsi"),
    ],
  },
];

/** Versão do cardápio inicial: ao mudar, bancos já criados recebem o cardápio novo. */
const CATALOG_VERSION = "2";
/** Versão das fotos padrão dos produtos. */
const IMAGES_VERSION = "2";

async function ensureImages(root: Db) {
  const [v] = await root.query<{ value: string }>("SELECT value FROM meta WHERE key = 'images_version'");
  if (v?.value === IMAGES_VERSION) return;
  const rows = CATALOG.flatMap((c) => c.products.map((p) => ({ name: p.name, image: p.image })));
  await root.query(
    `UPDATE products p SET image = x.image, updated_at = NOW()
     FROM jsonb_to_recordset($1::text::jsonb) AS x(name text, image text)
     WHERE p.name = x.name AND (p.image IS NULL OR p.image LIKE '/img/%')`,
    [JSON.stringify(rows)]
  );
  // Imagens das categorias também (só as padrão).
  await root.query(
    `UPDATE categories c SET image = x.image
     FROM jsonb_to_recordset($1::text::jsonb) AS x(name text, image text)
     WHERE c.name = x.name AND (c.image IS NULL OR c.image LIKE '/img/%')`,
    [JSON.stringify(CATALOG.map((c) => ({ name: c.name, image: c.image })))]
  );
  await root.query("INSERT INTO meta (key, value) VALUES ('images_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [IMAGES_VERSION]);
}

async function insertCatalog(db: Db) {
  for (const [ci, cat] of CATALOG.entries()) {
    const [c] = await db.query<{ id: number }>("INSERT INTO categories (name, image, sort, active) VALUES ($1, $2, $3, TRUE) RETURNING id", [cat.name, cat.image, ci]);
    const rows = cat.products.map((p, pi) => ({
      category_id: c.id,
      name: p.name,
      description: p.description,
      ingredients: [],
      image: p.image,
      sizes: p.sizes,
      addons: [],
      active: !p.soldOut,
      is_best: !!p.best,
      sort: pi,
    }));
    await db.query(
      `INSERT INTO products (category_id, name, description, ingredients, image, sizes, addons, active, is_promo, is_best, is_new, sort)
       SELECT category_id, name, description, ingredients, image, sizes, addons, active, FALSE, is_best, FALSE, sort
       FROM jsonb_to_recordset($1::text::jsonb) AS x(category_id int, name text, description text, ingredients jsonb, image text,
         sizes jsonb, addons jsonb, active boolean, is_best boolean, sort int)`,
      [JSON.stringify(rows)]
    );
  }
}


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
  const pizzas = products.filter((p) => p.category === "Pizzas");
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

/**
 * Banco já existente com cardápio de versão anterior: troca categorias e produtos pelo cardápio atual.
 * Pedidos reais são mantidos (os itens guardam nome e preço); os de demonstração são refeitos.
 */
async function ensureCatalog(root: Db) {
  const [v] = await root.query<{ value: string }>("SELECT value FROM meta WHERE key = 'catalog_version'");
  if (v?.value === CATALOG_VERSION) return;
  await root.tx(async (db) => {
    await db.query("SELECT pg_advisory_xact_lock(424243)");
    const [again] = await db.query<{ value: string }>("SELECT value FROM meta WHERE key = 'catalog_version'");
    if (again?.value === CATALOG_VERSION) return;
    const [{ n: demo }] = await db.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM orders WHERE is_demo");
    await db.query("DELETE FROM orders WHERE is_demo");
    await db.query("DELETE FROM products");
    await db.query("DELETE FROM categories");
    await insertCatalog(db);
    if (demo > 0) {
      const [{ n: real }] = await db.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM orders");
      if (real === 0) await seedDemoOrders(db);
    }
    await db.query("INSERT INTO meta (key, value) VALUES ('catalog_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [CATALOG_VERSION]);
  });
}

export async function ensureSeed(root: Db) {
  const done = await root.query("SELECT value FROM meta WHERE key = 'seeded'");
  if (done.length) {
    await ensureCatalog(root);
    return ensureImages(root);
  }
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

    await insertCatalog(db);
    await db.query("INSERT INTO meta (key, value) VALUES ('catalog_version', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [CATALOG_VERSION]);

    if (process.env.SEED_DEMO_ORDERS !== "false") await seedDemoOrders(db);
    await db.query("INSERT INTO meta (key, value) VALUES ('seeded', $1)", [new Date().toISOString()]);
  });
}
