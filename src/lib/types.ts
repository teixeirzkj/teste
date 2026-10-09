// Tipos compartilhados entre servidor e cliente.
// Todos os valores monetários são inteiros em centavos.

/** flavors: quantos sabores cabem nesse tamanho (ex.: P = 2, M = 3, G = 3). */
export type Size = { name: string; price: number; oldPrice?: number | null; flavors?: number };
/** Sabor de uma pizza fracionada (meio a meio / 1/3). */
export type Flavor = { productId: number; name: string; description: string };
export type Addon = { name: string; price: number };

export type Category = {
  id: number;
  name: string;
  image: string | null;
  sort: number;
  active: boolean;
};

export type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  ingredients: string[];
  image: string | null;
  sizes: Size[];
  addons: Addon[];
  costPercent: number | null;
  active: boolean;
  isPromo: boolean;
  isBest: boolean;
  isNew: boolean;
  sort: number;
};

export type PaymentMethod = {
  id: string;
  name: string;
  active: boolean;
  allowChange: boolean;
};

export type Settings = {
  storeName: string;
  tagline: string;
  logo: string;
  heroImage: string; // pizza redonda da abertura do site
  aboutImage: string; // foto da seção "Sobre nós"
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  instagram: string;
  facebook: string;
  email: string;
  hoursText: string;
  days: number[]; // 0 = domingo
  deliveryFee: number;
  minOrder: number;
  deliveryTime: string;
  payments: PaymentMethod[];
  whatsappHeader: string;
  whatsappFooter: string;
  isOpen: boolean;
  openMessage: string;
  closedMessage: string;
  defaultCostPercent: number;
  /** Pedidos na mesa (cardápio digital dentro da pizzaria). */
  tablesEnabled: boolean;
  tableCount: number;
  /** Impressão: endereço (webhook) que recebe o pedido para imprimir na maquininha. */
  printWebhookUrl: string;
  printWebhookToken: string;
  printOnSiteOrder: boolean;
  printOnNewSale: boolean;
};

export type Address = {
  street: string;
  number: string;
  district: string;
  complement: string;
  reference: string;
  city: string;
};

export type OrderStatus = "pending" | "preparing" | "delivering" | "done" | "canceled";
export type OrderOrigin = "site" | "mesa" | "balcao" | "telefone" | "whatsapp";
export type DeliveryType = "delivery" | "pickup" | "table";

export type OrderItem = {
  id: number;
  productId: number | null;
  name: string;
  category: string;
  size: string;
  qty: number;
  unitPrice: number;
  addons: Addon[];
  notes: string;
  ingredients: string[];
  flavors: Flavor[];
  total: number;
};

export type Order = {
  id: number;
  number: number;
  customerName: string;
  phone: string;
  deliveryType: DeliveryType;
  tableNumber: number | null;
  address: Address;
  payment: string;
  changeFor: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  cost: number;
  status: OrderStatus;
  origin: OrderOrigin;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type AdminRole = "admin" | "atendente";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pendente",
  preparing: "Em preparo",
  delivering: "Saiu para entrega",
  done: "Finalizado",
  canceled: "Cancelado",
};

export const ORIGIN_LABEL: Record<OrderOrigin, string> = {
  site: "Site",
  balcao: "Balcão",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  mesa: "Mesa",
};

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
