
import React, { useState, useRef } from 'react';
import type { Language } from '../types';
import { UI_TEXT } from '../constants';
import { DocumentArrowUpIcon, PaperAirplaneIcon } from './Icons';

interface FileUploadProps {
  onAnalyze: (file: File) => void;
  language: Language;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onAnalyze, language, disabled }) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const text = UI_TEXT[language];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (file) {
      onAnalyze(file);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 print:hidden">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{text.uploadTitle}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{text.uploadSubtitle}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div 
          className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="sr-only"
            accept="image/png, image/jpeg, image/webp"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2"/>
            <p className="font-semibold text-blue-600 dark:text-blue-400">{text.uploadButton}</p>
            <p className="mt-1 text-sm">{file ? file.name : text.noFile}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={!file || disabled}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-bold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform active:scale-95"
        >
          <PaperAirplaneIcon className="w-5 h-5 mr-2 -ml-1 rtl:ml-2 rtl:-mr-1" />
          {disabled ? text.analyzing : text.analyzeButton}
        </button>
      </form>
    </div>
  );
};
