import Link from 'next/link';
import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4 text-[#0058a3] dark:text-blue-400">
            Markaryd Församling
          </h1>
          <h2 className="text-2xl font-light text-gray-700 dark:text-gray-300 mb-6">
            Personregister 1572-2023
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
            Detta register innehåller 1,041 personer från Markaryd församling, särskilt för de år då kyrkoböckerna förlorades i brand. Utforska släktträd, sök efter förfäder och upptäck historiska platser.
          </p>

          {/* Search Bar */}
          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sök efter namn, plats, yrke eller valfri nyckelord
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Utforska Registret
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/personer"
            className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#0058a3] dark:hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <svg className="w-6 h-6 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-[#0058a3] dark:group-hover:text-blue-400 transition-colors">
              Sök Personer
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Bläddra och sök bland alla 1,041 registrerade personer
            </p>
          </Link>

          <Link
            href="/platser"
            className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#0058a3] dark:hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <svg className="w-6 h-6 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-[#0058a3] dark:group-hover:text-blue-400 transition-colors">
              Platser
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Utforska historiska platser, byar och boendeadresser
            </p>
          </Link>

          <Link
            href="/sok"
            className="group p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#0058a3] dark:hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <svg className="w-6 h-6 text-[#0058a3] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-[#0058a3] dark:group-hover:text-blue-400 transition-colors">
              Avancerad Sökning
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Använd avancerade filter för att hitta specifika personer
            </p>
          </Link>
        </div>

        {/* Statistics Section */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
            Registerstatistik
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-[#0058a3] dark:text-blue-400 mb-2">1,041</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Personer</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0058a3] dark:text-blue-400 mb-2">450+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">År täckt</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0058a3] dark:text-blue-400 mb-2">89</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Platser</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0058a3] dark:text-blue-400 mb-2">63</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Yrken</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
