'use client';

import { useState } from 'react';

interface DateRangeFilterProps {
  onFilterChange: (startDate: string | null, endDate: string | null) => void;
  initialStartDate?: string;
  initialEndDate?: string;
}

export default function DateRangeFilter({
  onFilterChange,
  initialStartDate = '',
  initialEndDate = ''
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [startYear, setStartYear] = useState(initialStartDate ? initialStartDate.substring(0, 4) : '');
  const [endYear, setEndYear] = useState(initialEndDate ? initialEndDate.substring(0, 4) : '');

  const handleStartYearChange = (value: string) => {
    setStartYear(value);
    if (value && value.length === 4 && !isNaN(parseInt(value))) {
      const newStartDate = `${value}-01-01`;
      setStartDate(newStartDate);
      onFilterChange(newStartDate, endDate || null);
    } else if (!value) {
      setStartDate('');
      onFilterChange(null, endDate || null);
    }
  };

  const handleEndYearChange = (value: string) => {
    setEndYear(value);
    if (value && value.length === 4 && !isNaN(parseInt(value))) {
      const newEndDate = `${value}-12-31`;
      setEndDate(newEndDate);
      onFilterChange(startDate || null, newEndDate);
    } else if (!value) {
      setEndDate('');
      onFilterChange(startDate || null, null);
    }
  };

  const handleClear = () => {
    setStartYear('');
    setEndYear('');
    setStartDate('');
    setEndDate('');
    onFilterChange(null, null);
  };

  const hasFilters = startYear || endYear;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Tidsperiod
        </h3>
      </div>

      <div className="space-y-3">
        {/* Start Year */}
        <div>
          <label htmlFor="start-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Från år
          </label>
          <input
            id="start-year"
            type="number"
            min="1500"
            max="2100"
            placeholder="t.ex. 1800"
            value={startYear}
            onChange={(e) => handleStartYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Year */}
        <div>
          <label htmlFor="end-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Till år
          </label>
          <input
            id="end-year"
            type="number"
            min="1500"
            max="2100"
            placeholder="t.ex. 1900"
            value={endYear}
            onChange={(e) => handleEndYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#0058a3] dark:focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Active filter display */}
        {hasFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {startYear && endYear && (
                <span>{startYear} – {endYear}</span>
              )}
              {startYear && !endYear && (
                <span>Från {startYear}</span>
              )}
              {!startYear && endYear && (
                <span>Till {endYear}</span>
              )}
            </div>
            <button
              onClick={handleClear}
              className="text-sm text-[#0058a3] dark:text-blue-400 hover:underline"
            >
              Rensa
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
