import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { TrendingDown } from "lucide-react";

export const metadata: Metadata = {
  title: "PriceTrail — Track Price History",
  description: "Search product price history across Amazon, Walmart, Best Buy, eBay and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen" style={{ background: '#08080f' }}>
        <nav className="border-b border-gray-800/60 backdrop-blur-sm sticky top-0 z-40" style={{ background: 'rgba(8,8,15,0.85)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-black text-xl text-white hover:text-blue-400 transition-colors">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <TrendingDown size={16} className="text-white" />
              </div>
              PriceTrail
            </Link>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/search?q=laptop" className="hover:text-white transition-colors">Trending</Link>
              <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">
                Live Prices
              </span>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800/60 mt-20 py-8 text-center text-gray-600 text-sm">
          <p>PriceTrail — Australian price comparison &amp; history tracking</p>
          <p className="mt-1 text-xs">Data sourced from PriceHipster, StaticIce, Google Shopping &amp; major Australian retailers · Prices in AUD</p>
        </footer>
      </body>
    </html>
  );
}
