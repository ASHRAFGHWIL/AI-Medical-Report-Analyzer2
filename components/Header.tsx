
import React from 'react';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';
import { SunIcon, MoonIcon, LanguageIcon, TextSizeIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, BeakerIcon } from './Icons';

interface HeaderProps {
  language: Language;
  toggleLanguage: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  fontSize: 'normal' | 'large';
  toggleFontSize: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  toggleLanguage,
  theme,
  toggleTheme,
  fontSize,
  toggleFontSize,
  isFullscreen,
  toggleFullscreen
}) => {
  const text = UI_TEXT[language];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <BeakerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className={`font-bold text-xl sm:text-2xl ml-3 ${language === 'ar' ? 'mr-3 ml-0' : ''}`}>
              {text.title}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <HeaderButton onClick={toggleLanguage} aria-label="Toggle Language">
              <LanguageIcon className="h-6 w-6" />
            </HeaderButton>
            <HeaderButton onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </HeaderButton>
            <HeaderButton onClick={toggleFontSize} aria-label="Toggle Font Size">
              <TextSizeIcon className="h-6 w-6" />
            </HeaderButton>
            <HeaderButton onClick={toggleFullscreen} aria-label="Toggle Fullscreen">
              {isFullscreen ? <ArrowsPointingInIcon className="h-6 w-6" /> : <ArrowsPointingOutIcon className="h-6 w-6" />}
            </HeaderButton>
          </div>
        </div>
      </div>
    </header>
  );
};

const HeaderButton: React.FC<{ onClick: () => void; 'aria-label': string; children: React.ReactNode }> = ({ onClick, 'aria-label': ariaLabel, children }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
  >
    {children}
  </button>
);
