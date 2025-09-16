
import React from 'react';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';
import { DocumentArrowUpIcon, BeakerIcon, ChartBarIcon } from './Icons';

interface WelcomeProps {
    language: Language;
}

export const Welcome: React.FC<WelcomeProps> = ({language}) => {
  const text = UI_TEXT[language];

  return (
    <div className="mt-8 text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{text.welcomeTitle}</h2>
      <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-8">{text.welcomeDesc}</p>
      <div className="grid md:grid-cols-3 gap-8">
        <WelcomeStep icon={<DocumentArrowUpIcon />} text={text.welcomeStep1} />
        <WelcomeStep icon={<BeakerIcon />} text={text.welcomeStep2} />
        <WelcomeStep icon={<ChartBarIcon />} text={text.welcomeStep3} />
      </div>
    </div>
  );
}

const WelcomeStep: React.FC<{icon: React.ReactNode, text: string}> = ({icon, text}) => {
    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mb-4">
                <div className="w-8 h-8">
                    {icon}
                </div>
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-200">{text}</p>
        </div>
    )
}
