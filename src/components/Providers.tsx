"use client";

import { MotionConfig } from "framer-motion";

/** Respeita "reduzir movimento" do sistema em todas as animações. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
