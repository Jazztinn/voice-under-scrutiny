"use client";

import { useEffect, useMemo } from "react";

type Props = {
  blob: Blob;
  className?: string;
};

/**
 * Audio playback for self-scrutiny — the user listens back to their own pitch.
 * Creates an object URL from the blob and revokes it on unmount / blob change.
 */
export default function PitchPlayer({ blob, className }: Props) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <audio controls src={url} className={`w-full ${className ?? ""}`}>
      Your browser does not support audio playback.
    </audio>
  );
}
