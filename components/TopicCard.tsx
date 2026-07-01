"use client";

type Props = {
  topic: string;
  onNewTopic: () => void;
  disabled?: boolean;
};

export default function TopicCard({ topic, onNewTopic, disabled }: Props) {
  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Your topic
        </span>
        <button
          type="button"
          onClick={onNewTopic}
          disabled={disabled}
          className="rounded-lg px-2 py-1 text-sm text-neutral-400 transition hover:bg-neutral-800 hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ↻ New topic
        </button>
      </div>
      <p className="mt-3 text-xl font-medium leading-snug text-neutral-100">
        {topic}
      </p>
    </div>
  );
}
