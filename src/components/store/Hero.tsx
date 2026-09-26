"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { ArrowDown, Clock, Bike, Flame } from "lucide-react";
import { useStore } from "./cart";
import { Basil, Mushroom, Olive, Pepperoni, Skyline, Tomato } from "./ingredients";
import { money } from "@/lib/format";

const SLICES = 8;

/** Polígono de uma fatia (ângulo 0 = direita, sentido horário). */
function wedge(i: number) {
  const a0 = (i * 360) / SLICES;
  const pts = [a0, a0 + 360 / SLICES / 2, a0 + 360 / SLICES].map((deg) => {
    const r = (deg * Math.PI) / 180;
    return `${50 + 75 * Math.cos(r)}% ${50 + 75 * Math.sin(r)}%`;
  });
  return `polygon(50% 50%, ${pts.join(", ")})`;
}

function Slice({ i, offset, lift }: { i: number; offset?: MotionValue<number>; lift?: boolean }) {
  const mid = ((i + 0.5) * 360) / SLICES;
  const rad = (mid * Math.PI) / 180;
  const zero = useMotionValue(0);
  const o = offset ?? zero;
  const x = useTransform(o, (v) => `${Math.cos(rad) * v}%`);
  const y = useTransform(o, (v) => `${Math.sin(rad) * v}%`);
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x,
        y,
        filter: lift ? "drop-shadow(0 18px 22px rgba(0,0,0,.55))" : undefined,
        zIndex: lift ? 2 : 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/hero-pizza.webp"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none"
        style={{ clipPath: wedge(i) }}
      />
    </motion.div>
  );
}

