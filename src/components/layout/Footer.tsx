import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 gradient-bg rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">S-Study</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Talabalar uchun mustaqil ta&apos;limni tashkil etish platformasi.
              Bilimingizni onlayn kurslar orqali oshiring.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Sahifalar</h3>
            <ul className="space-y-2">
              <li><Link href="/courses" className="hover:text-white transition-colors">Kurslar</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Ro&apos;yxatdan o&apos;tish</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Kirish</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Bog&apos;lanish</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">info@sstudy.uz</li>
              <li className="text-gray-400">+998 90 123 45 67</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} S-Study. Barcha huquqlar himoyalangan.</p>
        </div>
      </div>
    </footer>
  );
}
