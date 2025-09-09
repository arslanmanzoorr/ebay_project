export interface AuctionItem {
  id: string;
  url?: string;
  url_main?: string; // Alternative URL field name from webhook data
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
  status: 'research' | 'winning' | 'photography' | 'research2' | 'finalized';
  researcherEstimate?: string;
  researcherDescription?: string;
  referenceUrls?: string[];
  similarUrls?: string[]; // New field for similar item URLs
  photographerQuantity?: number;
  photographerImages?: string[];
  isMultipleItems?: boolean; // New field to mark if item has multiple pieces
  multipleItemsCount?: number; // New field to specify how many items
  finalData?: any;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes?: string;
  photographerNotes?: string; // Separate notes for photographer
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  parentItemId?: string; // For sub-items, reference to parent item
  subItemNumber?: number; // For sub-items, the number (1, 2, 3, etc.)
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'researcher' | 'photographer' | 'researcher2' | 'admin';
  createdAt: Date;
  updatedAt: Date;
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
  winning: number;
  photography: number;
  research2: number;
  finalized: number;
  myItems: number;
  overdue: number;
}
