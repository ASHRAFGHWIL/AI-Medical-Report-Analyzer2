import React, { useState, useRef, useEffect } from 'react';
import type { AnalysisResult, Language, PhysicianReportItem } from '../types';
import { UI_TEXT } from '../constants';
import { UserIcon, AcademicCapIcon, ClipboardDocumentListIcon, PrinterIcon, ExclamationTriangleIcon, ChevronDownIcon, PhotoIcon, CodeBracketIcon, ArrowDownTrayIcon } from './Icons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportDisplayProps {
  result: AnalysisResult;
  language: Language;
}

const statusStyles = {
  normal: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
  moderate: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
  severe: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
};

const getStatusText = (status: PhysicianReportItem['status'], text: typeof UI_TEXT['en']) => {
  const statusMap = {
    normal: text.normal,
    moderate: text.moderate,
    severe: text.severe,
  };
  return statusMap[status] || status;
};

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ result, language }) => {
  const text = UI_TEXT[language];
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingHTML, setIsExportingHTML] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePrint = () => {
    window.print();
    setIsMenuOpen(false);
  };
  
  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    setIsMenuOpen(false);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save('medical-report.pdf');
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };
  
  const exportToPNG = async () => {
    if (!reportRef.current) return;
    setIsExportingPNG(true);
    setIsMenuOpen(false);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 3, useCORS: true });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = 'medical-report.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export PNG:", error);
    } finally {
      setIsExportingPNG(false);
    }
  };

  const exportToHTML = async () => {
    if (!reportRef.current) return;
    setIsExportingHTML(true);
    setIsMenuOpen(false);
    try {
      const reportContentHTML = reportRef.current.outerHTML;
      const isDarkMode = document.documentElement.classList.contains('dark');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}" class="${isDarkMode ? 'dark' : ''}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medical Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    arabic: ['Cairo', 'sans-serif'],
                  },
                }
              }
            }
          </script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: ${language === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif"};
              background-color: ${isDarkMode ? '#111827' : '#f9fafb'};
              padding: 2rem;
            }
            .export-controls { display: none; }
          </style>
        </head>
        <body class="dark:text-gray-200">
          ${reportContentHTML}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'medical-report.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error("Failed to export HTML:", error);
    } finally {
        setIsExportingHTML(false);
    }
  };

  const isExporting = isExportingPDF || isExportingPNG || isExportingHTML;
  const exportButtonText = isExporting ? text.exporting : text.export;

  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex justify-end print:hidden export-controls">
         <div className="relative inline-block text-left" ref={menuRef}>
          <div>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isExporting}
              className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-wait"
              aria-expanded="true"
              aria-haspopup="true"
            >
              {exportButtonText}
              <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5 rtl:-ml-1 rtl:mr-2" aria-hidden="true" />
            </button>
          </div>
          {isMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-600 ring-opacity-5 focus:outline-none z-10">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="menu-button">
                <MenuItem icon={<PrinterIcon />} onClick={handlePrint} text={text.printReport} />
                <MenuItem icon={<ArrowDownTrayIcon />} onClick={exportToPDF} text={text.exportAsPDF} />
                <MenuItem icon={<PhotoIcon />} onClick={exportToPNG} text={text.exportAsPNG} />
                <MenuItem icon={<CodeBracketIcon />} onClick={exportToHTML} text={text.exportAsHTML} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 mt-4">
        {/* Patient Summary */}
        <ReportSection icon={<UserIcon />} title={text.patientSummaryTitle}>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{result.patientSummary}</p>
        </ReportSection>
        
        {/* Physician Report */}
        <ReportSection icon={<AcademicCapIcon />} title={text.physicianReportTitle}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.parameter}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.value}</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.referenceRange}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{text.status}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {result.physicianReport.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.parameter}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{item.referenceRange}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[item.status]}`}>
                          {getStatusText(item.status, text)}
                        </span>
                      </td>
                    </tr>
                    {item.status !== 'normal' && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={4} className="px-6 py-2">
                              <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                  <ExclamationTriangleIcon className={`h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0 mt-0.5 flex-shrink-0 ${item.status === 'moderate' ? 'text-yellow-500' : 'text-red-500'}`} />
                                  <p><span className="font-bold">{text.explanation}:</span> {item.explanation}</p>
                              </div>
                          </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>

        {/* Recommendations */}
        <ReportSection icon={<ClipboardDocumentListIcon />} title={text.recommendationsTitle}>
          <div className="space-y-6">
            <RecommendationCategory title={text.general} items={result.recommendations.general} />
            <RecommendationCategory title={text.nutrition} items={result.recommendations.nutrition} />
            <RecommendationCategory title={text.physicalTherapy} items={result.recommendations.physicalTherapy} />
          </div>
        </ReportSection>
      </div>
    </div>
  );
};

const ReportSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
  <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
    <div className="flex items-center mb-4">
      <div className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3 rtl:ml-3 rtl:mr-0">{icon}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="pl-11 rtl:pr-11 rtl:pl-0">
      {children}
    </div>
  </section>
);

const RecommendationCategory: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
);

const MenuItem: React.FC<{ icon: React.ReactNode; onClick: () => void; text: string }> = ({ icon, onClick, text }) => (
  <button
    onClick={onClick}
    className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center w-full px-4 py-2 text-sm text-left rtl:text-right"
    role="menuitem"
  >
    <div className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0">{icon}</div>
    {text}
  </button>
);