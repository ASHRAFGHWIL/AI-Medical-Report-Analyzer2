import React, { useRef, useState, useEffect } from 'react';
import type { AnalysisResult, Language } from '../types';
import { UI_TEXT, STATUS_COLORS } from '../constants';
import { UserIcon, AcademicCapIcon, ClipboardDocumentListIcon, ArrowDownTrayIcon, PrinterIcon, ExclamationTriangleIcon, ChevronDownIcon, PhotoIcon, CodeBracketIcon } from './Icons';

// The jsPDF and html2canvas libraries are loaded from script tags in index.html and will be available on the window object.

interface ReportDisplayProps {
  result: AnalysisResult;
  language: Language;
}

const ExportButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  Icon: React.ElementType;
  text: string;
  loadingText: string;
  isLoading: boolean;
}> = ({ onClick, disabled, Icon, text, loadingText, isLoading }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-wait"
  >
    <Icon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0"/>
    {isLoading ? loadingText : text}
  </button>
);


export const ReportDisplay: React.FC<ReportDisplayProps> = ({ result, language }) => {
  const text = UI_TEXT[language];
  const reportRef = useRef<HTMLDivElement>(null);
  const [libsLoaded, setLibsLoaded] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    patientSummary: true,
    physicianReport: true,
    recommendations: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const checkLibsInterval = setInterval(() => {
      if ((window as any).html2canvas && (window as any).jspdf?.jsPDF) {
        setLibsLoaded(true);
        clearInterval(checkLibsInterval);
      }
    }, 200);
    return () => clearInterval(checkLibsInterval);
  }, []);

  const isExporting = isGeneratingPdf || isGeneratingPng || isGeneratingHtml;

  const captureCanvas = async () => {
    const input = reportRef.current;
    if (!input) throw new Error("Report element not found.");
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const canvas = await (window as any).html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
    });
    return canvas;
  }

  const exportToPDF = async () => {
    if (!libsLoaded) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await captureCanvas();
      const imgData = canvas.toDataURL('image/png');
      const jsPDF = (window as any).jspdf.jsPDF;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save('medical-report-analysis.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const exportToPNG = async () => {
    if (!libsLoaded) return;
    setIsGeneratingPng(true);
    try {
      const canvas = await captureCanvas();
      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = 'medical-report-analysis.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("An error occurred while generating the PNG.");
    } finally {
      setIsGeneratingPng(false);
    }
  };
  
  const exportToHTML = async () => {
    if (!reportRef.current) return;
    setIsGeneratingHtml(true);
    try {
      const reportHtml = reportRef.current.innerHTML;
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const lang = language === 'ar' ? 'ar' : 'en';
      const dir = language === 'ar' ? 'rtl' : 'ltr';

      const fullHtml = `
        <!DOCTYPE html>
        <html lang="${lang}" dir="${dir}" class="${theme}">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${text.title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['Inter', 'sans-serif'],
                      arabic: ['Tajawal', 'sans-serif'],
                    },
                  }
                }
              }
            </script>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: ${lang === 'ar' ? "'Tajawal', sans-serif" : "'Inter', sans-serif"};
              }
            </style>
          </head>
          <body class="${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-4 sm:p-8">
            <div class="max-w-4xl mx-auto">${reportHtml}</div>
          </body>
        </html>
      `;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'medical-report-analysis.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating HTML:", error);
      alert("An error occurred while generating the HTML file.");
    } finally {
      setIsGeneratingHtml(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mt-8">
       <div className="flex flex-wrap justify-end gap-2 mb-4 print:hidden">
            <ExportButton 
                onClick={exportToPDF}
                disabled={!libsLoaded || isExporting}
                isLoading={isGeneratingPdf}
                Icon={ArrowDownTrayIcon}
                text={text.exportPDF}
                loadingText={text.generatingPDF}
            />
            <ExportButton 
                onClick={exportToPNG}
                disabled={!libsLoaded || isExporting}
                isLoading={isGeneratingPng}
                Icon={PhotoIcon}
                text={text.exportPNG}
                loadingText={text.generatingPNG}
            />
            <ExportButton 
                onClick={exportToHTML}
                disabled={isExporting}
                isLoading={isGeneratingHtml}
                Icon={CodeBracketIcon}
                text={text.exportHTML}
                loadingText={text.generatingHTML}
            />
            <button
                onClick={handlePrint}
                disabled={isExporting}
                className="flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
                <PrinterIcon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0"/>
                {text.print}
            </button>
        </div>
      <div id="report-content" ref={reportRef} className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        
        <ReportSection 
          icon={<UserIcon />} 
          title={text.patientSummary}
          isExpanded={expandedSections.patientSummary}
          onToggle={() => toggleSection('patientSummary')}
        >
          <p className="leading-relaxed">{result.patientSummary}</p>
        </ReportSection>

        <ReportSection 
          icon={<AcademicCapIcon />} 
          title={text.physicianReport}
          isExpanded={expandedSections.physicianReport}
          onToggle={() => toggleSection('physicianReport')}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.parameter}</th>
                  <th scope="col" className="px-6 py-3 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.value}</th>
                  <th scope="col" className="px-6 py-3 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.referenceRange}</th>
                  <th scope="col" className="px-6 py-3 text-left rtl:text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.status}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {result.physicianReport.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr className={`${STATUS_COLORS[item.status]?.bg || ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          {item.status === 'severe' && (
                            <ExclamationTriangleIcon 
                              className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 rtl:ml-2 rtl:mr-0" 
                              aria-hidden="true" 
                            />
                          )}
                          {item.status === 'moderate' && (
                            <ExclamationTriangleIcon 
                              className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2 rtl:ml-2 rtl:mr-0" 
                              aria-hidden="true"
                            />
                          )}
                          {item.parameter}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{item.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.referenceRange}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${STATUS_COLORS[item.status]?.bg} ${STATUS_COLORS[item.status]?.text}`}>
                          {STATUS_COLORS[item.status]?.name[language] || item.status}
                        </span>
                      </td>
                    </tr>
                     <tr className={`${STATUS_COLORS[item.status]?.bg || ''}`}>
                       <td colSpan={4} className="px-6 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-300">
                         <p><span className="font-bold">{text.explanation}: </span>{item.explanation}</p>
                       </td>
                     </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>

        <ReportSection 
          icon={<ClipboardDocumentListIcon />} 
          title={text.recommendations}
          isExpanded={expandedSections.recommendations}
          onToggle={() => toggleSection('recommendations')}
        >
          <div className="grid md:grid-cols-3 gap-6">
            <RecommendationCategory title={text.generalRecs} items={result.recommendations.general} />
            <RecommendationCategory title={text.nutritionRecs} items={result.recommendations.nutrition} />
            <RecommendationCategory title={text.physicalTherapyRecs} items={result.recommendations.physicalTherapy} />
          </div>
        </ReportSection>

      </div>
    </div>
  );
};

const ReportSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ icon, title, children, isExpanded, onToggle }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full py-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500 rounded-md"
      aria-expanded={isExpanded}
      aria-controls={`section-content-${title.replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 text-blue-600 dark:text-blue-400">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mx-3 text-left rtl:text-right">{title}</h3>
      </div>
      <ChevronDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
    </button>
    <div
      id={`section-content-${title.replace(/\s+/g, '-')}`}
      className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
    >
      <div className="ml-11 rtl:mr-11 rtl:ml-0 border-l-2 border-blue-200 dark:border-blue-800 pl-6 rtl:pr-6 rtl:pl-0 pb-4">
          {children}
      </div>
    </div>
  </div>
);


const RecommendationCategory: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">{title}</h4>
    <ul className="space-y-2 list-disc list-inside text-gray-600 dark:text-gray-300">
      {items.map((item, index) => <li key={index}>{item}</li>)}
    </ul>
  </div>
);