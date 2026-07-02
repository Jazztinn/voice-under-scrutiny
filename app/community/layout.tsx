import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community topics",
  description:
    "Practice topics submitted by other speakers — upvote the good ones, star favorites, or add your own.",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
