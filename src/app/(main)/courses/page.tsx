"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Course } from "@/lib/types";
import Link from "next/link";
import { Clock, BookOpen, Search, Filter } from "lucide-react";
import { getYouTubeThumbnail, formatDuration } from "@/lib/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data } = await supabase
      .from("courses")
      .select("*, enrollments(count)")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coursesWithCount = data.map((c: any) => ({
        ...c,
        enrollment_count: c.enrollments?.[0]?.count || 0,
      })) as Course[];
      setCourses(coursesWithCount);
    }
    setLoading(false);
  }

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || c.category === category;
    const matchesLevel = !level || c.level === level;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const categories = [...new Set(courses.map((c) => c.category))];

  const levelLabels: Record<string, string> = {
    boshlangich: "Boshlang'ich",
    orta: "O'rta",
    yuqori: "Yuqori",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kurslar</h1>
        <p className="text-gray-500">O&apos;zingizga kerakli kursni tanlang va o&apos;rganishni boshlang</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Kurs qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">Barcha darajalar</option>
            <option value="boshlangich">Boshlang&apos;ich</option>
            <option value="orta">O&apos;rta</option>
            <option value="yuqori">Yuqori</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-xl" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Kurs topilmadi</h3>
          <p className="text-gray-500 mt-1">Qidiruv so&apos;zini o&apos;zgartiring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover block"
            >
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                <img
                  src={course.thumbnail_url || getYouTubeThumbnail("")}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {levelLabels[course.level] || course.level}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="text-sm text-blue-600 font-medium mb-1">{course.category}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(course.duration_hours * 60)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.enrollment_count || 0} talaba</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
