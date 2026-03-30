import Link from "next/link";
import { BookOpen, PlayCircle, Award, Users, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <PlayCircle className="w-8 h-8 text-blue-600" />,
      title: "Video darslar",
      description: "Yuqori sifatli video darslar orqali bilimingizni oshiring",
    },
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: "Mustaqil o'rganish",
      description: "O'zingizga qulay vaqtda, o'z tezligingizda o'rganing",
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      title: "Sertifikat",
      description: "Kursni tugatgach, sertifikat oling va PDF yuklab oling",
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Test va topshiriqlar",
      description: "Bilimingizni testlar orqali mustahkamlang",
    },
  ];

  const stats = [
    { value: "50+", label: "Kurslar" },
    { value: "1000+", label: "Talabalar" },
    { value: "200+", label: "Video darslar" },
    { value: "95%", label: "Mamnunlik" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Mustaqil ta&apos;limni <br />
              <span className="text-yellow-300">onlayn</span> tashkil qiling
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl">
              S-Study platformasi orqali istalgan vaqtda, istalgan joyda bilim oling.
              Video darslar, amaliy topshiriqlar va testlar sizni kutmoqda.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/courses"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                Kurslarni ko&apos;rish <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/register"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Bepul ro&apos;yxatdan o&apos;tish
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nima uchun S-Study?
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Platformamiz talabalar uchun maxsus ishlab chiqilgan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 card-hover border border-gray-100"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Qanday ishlaydi?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Ro'yxatdan o'ting", desc: "Bepul hisob yarating va platformaga kiring" },
              { step: "2", title: "Kursni tanlang", desc: "O'zingizga kerakli kursni tanlang va o'rganishni boshlang" },
              { step: "3", title: "Sertifikat oling", desc: "Barcha darslarni tugating va sertifikatingizni yuklab oling" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-bg text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bilimingizni oshirishga tayyormisiz?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Hoziroq ro&apos;yxatdan o&apos;ting va o&apos;rganishni boshlang
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Boshlash
          </Link>
        </div>
      </section>
    </>
  );
}
