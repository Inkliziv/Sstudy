"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, LogOut, Menu, User as UserIcon, X, LayoutDashboard, Shield } from "lucide-react";

interface NavUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      return;
    }

    // users jadvalidan o'qishga harakat qilamiz
    const { data } = await supabase
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setUser(data);
    } else {
      // users jadvalida yozuv yo'q bo'lsa — auth metadata'dan olamiz
      // va avtomatik yaratib qo'yamiz
      const meta = session.user.user_metadata;
      const fallbackUser: NavUser = {
        id: session.user.id,
        email: session.user.email || "",
        full_name: meta?.full_name || session.user.email || "Foydalanuvchi",
        role: meta?.role || "student",
      };
      // Jadvalni to'ldirib qo'yamiz (upsert)
      await supabase.from("users").upsert({
        id: session.user.id,
        email: session.user.email,
        full_name: fallbackUser.full_name,
        role: "student",
      });
      setUser(fallbackUser);
    }
  }

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        await loadUser();
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

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Kurslar
            </Link>

            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1">
                    <Shield className="w-4 h-4" /> Admin Panel
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{user.full_name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    title="Chiqish"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Kirish
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Ro&apos;yxatdan o&apos;tish
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4 space-y-2">
            <Link href="/courses" className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setMenuOpen(false)}>
              Kurslar
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-medium" onClick={() => setMenuOpen(false)}>
                    Admin Panel
                  </Link>
                )}
                <div className="px-3 py-2 border-t border-gray-100 mt-2 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
                  </div>
                  <button onClick={handleLogout} className="text-red-600 text-sm font-medium flex items-center gap-1">
                    <LogOut className="w-4 h-4" /> Chiqish
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>Kirish</Link>
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
