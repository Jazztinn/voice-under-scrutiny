"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Practice" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-neutral-800">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-100">
          <span aria-hidden>🎤</span>
          <span>Voice Under Scrutiny</span>
        </Link>
        <div className="flex gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
