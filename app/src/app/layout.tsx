import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/providers/WalletProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "SolMates - Web3 Dating on Solana",
  description:
    "Find your perfect match on-chain. DM escrows, date auctions, and matchmaker bounties powered by Solana.",
  keywords: ["solana", "dating", "web3", "crypto", "nft", "defi"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#0a0a0f] text-white min-h-screen antialiased">
        <WalletContextProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <footer className="border-t border-white/5 py-8 bg-[#0a0a0f]">
              <div className="container mx-auto px-4 text-center text-slate-600">
                <p>© 2025 SolMates. Built on Solana. 🔥</p>
              </div>
            </footer>
          </div>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#f43f5e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </WalletContextProvider>
      </body>
    </html>
  );
}
