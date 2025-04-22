export type PurchaseStatus = "Purchased" | "Ordered" | "Return Expected";
export type ItemStatus = "Pending Delivery" | "Delivered" | "Issue" | "Late" | "Archived";
export type Destination = "FBA Prep" | "Local Stock Shelf A" | "Refurbish Pile" | "Return to Supplier" | string; // Allow custom destinations

// --- Activity Log Types ---
export type ActivityEventType =
  | 'CREATED'
  | 'EDITED'
  | 'STATUS_CHANGED'
  | 'FLAG_TOGGLED'
  | 'ISSUE_REPORTED'
  | 'ISSUE_UPDATE_ADDED'
  | 'ISSUE_RESOLVED'
  | 'NOTE_ADDED'; // For general notes

export interface ActivityEvent {
  timestamp: string; // ISO timestamp string
  type: ActivityEventType;
  details: {
    previousStatus?: ItemStatus;
    newStatus?: ItemStatus;
    isFlagged?: boolean;
    note?: string; // For ISSUE_UPDATE_ADDED or NOTE_ADDED
    issueDescription?: string; // For ISSUE_REPORTED
    resolutionOutcome?: string; // For ISSUE_RESOLVED
    changedFields?: string[]; // For EDITED event
  };
}

export interface StockItem {
  id: string; // Unique identifier for the item record
  purchaseStatus: PurchaseStatus;
  deliveryName: string; // User-defined batch name
  productName: string;
  quantity: number;
  pricePerItem: number; // Currency value
  orderNumber?: string; // Optional external order reference
  orderDate: string; // ISO date string format (e.g., "2025-04-16")
  seller?: string; // Optional
  isVatRegistered?: "Yes" | "No" | "Unknown"; // Optional VAT status
  destination?: Destination; // Optional planned destination
  asinSku?: string; // Optional ASIN or SKU
  acquisitionNotes?: string; // Formerly Buyer Instructions
  currentStatus: ItemStatus;
  dateDelivered?: string; // ISO timestamp string, set when marked delivered
  processorNotes?: string; // Notes added during processing
  issueDescription?: string; // Details if status is "Issue"
  isFlagged?: boolean; // Add optional flag field
  activityLog?: ActivityEvent[]; // Add the log array (optional initially)
} 