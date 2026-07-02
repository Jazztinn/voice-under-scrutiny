"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Practice" },
  { href: "/community", label: "Community" },
  { href: "/history", label: "History" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 pl-16">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-foreground">
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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
