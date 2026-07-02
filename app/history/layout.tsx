import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your pitch log",
  description:
    "Every practice pitch you've recorded — audio and transcripts, stored locally in your browser.",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
