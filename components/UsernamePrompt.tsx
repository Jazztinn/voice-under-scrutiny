"use client";

import { useCallback, useRef, useState } from "react";
import { getUsername, setUsername } from "@/lib/identity";

/**
 * Gates an action behind having a stored username. Call `ensureUsername()`
 * before any community write — it resolves immediately if a name is already
 * stored, otherwise it opens the prompt and resolves once the user submits one.
 * Render `<UsernamePrompt {...promptProps} />` once, near the action's UI.
 */
export function useEnsureUsername() {
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((name: string) => void) | null>(null);

  const ensureUsername = useCallback((): Promise<string> => {
    const existing = getUsername();
    if (existing) return Promise.resolve(existing);
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleSubmit = useCallback((name: string) => {
    setUsername(name);
    setOpen(false);
    resolverRef.current?.(name);
    resolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolverRef.current = null;
  }, []);

  return {
    ensureUsername,
    promptProps: { open, onSubmit: handleSubmit, onCancel: handleCancel },
  };
}

type Props = {
  open: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export default function UsernamePrompt({ open, onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");

  if (!open) return null;

  function submit() {
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg font-bold text-foreground">
          Pick a display name
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown next to topics you submit and used to remember your votes. No
          account, no password.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={40}
          placeholder="e.g. quiet_orator"
          className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
