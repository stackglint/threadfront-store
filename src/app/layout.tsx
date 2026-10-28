import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sora & Sand · Threadfront store demo by StackGlint", template: "%s · Sora & Sand" },
  description: "Threadfront is an e-commerce store for clothing brands, built by StackGlint. Fictional brand and sample data.",
  robots: { index: false },
};
export const viewport: Viewport = { themeColor: "#F5F2EC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-dvh">{children}</body></html>;
}
