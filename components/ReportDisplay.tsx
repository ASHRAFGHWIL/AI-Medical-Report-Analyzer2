import React, { useRef } from 'react';
import type { AnalysisResult, Language } from '../types';
import { UI_TEXT, STATUS_COLORS } from '../constants';
import { UserIcon, AcademicCapIcon, ClipboardDocumentListIcon, ArrowDownTrayIcon, PrinterIcon } from './Icons';

// The jsPDF and html2canvas libraries are loaded from script tags in index.html and will be available on the window object.
// We access them inside the event handler to avoid race conditions related to script loading.

interface ReportDisplayProps {
  result: AnalysisResult;
  language: Language;
}

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ result, language }) => {
  const text = UI_TEXT[language];
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = () => {
    const input = reportRef.current;
    // Access libraries inside the handler to ensure they are available when called
    const html2canvas = (window as any).html2canvas;
    const jsPDF = (window as any).jspdf?.jsPDF; // The constructor is nested under the jsPDF property

    if (!input) {
      console.error("Report element not found for PDF export.");
      return;
    }

    if (!html2canvas || !jsPDF) {
      console.error("PDF generation library (html2canvas or jspdf) is not loaded yet.");
      alert("PDF export functionality is not ready. Please try again in a moment.");
      return;
    }

    html2canvas(input, {
        scale: 2, // Improve resolution
        useCORS: true,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', // Match theme background
    }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('medical-report-analysis.pdf');
    }).catch((error: any) => {
        console.error("Error generating PDF:", error);
        alert("An error occurred while generating the PDF.");
    });
  };

  const handlePrint = () => {
    window.print();
  };
  
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  return (
    <div className="mt-8">
       <div className="flex justify-end space-x-2 mb-4 print:hidden">
          <button
            onClick={exportToPDF}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0"/>
            {text.exportPDF}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
             <PrinterIcon className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0"/>
             {text.print}
          </button>
        </div>
      <div ref={reportRef} className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        
        <ReportSection icon={<UserIcon />} title={text.patientSummary}>
          <p className="leading-relaxed">{result.patientSummary}</p>
        </ReportSection>

        <ReportSection icon={<AcademicCapIcon />} title={text.physicianReport}>
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
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">{item.parameter}</td>
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

        <ReportSection icon={<ClipboardDocumentListIcon />} title={text.recommendations}>
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

const ReportSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="mb-8 last:mb-0">
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 text-blue-600 dark:text-blue-400">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mx-3">{title}</h3>
    </div>
    <div className="ml-11 rtl:mr-11 rtl:ml-0 border-l-2 border-blue-200 dark:border-blue-800 pl-6 rtl:pr-6 rtl:pl-0">
        {children}
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