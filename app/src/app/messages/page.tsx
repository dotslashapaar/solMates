"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MessageCircle,
  Check,
  X,
  Clock,
  DollarSign,
  Send,
} from "lucide-react";

// Mock messages for demo
const MOCK_INCOMING = [
  {
    id: "1",
    from: "CryptoChad",
    fromWallet: "8aBc...dEfG",
    preview: "Hey! I saw your profile and loved your take on DeFi. Would love to chat more about...",
    amount: 25,
    status: "pending",
    sentAt: new Date(Date.now() - 3600000 * 2),
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=chad",
  },
  {
    id: "2",
    from: "NFTNinja",
    fromWallet: "1xYz...2AbC",
    preview: "Your collection is amazing! I'm also a big fan of on-chain art. Have you seen the latest...",
    amount: 50,
    status: "pending",
    sentAt: new Date(Date.now() - 3600000 * 5),
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninja",
  },
  {
    id: "3",
    from: "SolanaSteve",
    fromWallet: "3dEf...4GhI",
    preview: "gm! I think we'd really hit it off. Coffee sometime?",
    amount: 15,
    status: "pending",
    sentAt: new Date(Date.now() - 3600000 * 12),
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=steve",
  },
];

const MOCK_SENT = [
  {
    id: "4",
    to: "CryptoQueen",
    toWallet: "7xKX...9mNp",
    preview: "Hi! I really resonated with your bio. Would love to grab coffee and talk crypto...",
    amount: 25,
    status: "accepted",
    sentAt: new Date(Date.now() - 3600000 * 24),
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=queen",
  },
  {
    id: "5",
    to: "DeFiDiva",
    toWallet: "5mNO...pQrS",
    preview: "Your yield farming strategies are legendary! Teach me your ways?",
    amount: 30,
    status: "pending",
    sentAt: new Date(Date.now() - 3600000 * 6),
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=diva",
  },
];

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MessagesPage() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"incoming" | "sent">("incoming");

  const handleAccept = (messageId: string) => {
    console.log("Accepting message:", messageId);
    // In real app, call on-chain instruction
  };

  const handleDecline = (messageId: string) => {
    console.log("Declining message:", messageId);
    // In real app, call on-chain instruction
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">💌</div>
          <h1 className="text-2xl font-bold mb-4">Connect to View Messages</h1>
          <p className="text-[#a1a1aa]">
            Connect your wallet to see your incoming and sent messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 font-space-grotesk">Messages</h1>
        <p className="text-[#a1a1aa] mb-8">
          Manage your DM escrows - accept to receive funds, decline to refund
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "incoming" ? "primary" : "ghost"}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming ({MOCK_INCOMING.length})
          </Button>
          <Button
            variant={activeTab === "sent" ? "primary" : "ghost"}
            onClick={() => setActiveTab("sent")}
          >
            Sent ({MOCK_SENT.length})
          </Button>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {activeTab === "incoming" ? (
            MOCK_INCOMING.length > 0 ? (
              MOCK_INCOMING.map((msg) => (
                <Card key={msg.id} className="hover:border-pink-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={msg.imageUrl}
                        alt={msg.from}
                        className="w-14 h-14 rounded-full bg-[#1a1a2e]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold">{msg.from}</h3>
                          <span className="text-xs text-[#a1a1aa]">
                            {formatTimeAgo(msg.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#a1a1aa] truncate mb-3">
                          {msg.preview}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-pink-500">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-bold">{msg.amount} USDC</span>
                            <span className="text-xs text-[#a1a1aa] ml-1">
                              escrowed
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDecline(msg.id)}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(msg.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-[#a1a1aa] mx-auto mb-4" />
                <p className="text-[#a1a1aa]">No incoming messages yet</p>
              </div>
            )
          ) : MOCK_SENT.length > 0 ? (
            MOCK_SENT.map((msg) => (
              <Card key={msg.id} className="hover:border-pink-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={msg.imageUrl}
                      alt={msg.to}
                      className="w-14 h-14 rounded-full bg-[#1a1a2e]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{msg.to}</h3>
                        <span className="text-xs text-[#a1a1aa]">
                          {formatTimeAgo(msg.sentAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#a1a1aa] truncate mb-3">
                        {msg.preview}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-pink-500">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold">{msg.amount} USDC</span>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                            msg.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : msg.status === "declined"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {msg.status === "accepted" ? (
                            <Check className="w-3 h-3" />
                          ) : msg.status === "declined" ? (
                            <X className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Send className="w-12 h-12 text-[#a1a1aa] mx-auto mb-4" />
              <p className="text-[#a1a1aa]">No sent messages yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
