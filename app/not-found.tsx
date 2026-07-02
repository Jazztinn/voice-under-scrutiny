import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="chip">404</span>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Nothing to hear here.
      </h1>
      <p className="text-muted-foreground">
        That page doesn&apos;t exist — but your next pitch does.
      </p>
      <Link
        href="/"
        className="btn-emboss mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        Back to practice
      </Link>
    </main>
  );
}
