"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer } from "lucide-react";

/** Plaquinhas com QR Code por mesa: cada uma abre o cardápio com a mesa já escolhida (/?mesa=N). */
export function TableQrCodes({ count, logo, storeName, enabled, siteUrl }: { count: number; logo: string; storeName: string; enabled: boolean; siteUrl: string }) {
  const [codes, setCodes] = useState<{ n: number; url: string; svg: string }[]>([]);

  useEffect(() => {
    const base = (siteUrl || window.location.origin).replace(/\/$/, "");
    Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const url = `${base}/?mesa=${i + 1}`;
        const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#070707", light: "#ffffff" } });
        return { n: i + 1, url, svg };
      })
    ).then(setCodes);
  }, [count, siteUrl]);

  return (
    <div className="min-h-dvh bg-cream-50 p-6 text-ink-950 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-4xl tracking-wide">QR CODES DAS MESAS</h1>
          <p className="text-sm text-ink-500">
            {count} mesas. Imprima, recorte e cole em cada mesa.
            {!enabled && <b className="text-red-600"> Atenção: o pedido na mesa está desligado em Configurações.</b>}
          </p>
        </div>
        <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-bold text-white hover:bg-ink-800">
          <Printer className="h-4 w-4" /> Imprimir
        </button>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3 print:gap-3">
        {codes.map((c) => (
          <div key={c.n} className="flex break-inside-avoid flex-col items-center rounded-2xl border-2 border-ink-950 bg-white p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={storeName} className="h-14 w-auto" />
            <p className="mt-1 font-display text-4xl leading-none">MESA {c.n}</p>
            <div className="mt-3 w-full max-w-[180px]" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="mt-2 text-xs font-bold">Aponte a câmera e faça seu pedido</p>
            <p className="mt-0.5 break-all text-[9px] text-ink-500">{c.url}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
