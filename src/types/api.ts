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
  title: string;
  description: string;
  location: string;
  datePosted: string;
  closingDate: string;
  contactInfo: string;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  serviceId: number;
  documentPath?: string;
  questionDeadline: string;
  /** Indicates whether the tender is free (no associated fee/cost). */
  isFree: boolean;
}

export interface TenderCreate {
  title: string;
  description: string;
  location: string;
  closingDate: string;
  contactInfo: string;
  serviceId: number;
  questionDeadline: string;
  /** If omitted, defaults to false at creation time. */
  isFree?: boolean;
}

export interface TenderUpdate {
  title: string;
  description: string;
  location: string;
  closingDate: string;
  contactInfo: string;
  questionDeadline: string;
  /** Allow updating free status; optional to avoid forcing updates. */
  isFree?: boolean;
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