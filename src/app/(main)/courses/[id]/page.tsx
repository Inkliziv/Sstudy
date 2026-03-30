"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Course, Section, Enrollment } from "@/lib/types";
import { BookOpen, Clock, Users, ChevronDown, ChevronRight, PlayCircle, CheckCircle, Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setUserId(session.user.id);

    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseData) setCourse(courseData);

    const { data: sectionsData } = await supabase
      .from("sections")
      .select("*, lessons(*)")
      .eq("course_id", courseId)
      .order("order_index");

    if (sectionsData) {
      const sorted = sectionsData.map((s: Section) => ({
        ...s,
        lessons: s.lessons?.sort((a, b) => a.order_index - b.order_index) || [],
      }));
      setSections(sorted);
    }

    if (session?.user) {
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("course_id", courseId)
        .single();
      if (enrollData) setEnrollment(enrollData);
    }

    setLoading(false);
  }

  async function handleEnroll() {
    if (!userId) {
      router.push("/auth/login");
      return;
    }
    setEnrolling(true);
    const { data } = await supabase
      .from("enrollments")
      .insert({ user_id: userId, course_id: courseId, progress_percent: 0 })
      .select()
      .single();
    if (data) setEnrollment(data);
    setEnrolling(false);
  }

  function toggleSection(sectionId: string) {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedSections(next);
  }

  const totalLessons = sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Kurs topilmadi</h2>
        <Link href="/courses" className="text-blue-600 mt-4 inline-block">Kurslarga qaytish</Link>
      </div>
    );
  }

  const levelLabels: Record<string, string> = {
    boshlangich: "Boshlang'ich",
    orta: "O'rta",
    yuqori: "Yuqori",
  };

  return (
    <div>
      {/* Hero */}
      <div className="gradient-bg text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{course.category}</span>
              <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">{levelLabels[course.level] || course.level}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-blue-100 text-lg mb-6">{course.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(course.duration_hours * 60)}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{totalLessons} ta dars</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{sections.length} ta bo&apos;lim</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sections */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Kurs dasturi</h2>
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{section.title}</span>
                    </div>
                    <span className="text-sm text-gray-500">{section.lessons?.length || 0} ta dars</span>
                  </button>
                  {expandedSections.has(section.id) && section.lessons && (
                    <div className="border-t border-gray-100">
                      {section.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          {enrollment ? (
                            <Link
                              href={`/courses/${courseId}/lessons/${lesson.id}`}
                              className="flex items-center gap-3 w-full"
                            >
                              <PlayCircle className="w-5 h-5 text-blue-600 shrink-0" />
                              <div className="flex-1">
                                <span className="text-gray-700">{lesson.title}</span>
                                <span className="text-xs text-gray-400 ml-2">{lesson.duration_minutes} daq</span>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 w-full opacity-60">
                              <PlayCircle className="w-5 h-5 text-gray-400 shrink-0" />
                              <span className="text-gray-500">{lesson.title}</span>
                              <span className="text-xs text-gray-400 ml-2">{lesson.duration_minutes} daq</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full rounded-lg mb-4" />
              )}
              {enrollment ? (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-blue-600">{enrollment.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${enrollment.progress_percent}%` }}
                      />
                    </div>
                  </div>
                  {sections[0]?.lessons?.[0] && (
                    <Link
                      href={`/courses/${courseId}/lessons/${sections[0].lessons[0].id}`}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Davom ettirish
                    </Link>
                  )}
                  {enrollment.progress_percent === 100 && (
                    <Link
                      href={`/dashboard`}
                      className="w-full mt-3 border border-green-600 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Sertifikat olish
                    </Link>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                  {enrolling ? "Yozilmoqda..." : "Kursga yozilish"}
                </button>
              )}

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Daraja</span>
                  <span className="font-medium">{levelLabels[course.level] || course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Davomiyligi</span>
                  <span className="font-medium">{formatDuration(course.duration_hours * 60)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Darslar soni</span>
                  <span className="font-medium">{totalLessons} ta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sertifikat</span>
                  <span className="font-medium text-green-600">Ha</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
