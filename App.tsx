
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ReportDisplay } from './components/ReportDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Welcome } from './components/Welcome';
import { analyzeMedicalReport } from './services/geminiService';
import type { AnalysisResult, Language } from './types';
import { fileToBase64 } from './utils/fileUtils';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const handleAnalyze = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported for analysis.');
      }
      const { base64Data, mimeType } = await fileToBase64(file);
      const result = await analyzeMedicalReport(base64Data, mimeType, language);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleFontSize = () => setFontSize(prev => prev === 'normal' ? 'large' : 'normal');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };
  
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const baseFontSizeClass = fontSize === 'normal' ? 'text-base' : 'text-lg';
  const directionClass = language === 'ar' ? 'rtl' : 'ltr';
  const fontFamilyClass = language === 'ar' ? 'font-arabic' : 'font-sans';

  return (
    <div dir={directionClass} className={`${theme} ${baseFontSizeClass} ${fontFamilyClass}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
        <Header 
          language={language}
          toggleLanguage={toggleLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
          fontSize={fontSize}
          toggleFontSize={toggleFontSize}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
        <main className="p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <FileUpload onAnalyze={handleAnalyze} language={language} disabled={isLoading} />
            {error && (
              <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/40 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg">
                <p className="font-bold">{language === 'en' ? 'Error' : 'خطأ'}</p>
                <p>{error}</p>
              </div>
            )}
            {isLoading && <LoadingSpinner language={language}/>}
            {analysisResult && !isLoading && <ReportDisplay result={analysisResult} language={language} />}
            {!isLoading && !analysisResult && !error && <Welcome language={language}/>}

            <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400 print:hidden">
              <p>
                {language === 'en' 
                  ? 'Disclaimer: This tool is for informational purposes only and is not a substitute for professional medical advice.' 
                  : 'إخلاء مسؤولية: هذه الأداة مخصصة للأغراض المعلوماتية فقط وليست بديلاً عن الاستشارة الطبية المتخصصة.'}
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
