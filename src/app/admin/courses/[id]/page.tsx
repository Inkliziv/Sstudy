"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Course, Section, Lesson, Quiz, QuizQuestion } from "@/lib/types";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2,
  ChevronDown, ChevronRight, PlayCircle, FileText, Video, X
} from "lucide-react";
import Link from "next/link";
import { extractYouTubeId } from "@/lib/utils";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Course edit form
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "boshlangich" as string,
    duration_hours: 1,
    thumbnail_url: "",
  });

  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Section form
  const [sectionForm, setSectionForm] = useState({ title: "", order_index: 0 });

  // Lesson form
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    youtube_url: "",
    content: "",
    duration_minutes: 10,
    order_index: 0,
    section_id: "",
  });

  // Quiz form
  const [quizForm, setQuizForm] = useState({
    title: "",
    lesson_id: "",
    questions: [{ id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correct_index: 0 }] as QuizQuestion[],
  });

  const [activeTab, setActiveTab] = useState<"info" | "content">("content");

  useEffect(() => {
    fetchData();
  }, [courseId]);

  async function fetchData() {
    const { data: courseData } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();
    if (courseData) {
      setCourse(courseData);
      setEditForm({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level,
        duration_hours: courseData.duration_hours,
        thumbnail_url: courseData.thumbnail_url || "",
      });
    }

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
    setLoading(false);
  }

  async function saveCourseInfo() {
    setSaving(true);
    await supabase.from("courses").update(editForm).eq("id", courseId);
    setCourse((prev) => (prev ? { ...prev, ...editForm, level: editForm.level as Course["level"] } : null));
    setSaving(false);
  }

  // SECTIONS
  async function saveSection() {
    if (editingSectionId) {
      await supabase
        .from("sections")
        .update({ title: sectionForm.title, order_index: sectionForm.order_index })
        .eq("id", editingSectionId);
    } else {
      await supabase.from("sections").insert({
        course_id: courseId,
        title: sectionForm.title,
        order_index: sections.length,
      });
    }
    setShowSectionModal(false);
    setEditingSectionId(null);
    setSectionForm({ title: "", order_index: 0 });
    fetchData();
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Bo'limni o'chirmoqchimisiz?")) return;
    await supabase.from("lessons").delete().eq("section_id", sectionId);
    await supabase.from("sections").delete().eq("id", sectionId);
    fetchData();
  }

  // LESSONS
  async function saveLesson() {
    if (editingLessonId) {
      const { section_id, ...updateData } = lessonForm;
      await supabase.from("lessons").update(updateData).eq("id", editingLessonId);
    } else {
      await supabase.from("lessons").insert(lessonForm);
    }
    setShowLessonModal(false);
    setEditingLessonId(null);
    setLessonForm({ title: "", description: "", youtube_url: "", content: "", duration_minutes: 10, order_index: 0, section_id: "" });
    fetchData();
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm("Darsni o'chirmoqchimisiz?")) return;
    await supabase.from("quizzes").delete().eq("lesson_id", lessonId);
    await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
    await supabase.from("lessons").delete().eq("id", lessonId);
    fetchData();
  }

  // QUIZ
  async function saveQuiz() {
    const existing = await supabase
      .from("quizzes")
      .select("id")
      .eq("lesson_id", quizForm.lesson_id)
      .single();

    if (existing.data) {
      await supabase
        .from("quizzes")
        .update({ title: quizForm.title, questions: quizForm.questions })
        .eq("id", existing.data.id);
    } else {
      await supabase.from("quizzes").insert({
        lesson_id: quizForm.lesson_id,
        title: quizForm.title,
        questions: quizForm.questions,
      });
    }
    setShowQuizModal(false);
    setQuizForm({
      title: "",
      lesson_id: "",
      questions: [{ id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correct_index: 0 }],
    });
  }

  async function openQuizForLesson(lessonId: string) {
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", lessonId)
      .single();

    if (data) {
      setQuizForm({
        title: data.title,
        lesson_id: lessonId,
        questions: data.questions,
      });
    } else {
      setQuizForm({
        title: "Test",
        lesson_id: lessonId,
        questions: [{ id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correct_index: 0 }],
      });
    }
    setShowQuizModal(true);
  }

  function addQuestion() {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correct_index: 0 },
      ],
    });
  }

  function updateQuestion(index: number, field: string, value: string | number) {
    const updated = [...quizForm.questions];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setQuizForm({ ...quizForm, questions: updated });
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const updated = [...quizForm.questions];
    updated[qIndex].options[oIndex] = value;
    setQuizForm({ ...quizForm, questions: updated });
  }

  function removeQuestion(index: number) {
    setQuizForm({
      ...quizForm,
      questions: quizForm.questions.filter((_, i) => i !== index),
    });
  }

  function toggleSection(id: string) {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSections(next);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) return <div>Kurs topilmadi</div>;

  const videoPreviewId = extractYouTubeId(lessonForm.youtube_url);

  return (
    <div>
      <Link
        href="/admin/courses"
        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Kurslarga qaytish
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          course.is_published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
        }`}>
          {course.is_published ? "Faol" : "Qoralama"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "content" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Kurs kontenti
        </button>
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "info" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Kurs ma&apos;lumotlari
        </button>
      </div>

      {activeTab === "info" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurs nomi</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya</label>
              <input
                type="text"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daraja</label>
              <select
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="boshlangich">Boshlang&apos;ich</option>
                <option value="orta">O&apos;rta</option>
                <option value="yuqori">Yuqori</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (soat)</label>
              <input
                type="number"
                min="1"
                value={editForm.duration_hours}
                onChange={(e) => setEditForm({ ...editForm, duration_hours: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rasm URL</label>
              <input
                type="url"
                value={editForm.thumbnail_url}
                onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={saveCourseInfo}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Saqlash
          </button>
        </div>
      )}

      {activeTab === "content" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bo&apos;limlar va darslar</h3>
            <button
              onClick={() => {
                setSectionForm({ title: "", order_index: sections.length });
                setEditingSectionId(null);
                setShowSectionModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Bo&apos;lim qo&apos;shish
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Hali bo&apos;lim qo&apos;shilmagan</h3>
              <p className="text-gray-500 mt-1">Darslarni qo&apos;shish uchun avval bo&apos;lim yarating</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, si) => (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-400 font-mono">{si + 1}.</span>
                      <span className="font-medium text-gray-900">{section.title}</span>
                      <span className="text-sm text-gray-400">({section.lessons?.length || 0} dars)</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setLessonForm({
                            ...lessonForm,
                            section_id: section.id,
                            order_index: section.lessons?.length || 0,
                          });
                          setEditingLessonId(null);
                          setShowLessonModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Dars qo'shish"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSectionForm({ title: section.title, order_index: section.order_index });
                          setEditingSectionId(section.id);
                          setShowSectionModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors text-xs"
                        title="Tahrirlash"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedSections.has(section.id) && section.lessons && (
                    <div className="border-t border-gray-100">
                      {section.lessons.map((lesson, li) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <PlayCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{lesson.title}</span>
                            <span className="text-xs text-gray-400">{lesson.duration_minutes} daq</span>
                            {lesson.youtube_url && (
                              <Video className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openQuizForLesson(lesson.id)}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => {
                                setLessonForm({
                                  title: lesson.title,
                                  description: lesson.description,
                                  youtube_url: lesson.youtube_url,
                                  content: lesson.content,
                                  duration_minutes: lesson.duration_minutes,
                                  order_index: lesson.order_index,
                                  section_id: section.id,
                                });
                                setEditingLessonId(lesson.id);
                                setShowLessonModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors text-xs"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!section.lessons || section.lessons.length === 0) && (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                          Hali dars qo&apos;shilmagan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingSectionId ? "Bo'limni tahrirlash" : "Yangi bo'lim"}
              </h3>
              <button onClick={() => setShowSectionModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bo&apos;lim nomi</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: Kirish"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveSection}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Saqlash
                </button>
                <button
                  onClick={() => setShowSectionModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingLessonId ? "Darsni tahrirlash" : "Yangi dars"}
              </h3>
              <button onClick={() => setShowLessonModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dars nomi *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: Pythonga kirish"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qisqa tavsif</label>
                <input
                  type="text"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Video className="w-4 h-4 inline text-red-500 mr-1" />
                  YouTube havolasi *
                </label>
                <input
                  type="url"
                  value={lessonForm.youtube_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, youtube_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {videoPreviewId && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${videoPreviewId}/hqdefault.jpg`}
                      alt="Video preview"
                      className="w-full max-w-sm rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dars matni (ixtiyoriy)</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                  placeholder="Dars haqida qo'shimcha ma'lumot yozing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Davomiyligi (daqiqa)</label>
                <input
                  type="number"
                  min="1"
                  value={lessonForm.duration_minutes}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none max-w-32"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveLesson}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Saqlash
                </button>
                <button
                  onClick={() => setShowLessonModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Test yaratish / tahrirlash</h3>
              <button onClick={() => setShowQuizModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test nomi</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: 1-dars bo'yicha test"
                />
              </div>

              <div className="space-y-4">
                {quizForm.questions.map((q, qi) => (
                  <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500">{qi + 1}-savol</span>
                      {quizForm.questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(qi)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                      placeholder="Savol matni"
                    />
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qi}`}
                            checked={q.correct_index === oi}
                            onChange={() => updateQuestion(qi, "correct_index", oi)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder={`${oi + 1}-variant`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">To&apos;g&apos;ri javobni tanlang (radio tugmasi)</p>
                  </div>
                ))}
              </div>

              <button
                onClick={addQuestion}
                className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Savol qo&apos;shish
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveQuiz}
                  className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Testni saqlash
                </button>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
