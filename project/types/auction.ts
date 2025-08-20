export interface AuctionItem {
  id: string;
  url?: string;
  auctionName?: string;
  lotNumber?: string;
  images?: string[];
  mainImageUrl?: string; // Add main image URL field
  sku?: string;
  itemName?: string;
  category?: string;
  description?: string;
  lead?: string;
  auctionSiteEstimate?: string;
  aiDescription?: string;
  aiEstimate?: string;
  status: 'research' | 'waiting' | 'winning' | 'photography' | 'research2' | 'finalized';
  researcherEstimate?: string;
  researcherDescription?: string;
  referenceUrls?: string[];
  photographerQuantity?: number;
  photographerImages?: string[];
  finalData?: any;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'researcher' | 'photographer' | 'researcher2' | 'admin';
  createdAt: Date;
  isActive: boolean;
  avatar?: string;
}

export interface WorkflowStep {
  id: string;
  itemId: string;
  fromStatus: AuctionItem['status'];
  toStatus: AuctionItem['status'];
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
  data?: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'item_assigned' | 'status_change' | 'new_item' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  itemId?: string;
}

export interface DashboardStats {
  total: number;
  research: number;
  waiting: number;
  winning: number;
  photography: number;
  research2: number;
  finalized: number;
  myItems: number;
  overdue: number;
}
