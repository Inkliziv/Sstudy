"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    totalCertificates: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<
    { id: string; user_name: string; course_title: string; enrolled_at: string }[]
  >([]);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [courses, students, enrollments, certificates] = await Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("enrollments").select("id", { count: "exact", head: true }),
      supabase.from("certificates").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      totalCourses: courses.count || 0,
      totalStudents: students.count || 0,
      totalEnrollments: enrollments.count || 0,
      totalCertificates: certificates.count || 0,
    });

    const { data: recent } = await supabase
      .from("enrollments")
      .select("id, enrolled_at, user:users(full_name), course:courses(title)")
      .order("enrolled_at", { ascending: false })
      .limit(10);

    if (recent) {
      setRecentEnrollments(
        recent.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          user_name: (r.user as { full_name: string })?.full_name || "",
          course_title: (r.course as { title: string })?.title || "",
          enrolled_at: r.enrolled_at as string,
        }))
      );
    }
  }

  const statCards = [
    { label: "Kurslar", value: stats.totalCourses, icon: BookOpen, color: "blue" },
    { label: "Talabalar", value: stats.totalStudents, icon: Users, color: "green" },
    { label: "Ro'yxatdan o'tishlar", value: stats.totalEnrollments, icon: TrendingUp, color: "yellow" },
    { label: "Sertifikatlar", value: stats.totalCertificates, icon: Award, color: "purple" },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${colorMap[card.color].bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${colorMap[card.color].text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent enrollments */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">So&apos;nggi ro&apos;yxatdan o&apos;tishlar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Talaba</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Kurs</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-gray-500">Sana</th>
              </tr>
            </thead>
            <tbody>
              {recentEnrollments.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-900">{e.user_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{e.course_title}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {new Date(e.enrolled_at).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              ))}
              {recentEnrollments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    Hali ro&apos;yxatdan o&apos;tishlar yo&apos;q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
