// Tipos compartilhados entre servidor e cliente.
// Todos os valores monetários são inteiros em centavos.

export type Size = { name: string; price: number; oldPrice?: number | null };
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
export type OrderOrigin = "site" | "balcao" | "telefone" | "whatsapp";
export type DeliveryType = "delivery" | "pickup";

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
  total: number;
};

export type Order = {
  id: number;
  number: number;
  customerName: string;
  phone: string;
  deliveryType: DeliveryType;
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
};

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
