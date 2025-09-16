
import React from 'react';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';
import { BeakerIcon } from './Icons';

interface LoadingSpinnerProps {
    language: Language;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ language }) => {
  const text = UI_TEXT[language];
  return (
    <div className="text-center p-8 mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex justify-center items-center mb-4">
        <BeakerIcon className="h-12 w-12 text-blue-500 animate-pulse-fast" />
      </div>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">{text.loadingMessage}</p>
    </div>
  );
};
