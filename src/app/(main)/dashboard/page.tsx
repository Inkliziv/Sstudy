"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Enrollment, User, Certificate } from "@/lib/types";
import { BookOpen, Award, TrendingUp, Clock, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import jsPDF from "jspdf";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (userData) setUser(userData);

    const { data: enrollData } = await supabase
      .from("enrollments")
      .select("*, course:courses(*)")
      .eq("user_id", session.user.id)
      .order("enrolled_at", { ascending: false });
    if (enrollData) setEnrollments(enrollData);

    const { data: certData } = await supabase
      .from("certificates")
      .select("*, course:courses(title)")
      .eq("user_id", session.user.id);
    if (certData) setCertificates(certData);

    setLoading(false);
  }

  async function generateCertificate(enrollment: Enrollment) {
    if (!user || !enrollment.course) return;

    // Check if certificate already exists
    const existing = certificates.find((c) => c.course_id === enrollment.course_id);
    if (!existing) {
      const certNumber = `SS-${Date.now().toString(36).toUpperCase()}`;
      const { data } = await supabase
        .from("certificates")
        .insert({
          user_id: user.id,
          course_id: enrollment.course_id,
          certificate_number: certNumber,
        })
        .select()
        .single();
      if (data) setCertificates([...certificates, data]);
    }

    // Generate PDF
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // Border
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(3);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(1);
    doc.rect(15, 15, 267, 180);

    // Header
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.text("S-STUDY", 148.5, 35, { align: "center" });

    doc.setFontSize(32);
    doc.setTextColor(15, 23, 42);
    doc.text("SERTIFIKAT", 148.5, 55, { align: "center" });

    // Body
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("Ushbu sertifikat", 148.5, 75, { align: "center" });

    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    doc.text(user.full_name, 148.5, 92, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text("quyidagi kursni muvaffaqiyatli tugatganini tasdiqlaydi:", 148.5, 107, { align: "center" });

    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(enrollment.course!.title, 148.5, 124, { align: "center" });

    // Date & number
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    const certNum = existing?.certificate_number || `SS-${Date.now().toString(36).toUpperCase()}`;
    doc.text(`Sana: ${formatDate(new Date().toISOString())}`, 148.5, 150, { align: "center" });
    doc.text(`Sertifikat raqami: ${certNum}`, 148.5, 158, { align: "center" });

    // Footer
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(60, 175, 140, 175);
    doc.line(160, 175, 237, 175);
    doc.setFontSize(10);
    doc.text("S-Study Platformasi", 100, 182, { align: "center" });
    doc.text("Direktor", 198.5, 182, { align: "center" });

    doc.save(`Sertifikat_${enrollment.course!.title.replace(/\s+/g, "_")}.pdf`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const completedCount = enrollments.filter((e) => e.progress_percent === 100).length;
  const inProgressCount = enrollments.filter((e) => e.progress_percent > 0 && e.progress_percent < 100).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Salom, {user?.full_name}!</h1>
        <p className="text-gray-500 mt-1">O&apos;rganish jarayoningiz</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
              <p className="text-sm text-gray-500">Jami kurslar</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
              <p className="text-sm text-gray-500">Davom etmoqda</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-500">Tugatilgan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-sm text-gray-500">Sertifikatlar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Mening kurslarim</h2>
      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Hali kursga yozilmadingiz</h3>
          <p className="text-gray-500 mt-1 mb-4">Kurslarni ko&apos;rib chiqing va o&apos;rganishni boshlang</p>
          <Link href="/courses" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Kurslarni ko&apos;rish
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden card-hover">
              <div className="h-40 bg-gray-100 relative">
                {enrollment.course?.thumbnail_url && (
                  <img src={enrollment.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                )}
                {enrollment.progress_percent === 100 && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Tugatilgan
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3">{enrollment.course?.title}</h3>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-blue-600">{enrollment.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percent}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/courses/${enrollment.course_id}`}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    {enrollment.progress_percent === 100 ? "Ko'rish" : "Davom ettirish"}
                  </Link>
                  {enrollment.progress_percent === 100 && (
                    <button
                      onClick={() => generateCertificate(enrollment)}
                      className="flex items-center gap-1 px-3 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
