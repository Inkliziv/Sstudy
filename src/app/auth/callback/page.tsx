"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // users jadvalida yozuv mavjudligini tekshiramiz va yaratamiz
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (!existing) {
          const meta = session.user.user_metadata;
          await supabase.from("users").insert({
            id: session.user.id,
            email: session.user.email,
            full_name: meta?.full_name || session.user.email || "Foydalanuvchi",
            role: "student",
          });
        }

        window.location.href = "/dashboard";
      } else {
        window.location.href = "/auth/login";
      }
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Kirish tasdiqlanmoqda...</p>
      </div>
    </div>
  );
}
