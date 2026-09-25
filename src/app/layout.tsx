import type { Metadata, Viewport } from "next";
import { Anton, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "Pizzaria São Paulo — Andaraí, Piritiba/BA",
  description: "Pizza feita na hora, ingredientes selecionados e entrega rápida. Peça pelo cardápio online e finalize no WhatsApp.",
  openGraph: {
    title: "Pizzaria São Paulo",
    description: "Feita para ser lembrada. Peça sua pizza online.",
    images: ["/img/hero-pizza.webp"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070707",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${anton.variable} ${manrope.variable}`}>
      <body className="min-h-dvh">
        <a href="#conteudo" className="sr-only z-[100] rounded-full bg-gold-400 px-4 py-2 font-bold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
