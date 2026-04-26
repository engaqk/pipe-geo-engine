import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GEO Engine | AI Visibility & Generative Search Optimization",
  description: "Optimize your brand for the Generative AI era. Audit visibility and generate SEO assets for ChatGPT, Grok, Gemini, Claude, and Perplexity.",
  keywords: ["GEO", "Generative Engine Optimization", "AI SEO", "Search Engine Optimization", "ChatGPT Optimization", "AI Visibility"],
  authors: [{ name: "PipeGEO Team" }],
  openGraph: {
    title: "GEO Engine | AI Visibility Auditor",
    description: "Audit and optimize your website for Generative Search Engines.",
    url: "https://pipe-geo.vercel.app",
    siteName: "GEO Engine",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GEO Engine Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEO Engine | AI Visibility Auditor",
    description: "Optimize your brand for ChatGPT, Gemini, and more.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