function splitTagline(t: string): [string, string] {
  const words = t.trim().toUpperCase().split(/\s+/);
  if (words.length < 2) return [words[0] ?? "", ""];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

/** Rolagem suave com duração controlada (para os "encaixes" do hero). */
function animateScroll(to: number, duration: number, done: () => void) {
  const from = window.scrollY;
  const start = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let cancelled = false;
  // Interrompível: qualquer toque, clique ou tecla devolve o controle ao usuário.
  const cancel = () => (cancelled = true);
  const evs = ["pointerdown", "keydown", "touchstart"] as const;
  evs.forEach((e) => window.addEventListener(e, cancel, { once: true, passive: true }));
  const finish = () => {
    evs.forEach((e) => window.removeEventListener(e, cancel));
    done();
  };
  const step = (now: number) => {
    if (cancelled) return finish();
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(step);
    else finish();
  };
  requestAnimationFrame(step);
}

const FLOATERS = [
  { C: Basil, cls: "left-[6%] top-[22%] w-14 md:w-20", speed: 0.7, rot: 90, delay: "0s" },
  { C: Tomato, cls: "left-[42%] top-[10%] w-10 md:w-14", speed: 2.2, rot: -120, delay: "-2s" },
  { C: Pepperoni, cls: "right-[6%] top-[14%] w-12 md:w-16", speed: 1.8, rot: 160, delay: "-4s" },
  { C: Olive, cls: "right-[3%] bottom-[26%] w-8 md:w-10", speed: 2.6, rot: -60, delay: "-1s" },
  { C: Basil, cls: "right-[30%] bottom-[8%] w-12 md:w-16 hidden md:block", speed: 1.1, rot: -140, delay: "-3s" },
  { C: Mushroom, cls: "left-[34%] bottom-[12%] w-10 md:w-12 hidden md:block", speed: 2, rot: 70, delay: "-5s" },
  { C: Tomato, cls: "left-[3%] bottom-[18%] w-9 md:w-12", speed: 2.4, rot: 200, delay: "-2.5s" },
];

const LABELS = [
  { text: "Molho de tomate artesanal", cls: "right-[88%] top-[14%]", align: "right" },
  { text: "Mussarela derretida", cls: "left-[92%] top-[30%]", align: "left" },
  { text: "Manjericão fresco", cls: "right-[90%] bottom-[18%]", align: "right" },
  { text: "Massa de longa fermentação", cls: "left-[86%] bottom-[10%]", align: "left" },
] as const;

export function Hero() {
  const { settings } = useStore();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 160, damping: 30, mass: 0.35 });

  // Pizza
  const rotate = useTransform(p, [0, 1], [0, 220]);
  const scale = useTransform(p, [0, 0.5, 1], isDesktop ? [1, 1.16, 1.5] : [1, 1.06, 1.18]);
  const tilt = useTransform(p, [0, 0.5, 1], isDesktop ? [0, 30, 16] : [0, 20, 12]);
  const px = useTransform(p, [0, 0.5, 1], isDesktop ? ["0vw", "-13vw", "-13vw"] : ["0vw", "0vw", "0vw"]);
  const py = useTransform(p, [0, 0.5, 1], isDesktop ? ["0vh", "2vh", "-22vh"] : ["0vh", "6vh", "16vh"]);
  const slice1 = useTransform(p, [0.1, 0.5, 0.9], isDesktop ? [0, 13, 18] : [0, 8, 10]);
  const slice2 = useTransform(p, [0.2, 0.55, 0.9], isDesktop ? [0, 6, 10] : [0, 4, 6]);
  const glow = useTransform(p, [0, 0.5, 1], [0.55, 0.9, 0.3]);

  // Textos e camadas
  const bgY = useTransform(p, [0, 1], ["0%", "-18%"]);
  const bgScale = useTransform(p, [0, 1], [1, 1.14]);
  const bgOpacity = useTransform(p, [0, 0.6, 1], [1, 0.75, 0.2]);
  const copyOpacity = useTransform(p, [0, 0.28], [1, 0]);
  const copyY = useTransform(p, [0, 0.3], [0, -70]);
  const labelsOpacity = useTransform(p, [0.24, 0.38, 0.66, 0.8], [0, 1, 1, 0]);
  const labelsScale = useTransform(p, [0.24, 0.4], [0.9, 1]);
  const hintOpacity = useTransform(p, [0, 0.06], [1, 0]);
  const shade = useTransform(p, [0.7, 1], [0, 0.55]);
  const skyY = useTransform(p, [0, 1], ["0%", "30%"]);

  // Encaixe: 1ª rolagem -> estado 2, 2ª rolagem -> cardápio.
  useEffect(() => {
    if (reduce) return;
    let busy = false;
    const onWheel = (e: WheelEvent) => {
      const section = ref.current;
      const menu = document.getElementById("cardapio");
      if (!section || !menu || e.ctrlKey || Math.abs(e.deltaY) < 2) return;
      if (document.body.style.overflow === "hidden") return;
      const top = section.offsetTop;
      const range = section.offsetHeight - window.innerHeight;
      const mid = top + range * 0.5;
      const menuTop = menu.offsetTop - 64;
      const y = window.scrollY;
      const down = e.deltaY > 0;
      if (down && y >= menuTop - 4) return;
      if (!down && (y > menuTop + 4 || y <= top + 1)) return;
      e.preventDefault();
      if (busy) return;
      let target: number;
      if (down) target = y < mid - 8 ? mid : menuTop;
      else target = y > mid + 8 ? mid : top;
      busy = true;
      const dist = Math.abs(target - y);
      animateScroll(target, Math.min(1200, 520 + dist * 0.45), () => {
        // Segura a inércia do trackpad por um instante.
        window.setTimeout(() => (busy = false), 260);
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [reduce]);

  const goToMenu = () => {
    const menu = document.getElementById("cardapio");
    if (!menu) return;
    animateScroll(menu.offsetTop - 64, 1000, () => {});
  };

  const [line1, line2] = splitTagline(settings.tagline || "Feita para ser lembrada");
  const title = settings.storeName.replace(/^pizzaria\s+/i, "").toUpperCase() || "SÃO PAULO";

  return (
    <section id="inicio" ref={ref} className="relative h-[122svh] lg:h-[170svh]">
      <div className="grain sticky top-0 h-svh overflow-hidden bg-ink-950">
        {/* Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_62%_55%,#2a1a07_0%,#120c05_35%,#070707_70%)] max-lg:bg-[radial-gradient(ellipse_at_50%_58%,#2a1a07_0%,#120c05_40%,#070707_75%)]" />
        <motion.div
          style={{ opacity: glow }}
          className="absolute left-1/2 top-[63%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/25 blur-[110px] lg:left-[64%] lg:top-[64%]"
        />
        <motion.div style={{ y: skyY }} className="absolute inset-x-0 bottom-0 text-gold-500/[0.07]">
          <Skyline className="h-[26vh] w-full" />
        </motion.div>

        {/* Nome gigante no fundo */}
        <motion.div
          style={{ y: bgY, scale: bgScale, opacity: bgOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[31%] select-none text-center lg:top-[16%]"
          aria-hidden
        >
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.9em" }}
            animate={{ opacity: 1, letterSpacing: "0.55em" }}
            transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
            className="font-display text-[4.2vw] leading-none text-gold-400/70 lg:text-[2.1vw]"
          >
            PIZZARIA
          </motion.p>
          <div className="overflow-hidden pt-[3vw]">
            <motion.h2
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-outline-gold font-display text-[25vw] leading-[0.9] tracking-tight lg:text-[19vw]"
            >
              {title}
            </motion.h2>
          </div>
        </motion.div>

        {/* Ingredientes flutuantes */}
        {FLOATERS.map((f, i) => (
          <FloatItem key={i} index={i} p={p} {...f} />
        ))}
        {/* Farinha */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 animate-drift rounded-full bg-white/60 blur-[1px]"
              style={{ left: `${(i * 37) % 100}%`, top: `${40 + ((i * 53) % 55)}%`, animationDelay: `${-i * 1.3}s` }}
            />
          ))}
        </div>

        {/* Pizza */}
        <motion.div
          style={{ x: px, y: py }}
          className="absolute left-1/2 top-[63%] -translate-x-1/2 -translate-y-1/2 [perspective:1400px] lg:left-[64%] lg:top-[64%]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.55, rotate: -140, y: 60 }}
            animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.25 }}
            className="relative aspect-square w-[74vw] max-w-[390px] lg:w-[min(36vw,58vh)] lg:max-w-none"
          >
            <motion.div style={{ scale, rotateX: tilt }} className="absolute inset-0 [transform-style:preserve-3d]">
              <div className="absolute inset-[4%] translate-y-[7%] rounded-full bg-black/80 blur-2xl" />
              <motion.div style={{ rotate }} className="absolute inset-0">
                <div className="absolute inset-0 animate-spin-slow motion-reduce:animate-none">
                  {Array.from({ length: SLICES }).map((_, i) => (
                    <Slice
                      key={i}
                      i={i}
                      offset={i === 1 ? slice1 : i === 5 ? slice2 : undefined}
                      lift={i === 1 && isDesktop}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Etiquetas dos ingredientes (revelados no 2º estado) */}
            <motion.div style={{ opacity: labelsOpacity, scale: labelsScale }} className="pointer-events-none absolute inset-0 hidden lg:block">
              {LABELS.map((l) => (
                <div key={l.text} className={`absolute ${l.cls} flex items-center gap-2 whitespace-nowrap ${l.align === "right" ? "flex-row-reverse" : ""}`}>
                  <span className="h-2.5 w-2.5 rounded-full bg-gold-400 shadow-[0_0_0_6px_rgba(245,194,56,.18)]" />
                  <span className="h-px w-10 bg-gradient-to-r from-gold-400/80 to-gold-400/0" />
                  <span className="rounded-full border border-white/10 bg-ink-900/70 px-3.5 py-1.5 text-sm font-semibold text-white/90 backdrop-blur">
                    {l.text}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Texto + CTA */}
        <motion.div
          style={{ opacity: copyOpacity, y: copyY }}
          className="absolute inset-x-0 top-[88px] z-10 px-5 max-lg:text-center sm:top-[110px] lg:inset-x-auto lg:left-[6vw] lg:top-auto lg:bottom-[14%] lg:max-w-[40vw] lg:px-0"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="flex flex-col max-lg:items-center"
          >
            <span
              className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur max-lg:hidden ${
                settings.isOpen ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-flame-500/30 bg-flame-500/10 text-flame-400"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${settings.isOpen ? "animate-pulse bg-emerald-400" : "bg-flame-500"}`} />
              {settings.isOpen ? settings.openMessage : settings.closedMessage}
            </span>
            <h1 className="font-display text-[13vw] leading-[0.88] tracking-tight sm:text-7xl lg:text-[6.2vw]">
              <span className="block">{line1}</span>
              <span className="text-gold block">{line2}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65 max-lg:hidden lg:text-base">
              Massa de longa fermentação, ingredientes selecionados e forno bem quente. Direto de Andaraí para a sua mesa.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 max-lg:hidden">
              <button onClick={goToMenu} className="btn btn-flame h-14 px-8 text-base">
                PEDIR AGORA
              </button>
              <button onClick={goToMenu} className="btn btn-ghost h-14 px-7 text-base">
                Ver cardápio
              </button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55 max-lg:hidden">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-400" /> {settings.deliveryTime}
              </span>
              <span className="inline-flex items-center gap-2">
                <Bike className="h-4 w-4 text-gold-400" /> Entrega {settings.deliveryFee ? money(settings.deliveryFee) : "grátis"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Flame className="h-4 w-4 text-gold-400" /> Feita na hora
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA mobile (fixo na base do hero) */}
        <motion.div
          style={{ opacity: copyOpacity }}
          className="absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-3 px-5 lg:hidden"
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur ${
              settings.isOpen ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-flame-500/30 bg-flame-500/10 text-flame-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${settings.isOpen ? "animate-pulse bg-emerald-400" : "bg-flame-500"}`} />
            {settings.isOpen ? settings.openMessage : settings.closedMessage}
          </span>
          <button onClick={goToMenu} className="btn btn-flame h-14 w-full max-w-sm text-base">
            PEDIR AGORA
          </button>
        </motion.div>

        {/* Indicador de rolagem */}
        <motion.button
          onClick={goToMenu}
          style={{ opacity: hintOpacity }}
          className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/45 lg:flex"
        >
          Role para explorar
          <ArrowDown className="h-4 w-4 animate-bounce text-gold-400" />
        </motion.button>

        <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />
      </div>
    </section>
  );
}

function FloatItem({
  index,
  p,
  C,
  cls,
  speed,
  rot,
  delay,
}: {
  index: number;
  p: MotionValue<number>;
  C: (props: { className?: string }) => React.JSX.Element;
  cls: string;
  speed: number;
  rot: number;
  delay: string;
}) {
  const y = useTransform(p, [0, 1], [0, -260 * speed]);
  const r = useTransform(p, [0, 1], [0, rot]);
  const o = useTransform(p, [0, 0.8, 1], [1, 0.9, 0]);
  return (
    <motion.div style={{ y, rotate: r, opacity: o }} className={`pointer-events-none absolute ${cls}`}>
      <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + index * 0.07, duration: 0.8 }}>
        <div className="animate-float drop-shadow-[0_12px_18px_rgba(0,0,0,.6)]" style={{ animationDelay: delay }}>
          <C className="h-auto w-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
