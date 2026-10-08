import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Loop — Feedback & roadmaps, closed with AI",
    template: "%s · Loop",
  },
  description:
    "Loop is an AI-assisted feedback and roadmap platform. Collect feature requests, let users vote, triage onto a public roadmap, and ship a changelog.",
  keywords: ["feedback", "roadmap", "changelog", "feature requests", "product", "SaaS"],
  authors: [{ name: "Loop" }],
  openGraph: {
    title: "Loop — Feedback & roadmaps, closed with AI",
    description:
      "Collect feedback, let users vote, and ship a public roadmap — with AI that clusters duplicates and surfaces themes.",
    type: "website",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('loop-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
