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
}

export interface TenderCreate {
  title: string;
  description: string;
  location: string;
  closingDate: string;
  contactInfo: string;
  serviceId: number;
  questionDeadline: string;
}

export interface TenderUpdate {
  title: string;
  description: string;
  location: string;
  closingDate: string;
  contactInfo: string;
  questionDeadline: string;
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