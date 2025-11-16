"use client";

import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function RedPhoneButton() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-red-600 shadow-xl hover:bg-red-500 hover:scale-105 transition-transform"
        aria-label="Téléphone rouge - Publier une mission"
        onClick={() => router.push("/dashboard/missions/new")}
      >
        <Phone className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}

