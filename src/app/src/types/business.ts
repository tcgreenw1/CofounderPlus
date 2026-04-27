export interface Business {
  id: string;
  userId: string;
  name: string;
  industry: string;
  description: string;
  stage?: string;
  revenue?: number;
  employees?: number;
  founded?: number;
  location?: string;
  website?: string;
  status: string;
  roadmap_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessContextType {
  selectedBusiness: Business | null;
  userBusinesses: Business[];
  setSelectedBusiness: (business: Business | null) => void;
  loadUserBusinesses: () => Promise<void>;
  createNewBusiness: (businessData: Partial<Business>) => Promise<Business | null>;
  isLoading: boolean;
  needsBusinessSetup: boolean;
}