export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Om Registret
            </h3>
            <p className="text-sm text-gray-600">
              Genealogiskt register för Markaryd församling, särskilt för de år då kyrkoböckerna förlorades i brand.
            </p>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Statistik
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1,041 personer registrerade</li>
              <li>Källmaterial: 1572-2023</li>
              <li>Flera forskare bidragit</li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Länkar
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <a href="#" className="hover:text-[#0058a3] transition-colors">
                  Riksarkivet
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0058a3] transition-colors">
                  SVAR
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0058a3] transition-colors">
                  ArkivDigital
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Markaryd Församling Personregister</p>
        </div>
      </div>
    </footer>
  );
}
