import Link from "next/link";

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 fill-current"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.26 5.69.41.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .32.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <p className="font-brand text-5xl leading-none tracking-tight text-white sm:text-6xl">
          voice under scrutiny
        </p>
        <p className="text-sm text-white/70">
          Pick a topic, say it out loud, listen back, read the transcript.
          Repeat until it lands.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70">
          <span className="chip border-white/25 bg-white/10 text-white">
            no accounts
          </span>
          <span className="chip border-white/25 bg-white/10 text-white">
            pitches stay in your browser
          </span>
          <Link
            href="https://github.com/Jazztinn/voice-under-scrutiny"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-white transition hover:text-white/80"
          >
            <GitHubIcon />
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
