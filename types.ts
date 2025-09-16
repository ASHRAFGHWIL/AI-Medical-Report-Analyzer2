
export type Language = 'en' | 'ar';

export interface PhysicianReportItem {
  parameter: string;
  value: string;
  referenceRange: string;
  status: 'normal' | 'moderate' | 'severe';
  explanation: string;
}

export interface Recommendations {
  general: string[];
  nutrition: string[];
  physicalTherapy: string[];
}

export interface AnalysisResult {
  patientSummary: string;
  physicianReport: PhysicianReportItem[];
  recommendations: Recommendations;
}
