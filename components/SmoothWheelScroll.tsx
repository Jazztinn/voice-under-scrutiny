"use client";

import { useEffect, useRef } from "react";

const LINE_HEIGHT_PX = 40;
const MOUSE_WHEEL_THRESHOLD = 24;
const SMOOTHING = 0.18;

function wheelDeltaToPixels(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * LINE_HEIGHT_PX;
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }
  return event.deltaY;
}

function hasScrollableAncestor(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  for (let el: Element | null = target; el; el = el.parentElement) {
    if (el === document.documentElement || el === document.body) return false;

    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll =
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      el.scrollHeight > el.clientHeight;

    if (canScroll) return true;
  }

  return false;
}

export default function SmoothWheelScroll() {
  const targetYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const tick = () => {
      const current = window.scrollY;
      const diff = targetYRef.current - current;

      if (Math.abs(diff) < 0.5) {
        window.scrollTo(0, targetYRef.current);
        rafRef.current = null;
        return;
      }

      window.scrollTo(0, current + diff * SMOOTHING);
      rafRef.current = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (
        event.defaultPrevented ||
        !event.cancelable ||
        event.ctrlKey ||
        event.metaKey ||
        hasScrollableAncestor(event.target)
      ) {
        return;
      }

      const delta = wheelDeltaToPixels(event);

      // Trackpads already emit small, high-frequency deltas; only smooth the
      // larger notched-wheel jumps that feel abrupt.
      if (Math.abs(delta) < MOUSE_WHEEL_THRESHOLD) return;

      event.preventDefault();
      targetYRef.current = Math.min(
        Math.max(targetYRef.current || window.scrollY, 0) + delta,
        maxScroll()
      );

      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const syncTarget = () => {
      targetYRef.current = window.scrollY;
    };

    syncTarget();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", syncTarget);
    window.addEventListener("keydown", stop);
    window.addEventListener("pointerdown", stop);

    return () => {
      stop();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", syncTarget);
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
    };
  }, []);

  return null;
}
