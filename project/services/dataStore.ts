import { AuctionItem, UserAccount, WorkflowStep, Notification, DashboardStats } from '@/types/auction';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

class DataStore {
  private items: AuctionItem[] = [];
  private users: UserAccount[] = [];
  private workflowSteps: WorkflowStep[] = [];
  private notifications: Notification[] = [];
  private useDatabase = true;

  constructor() {
    // Only initialize if we're in a browser environment
    if (isBrowser) {
      this.initializeStorage();
    }
  }

  private async initializeStorage() {
    // Use PostgreSQL database for production
    this.useDatabase = true;
    console.log('🚀 Production mode: Using PostgreSQL database for storage');
    
    // Clean up any existing demo data
    this.cleanupDemoData();
    
    this.loadFromLocalStorage();
    this.initializeAdminUser();
  }

  private cleanupDemoData() {
    if (!isBrowser) return;
    
    try {
      // Clear any existing demo data
      localStorage.removeItem('auctionItems');
      localStorage.removeItem('workflowSteps');
      localStorage.removeItem('notifications');
      
      // Only keep user accounts (admin will be recreated if needed)
      const existingUsers = localStorage.getItem('userAccounts');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        // Filter out demo users, keep only admin
        const productionUsers = users.filter((user: UserAccount) => 
          user.role === 'admin' && user.email === 'admin@example.com'
        );
        if (productionUsers.length > 0) {
          localStorage.setItem('userAccounts', JSON.stringify(productionUsers));
        } else {
          localStorage.removeItem('userAccounts');
        }
      }
      
      console.log('🧹 Demo data cleaned up for production');
    } catch (error) {
      console.error('Error cleaning up demo data:', error);
    }
  }

  private loadFromLocalStorage() {
    if (!isBrowser) return;
    
    try {
      const storedItems = localStorage.getItem('auctionItems');
      const storedUsers = localStorage.getItem('userAccounts');
      const storedWorkflow = localStorage.getItem('workflowSteps');
      const storedNotifications = localStorage.getItem('notifications');

      if (storedItems) this.items = JSON.parse(storedItems);
      if (storedUsers) this.users = JSON.parse(storedUsers);
      if (storedWorkflow) this.workflowSteps = JSON.parse(storedWorkflow);
      if (storedNotifications) this.notifications = JSON.parse(storedNotifications);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    if (!isBrowser) return;
    
    try {
      localStorage.setItem('auctionItems', JSON.stringify(this.items));
      localStorage.setItem('userAccounts', JSON.stringify(this.users));
      localStorage.setItem('workflowSteps', JSON.stringify(this.workflowSteps));
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  private initializeAdminUser() {
    if (!isBrowser) return;
    
    // Check if admin user already exists
    const adminExists = this.users.find(user => user.role === 'admin');
    if (!adminExists) {
      // Create only the essential admin user for production
      const adminUser: UserAccount = {
        id: 'admin-001',
        name: process.env.ADMIN_NAME || 'Bidsquire Admin',
        email: process.env.ADMIN_EMAIL || 'admin@bidsquire.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@bids25',
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      };
      this.users.push(adminUser);
      this.saveToLocalStorage();
    }
  }

  // Auction Items
  async getItems(): Promise<AuctionItem[]> {
    return [...this.items];
  }

  getItemsByStatus(status: AuctionItem['status']): AuctionItem[] {
    return this.items.filter(item => item.status === status);
  }

  getItemsByUser(userId: string): AuctionItem[] {
    return this.items.filter(item => item.assignedTo === userId);
  }

  getItem(id: string): AuctionItem | undefined {
    return this.items.find(item => item.id === id);
  }

  async addItem(item: Omit<AuctionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuctionItem> {
    if (this.useDatabase) {
      try {
        // Import database service directly for server-side operations
        const { databaseService } = await import('@/services/database');
        const newItem = await databaseService.createAuctionItem(item);
        this.items.push(newItem);
        return newItem;
      } catch (error) {
        console.error('Error creating auction item in database:', error);
        throw error;
      }
    } else {
      const newItem: AuctionItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.items.push(newItem);
      this.saveToLocalStorage();
      return newItem;
    }
  }

  async updateItem(id: string, updates: Partial<AuctionItem>): Promise<AuctionItem | null> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...this.items[index],
      ...updates,
      updatedAt: new Date()
    };

    this.items[index] = updatedItem;
    this.saveToLocalStorage();
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.items.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  // Users
  async getUsers(): Promise<UserAccount[]> {
    if (this.useDatabase) {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error fetching users from database:', error);
      }
    }
    return [...this.users];
  }

  async getUser(id: string): Promise<UserAccount | undefined> {
    if (this.useDatabase) {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error fetching user from database:', error);
      }
    }
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    if (this.useDatabase) {
      try {
        const response = await fetch(`/api/users/email/${email}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error fetching user by email from database:', error);
      }
    }
    return this.users.find(user => user.email === email);
  }

  async addUser(userData: Omit<UserAccount, 'id' | 'createdAt'>): Promise<UserAccount> {
    if (this.useDatabase) {
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error creating user in database:', error);
      }
    }
    
    const newUser: UserAccount = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date()
    };
    
    this.users.push(newUser);
    this.saveToLocalStorage();
    return newUser;
  }

  async updateUser(userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return null;

    // Don't allow changing the role of the last admin user
    if (updates.role && updates.role !== 'admin') {
      const adminUsers = this.users.filter(user => user.role === 'admin');
      if (adminUsers.length === 1 && adminUsers[0].id === userId) {
        throw new Error('Cannot change the role of the last admin user');
      }
    }

    this.users[index] = {
      ...this.users[index],
      ...updates
    };
    
    this.saveToLocalStorage();
    return this.users[index];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return false;

    // Don't allow deleting the last admin user
    const adminUsers = this.users.filter(user => user.role === 'admin');
    if (adminUsers.length === 1 && adminUsers[0].id === userId) {
      throw new Error('Cannot delete the last admin user');
    }

    this.users.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  // Password change functionality
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.password !== currentPassword) {
      return false;
    }

    user.password = newPassword;
    this.saveToLocalStorage();
    return true;
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const index = this.users.findIndex(user => user.id === userId);
    if (index === -1) return null;

    // Don't allow role changes through profile update
    const { role, ...safeUpdates } = updates;
    
    this.users[index] = {
      ...this.users[index],
      ...safeUpdates
    };
    this.saveToLocalStorage();
    return this.users[index];
  }

  // Workflow
  addWorkflowStep(step: Omit<WorkflowStep, 'id' | 'timestamp'>): WorkflowStep {
    const newStep: WorkflowStep = {
      ...step,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    this.workflowSteps.push(newStep);
    this.saveToLocalStorage();
    return newStep;
  }

  getWorkflowSteps(itemId: string): WorkflowStep[] {
    return this.workflowSteps.filter(step => step.itemId === itemId);
  }

  // Notifications
  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    this.notifications.push(newNotification);
    this.saveToLocalStorage();
    return newNotification;
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(notification => notification.userId === userId);
  }

  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return false;

    notification.read = true;
    this.saveToLocalStorage();
    return true;
  }

  // Dashboard Stats
  getDashboardStats(userId?: string): DashboardStats {
    const userItems = userId ? this.items.filter(item => item.assignedTo === userId) : [];
    
    return {
      total: this.items.length,
      research: this.items.filter(item => item.status === 'research').length,

      winning: this.items.filter(item => item.status === 'winning').length,
      photography: this.items.filter(item => item.status === 'photography').length,
      research2: this.items.filter(item => item.status === 'research2').length,
      finalized: this.items.filter(item => item.status === 'finalized').length,
      myItems: userItems.length,
      overdue: userItems.filter(item => {
        const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpdate > 7; // Items not updated in 7 days
      }).length
    };
  }

  // Workflow Management
  async moveItemToNextStatus(itemId: string, userId: string, userName: string, notes?: string): Promise<boolean> {
    const item = this.getItem(itemId);
    if (!item) return false;

    const currentStatus = item.status;
    let nextStatus: AuctionItem['status'];

    switch (currentStatus) {
      case 'research':
        nextStatus = 'winning';
        break;
      case 'winning':
        nextStatus = 'photography';
        break;
      case 'photography':
        nextStatus = 'research2';
        break;
      case 'research2':
        nextStatus = 'finalized';
        break;
      default:
        return false;
    }

    // Auto-assign user based on the next status
    const assignedUserId = await this.autoAssignUser(nextStatus);
    
    // Update item status and assignment
    const updateData: Partial<AuctionItem> = { status: nextStatus };
    if (assignedUserId) {
      updateData.assignedTo = assignedUserId;
    }
    
    const updated = await this.updateItem(itemId, updateData);
    if (!updated) return false;

    // Get assigned user info for logging
    const assignedUser = assignedUserId ? await this.getUser(assignedUserId) : null;
    const assignmentNote = assignedUser ? ` (Auto-assigned to ${assignedUser.name})` : '';
    
    // Add workflow step
    this.addWorkflowStep({
      itemId,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      userId,
      userName,
      notes: `${notes || ''}${assignmentNote}`
    });

    // Add notification to the newly assigned user
    this.addNotification({
      userId: assignedUserId || item.assignedTo || userId,
      type: 'status_change',
      title: 'Item Status Updated',
      message: `Item "${item.itemName}" moved from ${currentStatus} to ${nextStatus}`,
      read: false,
      itemId
    });

    // Send webhook when researcher moves item to winning status (non-blocking)
    if (currentStatus === 'research' && nextStatus === 'winning') {
      // Fire and forget - don't wait for response
      this.sendResearcherProgressionWebhook(itemId).catch(error => {
        console.error('❌ Researcher progression webhook failed (non-blocking):', error);
      });
    }

    return true;
  }

  // Find first researcher user for auto-assignment
  private async findResearcherUser(): Promise<UserAccount | null> {
    try {
      const users = await this.getUsers();
      return users.find(user => user.role === 'researcher' && user.isActive) || null;
    } catch (error) {
      console.error('Error finding researcher user:', error);
      return null;
    }
  }

  // Find first researcher2 user for auto-assignment
  private async findResearcher2User(): Promise<UserAccount | null> {
    try {
      const users = await this.getUsers();
      return users.find(user => user.role === 'researcher2' && user.isActive) || null;
    } catch (error) {
      console.error('Error finding researcher2 user:', error);
      return null;
    }
  }

  // Find first photographer user for auto-assignment
  private async findPhotographerUser(): Promise<UserAccount | null> {
    try {
      const users = await this.getUsers();
      return users.find(user => user.role === 'photographer' && user.isActive) || null;
    } catch (error) {
      console.error('Error finding photographer user:', error);
      return null;
    }
  }

  // Auto-assign user based on item status
  private async autoAssignUser(status: string): Promise<string | undefined> {
    try {
      let assignedUser: UserAccount | null = null;
      
      switch (status) {
        case 'research':
          assignedUser = await this.findResearcherUser();
          break;
        case 'research2':
          assignedUser = await this.findResearcher2User();
          break;
        case 'photography':
          assignedUser = await this.findPhotographerUser();
          break;
        default:
          return undefined;
      }
      
      return assignedUser?.id;
    } catch (error) {
      console.error('Error auto-assigning user:', error);
      return undefined;
    }
  }

  // Import from webhook data
  async importFromWebhook(webhookData: any): Promise<AuctionItem | null> {
    try {
      // Find first researcher user to auto-assign
      const researcher = await this.findResearcherUser();
      
      // Extract data from webhook structure
      let processedData: any = {};
      
      if (webhookData.httpData && webhookData.httpData[0] && webhookData.httpData[0].json) {
        const n8nData = webhookData.httpData[0].json;
        processedData = {
          url: n8nData.url || n8nData.url_main || '', // Handle both URL field names
          itemName: n8nData.item_name || 'Unnamed Item',
          lotNumber: n8nData.lot_number || '',
          description: n8nData.description || '',
          auctionName: n8nData.auction_name || '',
          auctionSiteEstimate: n8nData.estimate || '',
          aiDescription: webhookData.cleanedOutput || webhookData.rawOutput || '',
          images: this.processImageUrls(n8nData.all_unique_image_urls),
          mainImageUrl: n8nData.main_image_url || '', // Add main image URL
          category: n8nData.category || 'Uncategorized',
          status: 'research' as const,
          priority: 'medium' as const,
          assignedTo: researcher?.id // Auto-assign to researcher
        };
      } else {
        processedData = {
          url: webhookData.url || webhookData.url_main || '', // Handle both URL field names
          itemName: webhookData.item_name || 'Unnamed Item',
          lotNumber: webhookData.lot_number || '',
          description: webhookData.description || '',
          auctionName: webhookData.auction_name || '',
          auctionSiteEstimate: webhookData.estimate || '',
          aiDescription: webhookData.ai_response || '',
          images: this.processImageUrls(webhookData.all_unique_image_urls),
          mainImageUrl: webhookData.main_image_url || '', // Add main image URL
          category: webhookData.category || 'Uncategorized',
          status: 'research' as const,
          priority: 'medium' as const,
          assignedTo: researcher?.id // Auto-assign to researcher
        };
      }

      // Create new auction item
      const newItem = await this.addItem(processedData);

      // Add workflow step
      this.addWorkflowStep({
        itemId: newItem.id,
        fromStatus: 'research',
        toStatus: 'research',
        userId: 'system',
        userName: 'System',
        notes: `Item imported from webhook and auto-assigned to ${researcher?.name || 'researcher'}`
      });

      return newItem;
    } catch (error) {
      console.error('Error importing from webhook:', error);
      return null;
    }
  }

  // Check storage type
  isUsingDatabase(): boolean {
    return this.useDatabase;
  }

  // Production data management
  clearAllData(): void {
    if (!isBrowser) return;
    
    try {
      // Clear all data
      this.items = [];
      this.workflowSteps = [];
      this.notifications = [];
      
      // Keep only admin user
      const adminUser = this.users.find(user => user.role === 'admin');
      this.users = adminUser ? [adminUser] : [];
      
      // Clear localStorage
      localStorage.removeItem('auctionItems');
      localStorage.removeItem('workflowSteps');
      localStorage.removeItem('notifications');
      
      // Save clean state
      this.saveToLocalStorage();
      
      console.log('🧹 All data cleared for production reset');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  // Get production status
  getProductionStatus(): { isClean: boolean; userCount: number; itemCount: number } {
    return {
      isClean: this.users.length <= 1 && this.items.length === 0,
      userCount: this.users.length,
      itemCount: this.items.length
    };
  }

  private processImageUrls(urls: string | string[]): string[] {
    if (!urls) return [];
    
    if (typeof urls === 'string') {
      console.log('🔍 Processing image URLs string:', urls);
      // Split by comma and filter out empty strings
      const urlArray = urls.split(',').map(url => url.trim()).filter(url => url.length > 0);
      console.log('✅ Processed image URLs:', urlArray);
      return urlArray;
    }
    
    if (Array.isArray(urls)) {
      console.log('🔍 Processing image URLs array:', urls);
      const urlArray = urls.map(url => url.trim()).filter(url => url.length > 0);
      console.log('✅ Processed image URLs:', urlArray);
      return urlArray;
    }
    
    console.log('⚠️ No valid image URLs found:', urls);
    return [];
  }

  // Send researcher progression webhook
  private async sendResearcherProgressionWebhook(itemId: string): Promise<void> {
    try {
      const item = this.getItem(itemId);
      if (!item) {
        console.error('❌ Item not found for webhook:', itemId);
        return;
      }

      console.log('📤 Sending researcher progression webhook for item:', item.itemName);

      const response = await fetch('/api/webhook/send-researcher-progression', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemData: item }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Researcher progression webhook sent successfully:', result.message);
      } else {
        const errorData = await response.json();
        console.error('❌ Researcher progression webhook failed:', errorData);
      }
    } catch (error) {
      console.error('❌ Error sending researcher progression webhook:', error);
    }
  }
}

export const dataStore = new DataStore();
