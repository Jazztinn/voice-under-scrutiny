// Placeholder for future AI feedback. Renders a disabled "coming soon" card so
// the UI + data model (`Pitch.feedback`) are ready for a later Claude integration.
export default function FeedbackSlot() {
  return (
    <div className="w-full rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-5 opacity-70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          AI Feedback
        </span>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
          Coming soon
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-500">
        Scoring for clarity, structure, filler words and pacing will land here.
      </p>
    </div>
  );
}
