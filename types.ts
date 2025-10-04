
export type Language = 'en' | 'ar';

export interface PatientDetails {
  name: string;
  age: string;
  testDate: string;
  testType: string;
}

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
  patientDetails: PatientDetails;
  patientSummary: string;
  physicianReport: PhysicianReportItem[];
  recommendations: Recommendations;
}