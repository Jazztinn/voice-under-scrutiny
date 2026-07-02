import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-foreground/90 sm:text-5xl">
          voice under scrutiny
        </p>
        <p className="text-sm text-muted-foreground">
          Pick a topic, say it out loud, listen back, read the transcript.
          Repeat until it lands.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="chip">no accounts</span>
          <span className="chip">pitches stay in your browser</span>
          <Link
            href="https://github.com/Jazztinn/voice-under-scrutiny"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent transition hover:text-accent-hover"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
