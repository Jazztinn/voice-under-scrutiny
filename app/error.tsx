"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="chip">Error</span>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        That didn&apos;t land.
      </h1>
      <p className="text-muted-foreground">
        Something went wrong on our side. Try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn-emboss mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
      >
        Retry
      </button>
    </main>
  );
}
