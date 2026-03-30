"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { BookOpen, LogOut, Menu, User as UserIcon, X, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) setUser(data);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session?.user) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        if (data) setUser(data);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 gradient-bg rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">S-Study</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Kurslar
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Chiqish"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Kirish
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-3">
            <Link href="/courses" className="block text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
              Kurslar
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4 inline mr-2" />Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="block text-gray-600 hover:text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="text-red-600 font-medium">
                  <LogOut className="w-4 h-4 inline mr-2" />Chiqish
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block text-gray-600 font-medium" onClick={() => setMenuOpen(false)}>Kirish</Link>
                <Link href="/auth/register" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center font-medium" onClick={() => setMenuOpen(false)}>
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
