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
      <nav className="relative flex w-full flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="font-brand text-2xl leading-none text-accent sm:text-3xl">
          Voice Under Scrutiny
        </Link>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`group relative overflow-hidden rounded-full border-2 border-accent px-2 py-2 text-center text-xs font-bold uppercase tracking-wide sm:px-4 sm:py-1.5 sm:text-sm ${
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
