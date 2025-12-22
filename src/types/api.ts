// Agency Types
export interface Agency {
  id: number;
  companyName: string;
  tinNumber: string;
  website?: string;
  contactPerson?: string;
  verifiedStatus: string;
  businessLicensePath?: string;
}

export interface AgencyRegistration {
  companyName: string;
  tinNumber: string;
  website?: string;
  contactPerson?: string;
  email: string;
  password: string;
}

// Tender Types
interface TenderCore {
  title: string;
  description: string;
  location: string;
  closingDate: string;
  contactInfo: string;
  serviceId: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  isFree: boolean;
  referenceNumber: string;
  noticeNumber?: string;
  productCategory?: string;
  tenderType?: string;
  procurementMethod?: string;
  costOfTenderDocument?: string;
  bidValidity?: string;
  bidSecurity?: string;
  contractPeriod?: string;
  performanceSecurity?: string;
  paymentTerms?: string;
  keyDeliverables?: string;
  technicalSpecifications?: string;
  questionDeadline?: string;
  tenderReferenceNoticeNo?: string;
  publishedOn?: string;
  bidSubmissionDeadline?: string;
  tenderNoticeCode?: string;
  warranty?: string;
  generalEligibility?: string;
  technicalRequirements?: string;
  financialRequirements?: string;
  experience?: string;
  preBidMeeting?: string;
  siteVisit?: string;
  deadlineForClarifications?: string;
  bidOpeningDate?: string;
  tenderDocumentCollectionLocation?: string;
  tenderDocumentCollectionTime?: string;
  tenderDocumentDownload?: string;
  bidSubmissionMode?: string;
  bidSubmissionAddress?: string;
  organization?: string;
  department?: string;
  address?: string;
  tenderLocation?: string;
  languageOfBids?: string;
  validityPeriodOfBids?: string;
  governingLaw?: string;
}

export interface Tender extends TenderCore {
  id: number;
  datePosted?: string;
  documentPath?: string;
  // Legacy fields kept optional while backend migration finalises.
  questionDeadline?: string;
  categoryId?: number;
}

export type TenderCreate = TenderCore;

export type TenderUpdate = TenderCore;

// Statistics Types
export interface AgencyStatistics {
  totalTenders: number;
  openTenders: number;
  closedTenders: number;
  cancelledTenders: number;
  verificationStatus: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Admin Services Types
export interface ServiceNode {
  serviceId: number;
  name: string;
  description: string | null;
  estimatedDuration: string | null;
  serviceFee: number | null;
  technicianCount: number | null;
  bookingCount: number | null;
  icon: string | null;
  document: string | null;
  categoryId: number;
  services: ServiceNode[]; // nested children
}

export interface ServiceCategory {
  categoryId: number;
  categoryName: string;
  description: string;
  icon: string | null;
  services: ServiceNode[];
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  FCMToken: string;
  deviceType: string;
  deviceModel: string;
  operatingSystem: string; // e.g., ANDROID | IOS | WEB
}

export interface LoginResponse {
  token: string;
  user: { id: string | number; [key: string]: unknown };
}