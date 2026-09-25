"use client";

import { StoreProvider } from "./cart";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { MenuSection } from "./Menu";
import { ProductModal } from "./ProductModal";
import { CartDrawer } from "./CartDrawer";
import { About, Benefits, FinalCta, FloatingCart, Footer, Toast } from "./Sections";
import type { Category, Product, Settings } from "@/lib/types";

export function Storefront(data: { settings: Settings; categories: Category[]; products: Product[] }) {
  return (
    <StoreProvider data={data}>
      <Header />
      <main id="conteudo">
        <Hero />
        <MenuSection />
        <Benefits />
        <About />
        <FinalCta />
      </main>
      <Footer />
      <FloatingCart />
      <ProductModal />
      <CartDrawer />
      <Toast />
    </StoreProvider>
  );
}
