// Placeholder for future AI feedback. Renders a disabled "coming soon" card so
// the UI + data model (`Pitch.feedback`) are ready for a later Claude integration.
export default function FeedbackSlot() {
  return (
    <div className="w-full rounded-3xl border border-dashed border-border bg-card/50 p-5 opacity-70">
      <div className="flex items-center justify-between">
        <span className="chip">AI Feedback</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Coming soon
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Scoring for clarity, structure, filler words and pacing will land here.
      </p>
    </div>
  );
}
