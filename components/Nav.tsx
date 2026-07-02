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
    <header>
      <nav className="relative flex w-full items-center justify-between px-6 py-4">
        <Link href="/" className="font-brand text-3xl text-accent">
          Voice Under Scrutiny
        </Link>
        <div className="flex gap-2">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`group relative overflow-hidden rounded-full border-2 border-accent px-4 py-1.5 text-sm font-bold uppercase tracking-wide ${
                  active ? "text-accent-foreground" : "text-accent"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 origin-bottom bg-accent transition-transform duration-300 ease-out ${
                    active
                      ? "scale-y-100"
                      : "scale-y-0 group-hover:scale-y-100"
                  }`}
                />
                <span
                  className={`relative transition-colors duration-300 ${
                    active ? "" : "group-hover:text-accent-foreground"
                  }`}
                >
                  {l.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
