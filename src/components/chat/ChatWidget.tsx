"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999]">
          <ChatWindow />
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          fixed bottom-6 right-6 z-[9999]
          flex h-14 w-14 items-center justify-center
          rounded-full bg-black text-white
          shadow-lg transition-transform
          hover:scale-105
        "
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}