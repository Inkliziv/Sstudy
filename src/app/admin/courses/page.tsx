"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Course } from "@/lib/types";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data } = await supabase
      .from("courses")
      .select("*, enrollments(count)")
      .order("created_at", { ascending: false });
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCourses(
        data.map((c: any) => ({
          ...c,
          enrollment_count: c.enrollments?.[0]?.count || 0,
        })) as Course[]
      );
    }
    setLoading(false);
  }

  async function togglePublish(course: Course) {
    await supabase
      .from("courses")
      .update({ is_published: !course.is_published })
      .eq("id", course.id);
    setCourses(
      courses.map((c) =>
        c.id === course.id ? { ...c, is_published: !c.is_published } : c
      )
    );
  }

  async function deleteCourse(id: string) {
    if (!confirm("Kursni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) return;

    // Delete related data first
    const { data: sections } = await supabase
      .from("sections")
      .select("id")
      .eq("course_id", id);

    if (sections) {
      for (const section of sections) {
        const { data: lessons } = await supabase
          .from("lessons")
          .select("id")
          .eq("section_id", section.id);
        if (lessons) {
          const lessonIds = lessons.map((l: { id: string }) => l.id);
          await supabase.from("quizzes").delete().in("lesson_id", lessonIds);
          await supabase.from("lesson_progress").delete().in("lesson_id", lessonIds);
          await supabase.from("quiz_results").delete().in(
            "quiz_id",
            (await supabase.from("quizzes").select("id").in("lesson_id", lessonIds)).data?.map(
              (q: { id: string }) => q.id
            ) || []
          );
        }
        await supabase.from("lessons").delete().eq("section_id", section.id);
      }
      await supabase.from("sections").delete().eq("course_id", id);
    }
    await supabase.from("enrollments").delete().eq("course_id", id);
    await supabase.from("certificates").delete().eq("course_id", id);
    await supabase.from("courses").delete().eq("id", id);

    setCourses(courses.filter((c) => c.id !== id));
  }

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const levelLabels: Record<string, string> = {
    boshlangich: "Boshlang'ich",
    orta: "O'rta",
    yuqori: "Yuqori",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kurslar</h2>
        <Link
          href="/admin/courses/new"
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yangi kurs
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kurs qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Kurs nomi</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Kategoriya</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Daraja</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Talabalar</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Holat</th>
                <th className="text-right px-5 py-3 text-sm font-medium text-gray-500">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    Kurs topilmadi
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{course.title}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{course.category}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {levelLabels[course.level] || course.level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{course.enrollment_count || 0}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        course.is_published
                          ? "bg-green-50 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {course.is_published ? "Faol" : "Qoralama"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePublish(course)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title={course.is_published ? "Yashirish" : "Nashr qilish"}
                        >
                          {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
