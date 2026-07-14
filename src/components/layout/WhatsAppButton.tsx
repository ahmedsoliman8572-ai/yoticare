"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WhatsAppButton() {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("site_settings").select("value").eq("key", "whatsapp_number").single();
      if (data?.value) {
        // Clean the number (remove spaces, plus sign for the wa.me link)
        const cleanNumber = data.value.replace(/[^0-9]/g, "");
        setWhatsappNumber(cleanNumber);
      }
    };
    fetchSettings();
  }, []);

  if (!whatsappNumber) return null;

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-4 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#25D366]/40 transition-all duration-300 animate-fade-in group flex items-center justify-center"
      aria-label="Contact us on WhatsApp"
    >
      <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
      <MessageCircle className="w-8 h-8 relative z-10" />
    </a>
  );
}
