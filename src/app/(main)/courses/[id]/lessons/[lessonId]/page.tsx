"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lesson, Section, Quiz, QuizQuestion } from "@/lib/types";
import { extractYouTubeId } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, CheckCircle, PlayCircle,
  BookOpen, Loader2, Trophy
} from "lucide-react";
import Link from "next/link";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  async function fetchData() {
    setLoading(true);
    setQuizSubmitted(false);
    setSelectedAnswers({});

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }
    setUserId(session.user.id);

    const { data: lessonData } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single();
    if (lessonData) setLesson(lessonData);

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

    const { data: progressData } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", session.user.id)
      .eq("completed", true);
    if (progressData) {
      setCompletedLessons(new Set(progressData.map((p: { lesson_id: string }) => p.lesson_id)));
    }

    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("lesson_id", lessonId)
      .single();
    if (quizData) setQuiz(quizData);

    setLoading(false);
  }

  async function markCompleted() {
    if (!userId) return;
    await supabase.from("lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,lesson_id" });

    setCompletedLessons((prev) => new Set(prev).add(lessonId));

    // Update enrollment progress
    const allLessons = sections.flatMap((s) => s.lessons || []);
    const completedCount = allLessons.filter(
      (l) => completedLessons.has(l.id) || l.id === lessonId
    ).length;
    const percent = Math.round((completedCount / allLessons.length) * 100);

    await supabase
      .from("enrollments")
      .update({
        progress_percent: percent,
        ...(percent === 100 ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);
  }

  function handleQuizSubmit() {
    if (!quiz) return;
    let score = 0;
    quiz.questions.forEach((q: QuizQuestion) => {
      if (selectedAnswers[q.id] === q.correct_index) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);

    if (userId) {
      supabase.from("quiz_results").insert({
        user_id: userId,
        quiz_id: quiz.id,
        score,
        total: quiz.questions.length,
      });
    }
  }

  const allLessons = sections.flatMap((s) => s.lessons || []);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Dars topilmadi</h2>
      </div>
    );
  }

  const videoId = extractYouTubeId(lesson.youtube_url);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 hidden lg:block`}>
        <div className="p-4 border-b border-gray-200">
          <Link href={`/courses/${courseId}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Kursga qaytish
          </Link>
        </div>
        <div className="p-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-2">
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {section.title}
              </div>
              {section.lessons?.map((l) => (
                <Link
                  key={l.id}
                  href={`/courses/${courseId}/lessons/${l.id}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    l.id === lessonId
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {completedLessons.has(l.id) ? (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span className="truncate">{l.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Video */}
        {videoId && (
          <div className="youtube-container bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              <p className="text-gray-500 mt-1">{lesson.duration_minutes} daqiqa</p>
            </div>
            {!completedLessons.has(lessonId) ? (
              <button
                onClick={markCompleted}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shrink-0"
              >
                <CheckCircle className="w-4 h-4" />
                Tugatdim
              </button>
            ) : (
              <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
                <CheckCircle className="w-5 h-5" /> Tugatilgan
              </span>
            )}
          </div>

          {/* Lesson content */}
          {lesson.content && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, "<br/>") }} />
            </div>
          )}

          {/* Quiz */}
          {quiz && quiz.questions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              </div>

              <div className="space-y-6">
                {quiz.questions.map((q: QuizQuestion, qi: number) => (
                  <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0">
                    <p className="font-medium text-gray-900 mb-3">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isSelected = selectedAnswers[q.id] === oi;
                        const isCorrect = quizSubmitted && oi === q.correct_index;
                        const isWrong = quizSubmitted && isSelected && oi !== q.correct_index;

                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              if (!quizSubmitted) {
                                setSelectedAnswers({ ...selectedAnswers, [q.id]: oi });
                              }
                            }}
                            disabled={quizSubmitted}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                              isCorrect
                                ? "border-green-500 bg-green-50 text-green-700"
                                : isWrong
                                ? "border-red-500 bg-red-50 text-red-700"
                                : isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                  className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Tekshirish
                </button>
              ) : (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                  quizScore === quiz.questions.length ? "bg-green-50" : "bg-yellow-50"
                }`}>
                  <Trophy className={`w-6 h-6 ${quizScore === quiz.questions.length ? "text-green-600" : "text-yellow-600"}`} />
                  <span className="font-medium">
                    Natija: {quizScore}/{quiz.questions.length} (
                    {Math.round((quizScore / quiz.questions.length) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Oldingi dars</span>
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <span>Keyingi dars</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Kursni tugatish</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
