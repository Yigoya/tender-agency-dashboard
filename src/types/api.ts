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
export interface Tender {
  id: number;
  /** High-level status of the tender */
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  /** Optional grouping or service linkage */
  serviceId?: number;
  /** Optional document path if uploaded */
  documentPath?: string;

  /** Structured tender data */
  summary: {
    referenceNo: string;
    publishedOn: string; // ISO date
    bidDeadline: string; // ISO datetime
    category: string;
    type: string;
    procurementMethod: string;
    noticeNo?: string;
    documentCost?: string | number;
    location: string;
  };

  financials: {
    bidValidityDays: number;
    bidSecurityAmount: number;
    contractPeriodDays: number;
    performanceSecurityPercent: number;
    paymentTerms: string;
  };

  scope: {
    standards: string[];
    earthworkExcavationCuM?: number;
    concreteM35SqM?: number;
    rccCulvertsCount?: number;
    stormWaterDrainKm?: number;
    warrantyMonths?: number;
  };

  eligibility: {
    registrationCertificateRequired?: boolean;
    similarProjectMinValue?: number;
    turnoverMinAvg?: number;
  };

  timeline: {
    preBidMeeting?: string; // ISO date or datetime
    siteVisitStart?: string;
    siteVisitEnd?: string;
    clarificationDeadline?: string;
    bidOpeningDate?: string; // ISO datetime
  };

  submission: {
    documentLink?: string;
    submissionMode: 'Physical' | 'Online' | string;
    submissionAddress?: string;
  };

  issuingAuthority: {
    organization: string;
    department?: string;
    address?: string;
    tenderLocation?: string;
    languageOfBids?: string;
    governingLaw?: string;
  };
}

export interface TenderCreate {
  summary: Tender['summary'];
  financials: Tender['financials'];
  scope: Tender['scope'];
  eligibility: Tender['eligibility'];
  timeline: Tender['timeline'];
  submission: Tender['submission'];
  issuingAuthority: Tender['issuingAuthority'];
  /** Optional linkage */
  serviceId?: number;
  /** Initial status, default handled by backend */
  status?: Tender['status'];
}

export interface TenderUpdate {
  summary?: Partial<Tender['summary']>;
  financials?: Partial<Tender['financials']>;
  scope?: Partial<Tender['scope']>;
  eligibility?: Partial<Tender['eligibility']>;
  timeline?: Partial<Tender['timeline']>;
  submission?: Partial<Tender['submission']>;
  issuingAuthority?: Partial<Tender['issuingAuthority']>;
  serviceId?: number;
  status?: Tender['status'];
}

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