import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/providers/WalletProvider";
import { Navbar } from "@/components/layout/Navbar";

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
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        <WalletContextProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-[#1a1a2e] py-8">
              <div className="container mx-auto px-4 text-center text-[#a1a1aa]">
                <p>© 2024 SolMates. Built on Solana. 💜</p>
              </div>
            </footer>
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
