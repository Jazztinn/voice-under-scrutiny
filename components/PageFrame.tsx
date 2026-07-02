"use client";

import { useEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";

// Reveal footer: the footer is `position: fixed; bottom: 0`, permanently
// painted at the viewport bottom with no document-flow height of its own.
// The content panel reserves that height back via `margin-bottom`, which
// gives the document real extra scroll room. Once scrolled that far, the
// content panel's own bottom edge has receded above the viewport bottom,
// exposing the footer beneath it — 1:1 with scroll position, no separate
// animation.
export default function PageFrame({ children }: { children: React.ReactNode }) {
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setFooterHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className="relative z-10 flex min-h-svh flex-col overflow-hidden rounded-[1.75rem] bg-background text-foreground"
        style={{ marginBottom: footerHeight }}
      >
        {children}
      </div>
      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-0 px-2 pb-2 sm:px-3 sm:pb-3"
      >
        <div className="overflow-hidden rounded-[1.75rem] bg-background text-foreground">
          <Footer />
        </div>
      </div>
    </>
  );
}
