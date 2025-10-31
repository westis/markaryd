'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalPersons: number;
  dateRange: {
    earliest: number;
    latest: number;
  };
}

export default function Footer() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Om Registret
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Genealogiskt register för Markaryds församling, särskilt för de år då kyrkoböckerna förlorades i brand.
            </p>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Statistik
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>{stats ? stats.totalPersons.toLocaleString('sv-SE') : '...'} personer registrerade</li>
              <li>Källmaterial: {stats ? `${stats.dateRange.earliest}-${stats.dateRange.latest}` : '...'}</li>
              <li>Flera forskare bidragit</li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Länkar
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>
                <a href="#" className="hover:text-[#0058a3] dark:hover:text-blue-400 transition-colors">
                  Riksarkivet
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0058a3] dark:hover:text-blue-400 transition-colors">
                  SVAR
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0058a3] dark:hover:text-blue-400 transition-colors">
                  ArkivDigital
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Markaryds Församling Personregister</p>
        </div>
      </div>
    </footer>
  );
}
