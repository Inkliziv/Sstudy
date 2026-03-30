"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "boshlangich" as "boshlangich" | "orta" | "yuqori",
    duration_hours: 1,
    thumbnail_url: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...form,
        is_published: false,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (data) {
      router.push(`/admin/courses/${data.id}`);
    } else {
      alert("Xatolik yuz berdi: " + error?.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/courses"
        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Kurslarga qaytish
      </Link>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Yangi kurs yaratish</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kurs nomi *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Masalan: Python dasturlash asoslari"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
            placeholder="Kurs haqida qisqacha ma'lumot"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya *</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masalan: Dasturlash"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daraja</label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value as "boshlangich" | "orta" | "yuqori" })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="boshlangich">Boshlang&apos;ich</option>
              <option value="orta">O&apos;rta</option>
              <option value="yuqori">Yuqori</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (soat)</label>
            <input
              type="number"
              min="1"
              value={form.duration_hours}
              onChange={(e) => setForm({ ...form, duration_hours: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rasm URL (ixtiyoriy)</label>
            <input
              type="url"
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Kurs yaratish
          </button>
          <Link
            href="/admin/courses"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </Link>
        </div>
      </form>
    </div>
  );
}
