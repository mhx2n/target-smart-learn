import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { GeneralAIChatModal } from "./GeneralAIChatModal";

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-2xl hover:shadow-primary/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="AI শিক্ষা সহায়ক"
      >
        <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
      </button>

      <GeneralAIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
