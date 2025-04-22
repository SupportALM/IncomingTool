import React, { useState, useRef, useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StockItem, ItemStatus, ActivityEvent, ActivityEventType } from './types'; // Import the interface
import AddItemForm from './AddItemForm'; // Import the form component
import ItemDetailModal from './ItemDetailModal'; // Import the details modal
import ReportIssueModal from './ReportIssueModal'; // Import the new modal
import AddUpdateModal from './AddUpdateModal'; // Import the new modal
import ResolveIssueModal from './ResolveIssueModal'; // Import the new modal
import TableSettingsModal from './TableSettingsModal'; // Import the new modal

// Remove placeholder definitions
// const ReportIssueModal = ...
// const AddUpdateModal = ...; // Remove this placeholder definition
// const ResolveIssueModal = ({ onSubmit, onClose }: { onSubmit: (outcome: string, note?: string) => void, onClose: () => void }) => <div style={{position:'fixed', top:'40%', left:'40%', background:'lightgreen', border:'1px solid black', padding:20, zIndex:50}}>Resolve Issue Placeholder<button onClick={() => onSubmit(prompt('Outcome?') || 'Accepted', prompt('Notes?') || '')}>Save</button><button onClick={onClose}>Cancel</button></div>;

// --- Placeholder Components (to be implemented later) ---
const SearchBar = ({ onSearch, inputRef }: { onSearch: (term: string) => void, inputRef?: React.RefObject<HTMLInputElement | null> }) => (
  <input
    ref={inputRef}
    type="text"
    placeholder="Search by Delivery Name or Product Name..."
    onChange={e => onSearch(e.target.value)}
    style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
  />
);

const FilterTabs = ({ currentFilter, onFilterChange }: { currentFilter: ItemStatus | 'All'; onFilterChange: (filter: ItemStatus | 'All') => void }) => {
  const filters: (ItemStatus | 'All')[] = ['All', 'Pending Delivery', 'Delivered', 'Issue', 'Late', 'Archived']; // Added Delivered & Archived
  return (
    <div style={{ marginBottom: '1rem' }}>
      {filters.map(filter => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          style={{ fontWeight: currentFilter === filter ? 'bold' : 'normal', marginRight: '0.5rem', padding: '0.5rem' }}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

// --- Helper Functions ---
// Function to check if an item is late (Pending Delivery and Order Date > 7 days ago)
const isItemLate = (item: StockItem): boolean => {
  if (item.currentStatus !== 'Pending Delivery') {
    return false;
  }
  const orderDate = new Date(item.orderDate);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return orderDate < sevenDaysAgo;
};

const getStatusStyle = (status: ItemStatus, isLate: boolean, isFlagged?: boolean): React.CSSProperties => { // Added isFlagged
  // Basic style adjustments for flagged items (e.g., slightly bolder border or specific color)
  const flaggedStyle: React.CSSProperties = isFlagged ? { borderLeft: '3px solid red' } : {}; // Example: Red left border
  
  let baseStyle: React.CSSProperties = {};
  if (status === 'Pending Delivery' && isLate) {
    baseStyle = { backgroundColor: '#cce5ff', color: '#004085' }; // Light Blue for Late
  } else {
    switch (status) {
      case 'Pending Delivery': baseStyle = { backgroundColor: '#fff3cd', color: '#856404' }; break;
      case 'Delivered': baseStyle = { backgroundColor: '#d4edda', color: '#155724' }; break;
      case 'Issue': baseStyle = { backgroundColor: '#f8d7da', color: '#721c24' }; break;
      case 'Archived': baseStyle = { backgroundColor: '#e2e3e5', color: '#383d41' }; break;
      default: baseStyle = {}; break;
    }
  }
  return { ...baseStyle, ...flaggedStyle }; // Combine base style with flagged indicator
};

// Function to create a new ActivityEvent
const createActivityEvent = (
    type: ActivityEventType,
    details: ActivityEvent['details'] = {}
): ActivityEvent => ({
    timestamp: new Date().toISOString(),
    type,
    details,
});

// Function to determine available actions based on status
const getAvailableActions = (status: ItemStatus, isFlagged?: boolean): string[] => {
  let actions: string[] = [];
  switch (status) {
    case 'Pending Delivery':
      actions = ['Mark as Delivered', 'Report Issue', 'View Details', 'Edit Item']; break;
    case 'Delivered':
      actions = ['Archive', 'Report Issue', 'View Details', 'Edit Item']; break;
    case 'Issue': // Issue-specific actions
      actions = ['Resolve Issue', 'Add Issue Update', 'Archive', 'View Details', 'Edit Item']; break;
    case 'Late': 
      actions = ['Mark as Delivered', 'Report Issue', 'View Details', 'Edit Item']; break;
    case 'Archived':
      actions = ['View Details']; break;
    default:
      actions = ['View Details']; break;
  }
  if (status !== 'Archived') {
    actions.unshift(isFlagged ? 'Unflag Item' : 'Flag Item');
  }
  return actions;
};

// Simple Action Menu Component
interface ActionMenuProps {
  itemId: string;
  actions: string[];
  onActionSelected: (itemId: string, action: string) => void;
  onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ itemId, actions, onActionSelected, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} style={{
      position: 'absolute',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
      zIndex: 10, // Ensure it appears above other elements
      minWidth: '150px',
      marginTop: '2px' // Small gap below the button
    }}>
      {actions.map(action => (
        <button
          key={action}
          onClick={() => onActionSelected(itemId, action)}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {action}
        </button>
      ))}
    </div>
  );
};

// --- Configuration ---
export interface ColumnConfig {
  id: keyof StockItem | 'actions'; // Use StockItem keys + custom 'actions' key
  label: string;
}

// Define all possible columns (excluding activityLog for direct table display)
const ALL_COLUMNS: ColumnConfig[] = [
  { id: 'orderDate', label: 'Order Date' },
  { id: 'quantity', label: 'Qty' },
  { id: 'productName', label: 'Product Name' },
  { id: 'deliveryName', label: 'Delivery Name' },
  { id: 'pricePerItem', label: 'Price/Item' },
  { id: 'seller', label: 'Seller/Source' },
  { id: 'destination', label: 'Destination' },
  { id: 'asinSku', label: 'ASIN/SKU' },
  { id: 'purchaseStatus', label: 'Purchase Status' },
  { id: 'orderNumber', label: 'Order #' },
  { id: 'currentStatus', label: 'Status' },
  { id: 'isFlagged', label: 'Flagged' },
  { id: 'acquisitionNotes', label: 'Acquisition Notes' },
  { id: 'issueDescription', label: 'Issue Description' },
  { id: 'dateDelivered', label: 'Date Delivered' },
  { id: 'actions', label: 'Actions' },
];

// Default visible columns (keys/ids)
const DEFAULT_VISIBLE_COLUMN_IDS: Array<ColumnConfig['id']> = [
    'orderDate', 
    'quantity', 
    'productName', 
    'deliveryName', 
    'currentStatus', 
    'actions',
];

const LOCAL_STORAGE_KEY_VISIBLE_COLUMNS = 'incomingTool_visibleColumns';

// --- Mock Data --- (Restoring definition)
const MOCK_STOCK_ITEMS: StockItem[] = [
  {
    id: '1',
    purchaseStatus: 'Purchased',
    deliveryName: 'eBay Batch Apr 16',
    productName: 'Blue Widget Model X',
    quantity: 10,
    pricePerItem: 12.50,
    orderNumber: '12-34567-89012',
    orderDate: '2024-04-16',
    seller: 'ebay_user_123',
    destination: 'FBA Prep',
    currentStatus: 'Pending Delivery',
    isFlagged: false,
    activityLog: [],
  },
  {
    id: '2',
    purchaseStatus: 'Ordered',
    deliveryName: 'Supplier ABC Batch 3',
    productName: 'Red T-Shirt Large',
    quantity: 50,
    pricePerItem: 5.00,
    orderDate: '2024-04-10',
    seller: 'Supplier XYZ Inc.',
    destination: 'Local Stock Shelf A',
    currentStatus: 'Delivered',
    dateDelivered: '2024-04-15T10:30:00Z',
    isFlagged: true,
    activityLog: [],
  },
  {
    id: '3',
    purchaseStatus: 'Return Expected',
    deliveryName: 'Jane Smith RMA 987',
    productName: 'Green Gadget',
    quantity: 1,
    pricePerItem: 25.00,
    orderDate: '2024-04-12',
    seller: 'Jane Smith (Return)',
    destination: 'Refurbish Pile',
    currentStatus: 'Issue',
    issueDescription: 'Item returned broken by customer.',
    isFlagged: false,
    activityLog: [],
  },
];

// --- Draggable Header Component ---
interface DraggableHeaderProps {
  col: ColumnConfig;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({ col }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : 1, // Ensure dragged header is above others
    cursor: 'move',
    border: '1px solid #ccc',
    padding: '8px',
    textAlign: col.id === 'actions' ? 'center' : 'left',
    backgroundColor: isDragging ? '#e0e0e0' : '#f2f2f2' // Highlight when dragging
  };

  return (
    <th ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {col.label}
    </th>
  );
};

// Update StockProcessingList props to accept onColumnReorder
const StockProcessingList = ({
  items,
  visibleColumns, // Pass the ordered list of visible column configs
  onActionSelected,
  onViewDetails,
  onColumnReorder // Add prop for reordering columns
}: {
  items: StockItem[];
  visibleColumns: ColumnConfig[];
  onActionSelected: (itemId: string, action: string) => void;
  onViewDetails: (itemId: string) => void;
  onColumnReorder: (event: DragEndEvent) => void; // Type for dnd-kit event
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMenuToggle = (itemId: string) => {
    setOpenMenuId(prevId => (prevId === itemId ? null : itemId));
  };

  const handleCloseMenu = () => {
    setOpenMenuId(null);
  };

  const handleAction = (itemId: string, action: string) => {
    if (action === 'View Details') {
      onViewDetails(itemId);
    } else {
      onActionSelected(itemId, action);
    }
    handleCloseMenu();
  };

  // Function to render cell content based on column ID
  const renderCellContent = (item: StockItem, columnId: ColumnConfig['id']) => {
    // Helper for potentially null/undefined primitives
    const renderPrimitive = (value: string | number | boolean | null | undefined) => {
        if (typeof value === 'string' || typeof value === 'number') {
          return value;
        } else if (typeof value === 'boolean') {
          return value ? 'Yes' : 'No';
        }
        return '-'; // Default for null/undefined
    };

    switch (columnId) {
        case 'isFlagged':
            return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{item.isFlagged ? '🚩' : ''}</td>;
        case 'actions': 
            return (
                <td 
                  key={'actions'} 
                  style={{ border: '1px solid #ccc', padding: '0px', textAlign: 'center', position: 'relative' }} 
                  onClick={(e) => e.stopPropagation()} 
                >
                   {item.currentStatus !== 'Archived' && (
                    <button
                        style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2em', padding: '8px' }}
                        title="Actions"
                        onClick={(e) => { e.stopPropagation(); handleMenuToggle(item.id); }}
                    >
                        ⋮
                    </button>
                  )}
                  {openMenuId === item.id && (
                    <ActionMenu
                        itemId={item.id}
                        actions={getAvailableActions(item.currentStatus, item.isFlagged)}
                        onActionSelected={handleAction}
                        onClose={handleCloseMenu}
                    />
                  )}
                </td>
            );
        case 'currentStatus':
             const isLate = isItemLate(item); 
             return (
                 <td 
                    key={columnId} 
                    style={{ border: '1px solid #ccc', padding: '8px', ...getStatusStyle(item.currentStatus, isLate, item.isFlagged) }} 
                    onClick={(e) => e.stopPropagation()}
                 >
                    {item.currentStatus}
                 </td>
             );
         case 'quantity':
         case 'pricePerItem':
            const numValue = item[columnId as keyof StockItem];
            return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{typeof numValue === 'number' ? numValue : '-'}</td>;
        case 'dateDelivered': 
        case 'orderDate':
             const dateValue = item[columnId as keyof StockItem];
             // Format date or show hyphen
             const formattedDate = typeof dateValue === 'string' && dateValue ? new Date(dateValue).toLocaleDateString() : '-';
             return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px' }}>{formattedDate}</td>; 
        case 'acquisitionNotes':
        case 'issueDescription':
            // These *could* technically have other types if StockItem changes, so explicitly check for string
            const noteValue = item[columnId];
            return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px' }}>{typeof noteValue === 'string' ? renderPrimitive(noteValue) : '-'}</td>;
        // Explicit cases for all other configured string/nullable columns
        case 'productName':
        case 'deliveryName':
        case 'seller':
        case 'destination':
        case 'asinSku':
        case 'purchaseStatus':
        case 'orderNumber':
            // These are expected to be string | undefined based on StockItem type
            return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px' }}>{renderPrimitive(item[columnId])}</td>;
        // Default case should ideally not be hit if ALL_COLUMNS is exhaustive
        default: 
             console.warn("Unhandled column ID in renderCellContent:", columnId);
             return <td key={columnId} style={{ border: '1px solid #ccc', padding: '8px' }}>???</td>; 
    }
  };

  return (
    <div>
      <h4>Stock & Processing List</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          {/* Wrap header row with DndContext and SortableContext */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter} // Simple collision detection is fine
            onDragEnd={onColumnReorder} // Call handler passed from ToolApp
          >
            <SortableContext
              items={visibleColumns.map(col => col.id)} // Use column IDs as items
              strategy={horizontalListSortingStrategy} // Use horizontal strategy
            >
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                {/* Use DraggableHeader component */}
                {visibleColumns.map(col => (
                   <DraggableHeader key={col.id} col={col} />
                ))}
              </tr>
            </SortableContext>
          </DndContext>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item, index) => (
            <tr
              key={item.id}
              style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', cursor: 'pointer' }}
              onClick={() => onViewDetails(item.id)}
            >
              {/* Render cells based on visibleColumns */}
              {visibleColumns.map(col => renderCellContent(item, col.id))}
            </tr>
          )) : (
            <tr>
              {/* Adjust colspan based on visible columns count */}
              <td colSpan={visibleColumns.length} style={{ border: '1px solid #ccc', padding: '16px', textAlign: 'center' }}>
                No items match the current filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const AddItemButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', cursor: 'pointer' }}>
    + Add New Item
  </button>
);

// Component for the Flag Toggle Switch
const FlagToggle = ({ isChecked, onChange }: { isChecked: boolean; onChange: (checked: boolean) => void }) => (
  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}> {/* Push to the right */} 
    <label htmlFor="flagToggle" style={{ marginRight: '8px', fontWeight: 'bold' }}>Show Flagged Only:</label>
    <input 
      type="checkbox" 
      id="flagToggle"
      checked={isChecked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: '20px', height: '20px' }} // Basic styling for visibility
    />
  </div>
);

// --- Main Tool Component ---
const ToolApp = () => {
  const [allItems, setAllItems] = useState<StockItem[]>(MOCK_STOCK_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<ItemStatus | 'All'>('Pending Delivery'); // Default filter
  const [selectedItemDetails, setSelectedItemDetails] = useState<StockItem | null>(null); // For View Details Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false); // State for modal visibility
  const [showFlaggedOnly, setShowFlaggedOnly] = useState<boolean>(false); // State for flag toggle
  const [editingItem, setEditingItem] = useState<StockItem | null>(null); // State to hold item being edited
  // State for new modals
  const [reportingIssueItem, setReportingIssueItem] = useState<StockItem | null>(null);
  const [addingUpdateItem, setAddingUpdateItem] = useState<StockItem | null>(null);
  const [resolvingIssueItem, setResolvingIssueItem] = useState<StockItem | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for settings modal

  // State for column configuration (order matters now)
  const [visibleColumnIds, setVisibleColumnIds] = useState<Array<ColumnConfig['id']>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_VISIBLE_COLUMNS);
      // Ensure stored value is an array, otherwise use default
      const parsed = stored ? JSON.parse(stored) : DEFAULT_VISIBLE_COLUMN_IDS;
      return Array.isArray(parsed) ? parsed : DEFAULT_VISIBLE_COLUMN_IDS;
    } catch (error) {
      console.error("Error reading visible columns from localStorage", error);
      return DEFAULT_VISIBLE_COLUMN_IDS;
    }
  });
  
  // Save visible columns to localStorage whenever they change
  useEffect(() => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY_VISIBLE_COLUMNS, JSON.stringify(visibleColumnIds));
    } catch (error) {
        console.error("Error saving visible columns to localStorage", error);
    }
  }, [visibleColumnIds]);

  // Derive visible columns based on IDs state (order is now determined by visibleColumnIds)
  const visibleColumns = visibleColumnIds
      .map(id => ALL_COLUMNS.find(col => col.id === id))
      .filter((col): col is ColumnConfig => col !== undefined); // Filter out undefined if an ID becomes invalid

  // Update filtering logic to include flag toggle
  const filteredItems = allItems.filter(item => {
    const matchesSearch = 
      !searchTerm || 
      item.deliveryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesFilter = false;
    if (currentFilter === 'All') {
        matchesFilter = true;
    } else if (currentFilter === 'Late') {
        // Show items that are pending and meet the late criteria
        matchesFilter = isItemLate(item);
    } else {
        // Standard status matching, but don't show late items unless 'Late' or 'All' filter is selected
        // Or should late items still appear in Pending Delivery? Let's keep them there for now.
        matchesFilter = item.currentStatus === currentFilter;
    }

    // Apply flag filter if toggle is on
    const matchesFlag = !showFlaggedOnly || item.isFlagged === true;

    return matchesFilter && matchesSearch && matchesFlag; // Add flag condition
  });

  // Placeholder functions for actions
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter: ItemStatus | 'All') => {
    setCurrentFilter(filter);
  };

  // Centralized function to update item state and add log entry
  const updateItemAndLog = (itemId: string, changes: Partial<StockItem>, event: ActivityEvent) => {
    setAllItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { 
              ...item, 
              ...changes, // Apply direct changes (like status, flag)
              activityLog: [...(item.activityLog || []), event] // Append event
            }
          : item
      )
    );
  };

  // Update handleItemAction to dispatch to specific handlers or generic updates
  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Action: ${action} on item ${itemId}`);
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    switch (action) {
      case 'Edit Item':
        setEditingItem(item);
        setIsAddItemModalOpen(true);
        break;
      case 'Report Issue':
        setReportingIssueItem(item);
        break;
      case 'Add Issue Update':
        setAddingUpdateItem(item);
        break;
      case 'Resolve Issue':
        setResolvingIssueItem(item);
        break;
      case 'Flag Item':
      case 'Unflag Item':
        const newFlagState = action === 'Flag Item';
        updateItemAndLog(itemId, 
          { isFlagged: newFlagState }, 
          createActivityEvent('FLAG_TOGGLED', { isFlagged: newFlagState })
        );
        break;
      case 'Mark as Delivered':
        if (item.currentStatus !== 'Delivered') {
          updateItemAndLog(itemId,
            { currentStatus: 'Delivered', dateDelivered: new Date().toISOString() },
            createActivityEvent('STATUS_CHANGED', { previousStatus: item.currentStatus, newStatus: 'Delivered' })
          );
        }
        break;
      case 'Archive':
         if (item.currentStatus !== 'Archived') {
          updateItemAndLog(itemId, 
            { currentStatus: 'Archived' },
            createActivityEvent('STATUS_CHANGED', { previousStatus: item.currentStatus, newStatus: 'Archived' })
          );
         }
        break;
      // Default case for actions handled elsewhere or needing no state change here (like View Details)
    }
  };

  // Handler for saving the initial issue report
  const handleSaveReportIssue = (description: string) => {
    if (!reportingIssueItem) return;
    const itemId = reportingIssueItem.id;
    const previousStatus = reportingIssueItem.currentStatus;
    // Add ISSUE_REPORTED event
    const reportEvent = createActivityEvent('ISSUE_REPORTED', { issueDescription: description });
    // Add STATUS_CHANGED event
    const statusEvent = createActivityEvent('STATUS_CHANGED', { previousStatus, newStatus: 'Issue' });
    
    setAllItems(prevItems =>
        prevItems.map(item =>
            item.id === itemId
            ? { 
                ...item, 
                currentStatus: 'Issue',
                issueDescription: description, // Set initial description
                activityLog: [...(item.activityLog || []), reportEvent, statusEvent]
              }
            : item
        )
    );
    setReportingIssueItem(null); // Close modal
  };
  
  // Handler for adding an issue update note
  const handleSaveIssueUpdate = (note: string) => {
      if (!addingUpdateItem) return;
      updateItemAndLog(
          addingUpdateItem.id, 
          {}, // No direct state change needed for just adding a note
          createActivityEvent('ISSUE_UPDATE_ADDED', { note })
      );
      setAddingUpdateItem(null); // Close modal
  };

  // Handler for resolving an issue
  const handleSaveResolveIssue = (outcome: string, note?: string) => {
      if (!resolvingIssueItem) return;
      const itemId = resolvingIssueItem.id;
      const previousStatus = resolvingIssueItem.currentStatus;
      // Determine new status based on outcome
      let newStatus: ItemStatus = 'Delivered'; // Default
      if (outcome === 'Returned to Supplier' || outcome === 'Disposed Of') {
          newStatus = 'Archived';
      }
      // Could add more outcomes mapping to statuses
      
      const resolveEvent = createActivityEvent('ISSUE_RESOLVED', { resolutionOutcome: outcome, note });
      const statusEvent = createActivityEvent('STATUS_CHANGED', { previousStatus, newStatus });

      setAllItems(prevItems =>
          prevItems.map(item =>
              item.id === itemId
              ? { 
                  ...item, 
                  currentStatus: newStatus,
                  // Optionally clear initial issueDescription now?
                  // issueDescription: undefined, 
                  activityLog: [...(item.activityLog || []), resolveEvent, statusEvent]
                }
              : item
          )
      );
      setResolvingIssueItem(null); // Close modal
  };

  // Update handleSaveItem for add/edit logging
  const handleSaveItem = (itemData: Omit<StockItem, 'id' | 'currentStatus' | 'dateDelivered' | 'activityLog'> & { isFlagged: boolean }) => {
    if (editingItem) {
      // Log EDIT event - determine changed fields
      const changedFields = (Object.keys(itemData) as Array<keyof typeof itemData>).filter(key => 
          // Check if key exists on editingItem and if values differ
          editingItem.hasOwnProperty(key) && editingItem[key] !== itemData[key]
      );

      // Manually check isFlagged separately as it might not be in itemData type strictly but is passed
      if (editingItem.isFlagged !== itemData.isFlagged) {
         if (!changedFields.includes('isFlagged' as any)) { // Avoid duplicates if isFlagged was already part of itemData keys
              changedFields.push('isFlagged' as any); // Cast to any needed here due to type strictness
         }
      }
       
      const editEvent = createActivityEvent('EDITED', { changedFields: changedFields.length > 0 ? changedFields : undefined });
      
      setAllItems(prevItems => 
        prevItems.map(item => 
          item.id === editingItem.id 
            ? { 
                ...editingItem, 
                ...itemData,
                activityLog: [...(item.activityLog || []), editEvent] // Add edit event
              } 
            : item
        )
      );
      console.log('Updated item:', { ...editingItem, ...itemData });
    } else {
      // Log CREATED event
      const createdEvent = createActivityEvent('CREATED');
      const newItem: StockItem = {
        ...itemData,
        id: Date.now().toString(),
        currentStatus: 'Pending Delivery',
        activityLog: [createdEvent] // Start log with created event
      };
      setAllItems(prevItems => [newItem, ...prevItems]);
      console.log('Saved new item:', newItem);
    }
    handleCloseFormModal();
  };

  const handleViewDetails = (itemId: string) => {
    const itemToShow = allItems.find(item => item.id === itemId);
    setSelectedItemDetails(itemToShow || null); // Set state to show the modal
    // No alert needed now
  };

  const handleCloseDetailModal = () => {
    setSelectedItemDetails(null); // Clear state to hide the modal
  };

  const handleAddItem = () => {
    setIsAddItemModalOpen(true); // Open the modal
  };

  const handleCloseFormModal = () => {
    setIsAddItemModalOpen(false);
    setEditingItem(null); // Clear editing state when closing
  };

  // Handler for column drag-and-drop reordering
  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setVisibleColumnIds((currentIds) => {
        const oldIndex = currentIds.indexOf(active.id as ColumnConfig['id']);
        const newIndex = currentIds.indexOf(over.id as ColumnConfig['id']);
        // Use arrayMove to update the order
        return arrayMove(currentIds, oldIndex, newIndex);
      });
    }
  };

  // Handler for saving column visibility changes from modal
  const handleSaveColumnSettings = (idsFromModal: Array<ColumnConfig['id']>) => {
    setVisibleColumnIds(currentVisibleIds => {
        const modalIdSet = new Set(idsFromModal);

        // 1. Filter current IDs to keep only those still checked in the modal (preserves order)
        const keptOrderedIds = currentVisibleIds.filter(id => modalIdSet.has(id));

        // 2. Find IDs that are in the modal list but *not* in the current visible list (newly checked)
        const newlyAddedIds = idsFromModal.filter(id => !currentVisibleIds.includes(id));

        // 3. Combine the kept ordered IDs with the newly added ones
        const newVisibleOrder = [...keptOrderedIds, ...newlyAddedIds];

        // Ensure 'actions' column is always present if it was somehow removed (optional safeguard)
        // if (!newVisibleOrder.includes('actions') && ALL_COLUMNS.some(c => c.id === 'actions')) {
        //     newVisibleOrder.push('actions');
        // }

        return newVisibleOrder;
    });
    setIsSettingsModalOpen(false);
  };

  // Ref for search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input or textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (isAddItemModalOpen || isSettingsModalOpen || selectedItemDetails || reportingIssueItem || addingUpdateItem || resolvingIssueItem) {
        // Only allow Escape to close modals
        if (e.key === 'Escape') {
          if (isAddItemModalOpen) setIsAddItemModalOpen(false);
          if (isSettingsModalOpen) setIsSettingsModalOpen(false);
          if (selectedItemDetails) setSelectedItemDetails(null);
          if (reportingIssueItem) setReportingIssueItem(null);
          if (addingUpdateItem) setAddingUpdateItem(null);
          if (resolvingIssueItem) setResolvingIssueItem(null);
        }
        return;
      }
      switch (e.key) {
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case 'a':
        case 'A':
          setIsAddItemModalOpen(true);
          break;
        case 'c':
        case 'C':
          setIsSettingsModalOpen(true);
          break;
        case 'f':
        case 'F':
          setShowFlaggedOnly(v => !v);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddItemModalOpen, isSettingsModalOpen, selectedItemDetails, reportingIssueItem, addingUpdateItem, resolvingIssueItem]);

  return (
    <div style={{ padding: 24 }}> {/* Removed border from original template */}
      <h2>Incoming Stock Tool</h2>
      
      {/* Add Item Button */}
      <AddItemButton onClick={handleAddItem} />

      {/* Search and Filter Controls */}
      <SearchBar onSearch={handleSearch} inputRef={searchInputRef} />
      {/* Container for Filters and Flag Toggle */}
       <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
         <FilterTabs currentFilter={currentFilter} onFilterChange={handleFilterChange} />
         <FlagToggle isChecked={showFlaggedOnly} onChange={setShowFlaggedOnly} /> 
         {/* Add Table Settings Button */}
         <button 
            onClick={() => setIsSettingsModalOpen(true)} 
            style={{ marginLeft: 'auto', padding: '5px 10px' }} 
            title="Configure Table Columns"
         >
             ⚙️ Columns
         </button>
       </div>
      
      {/* Stock List Display */}
      <StockProcessingList 
        items={filteredItems} 
        visibleColumns={visibleColumns} // Pass derived visible columns
        onActionSelected={handleItemAction} 
        onViewDetails={handleViewDetails}
        onColumnReorder={handleColumnDragEnd} // Pass the drag handler
      />
      
      {/* Render Add/Edit Item Form Modal */}
      {isAddItemModalOpen && (
         <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 20 
          }}> {/* Basic overlay */}
          <AddItemForm 
            onSave={handleSaveItem} // Use combined save handler
            onClose={handleCloseFormModal} // Use combined close handler
            initialData={editingItem} // Pass item to edit (null if adding)
          />
        </div>
      )}

      {/* Render Item Details Modal */}
      {selectedItemDetails && (
        <ItemDetailModal 
          item={selectedItemDetails} 
          onClose={handleCloseDetailModal} 
        />
      )}

      {/* New Modals for Issue Handling */}
      {reportingIssueItem && (
        <ReportIssueModal 
            item={reportingIssueItem} // Pass the item
            onSubmit={handleSaveReportIssue} 
            onClose={() => setReportingIssueItem(null)} 
        />
      )}
      {addingUpdateItem && (
        <AddUpdateModal 
            item={addingUpdateItem} // Pass the item context
            onSubmit={handleSaveIssueUpdate} 
            onClose={() => setAddingUpdateItem(null)} 
        />
      )}
       {resolvingIssueItem && (
        <ResolveIssueModal 
            item={resolvingIssueItem} // Pass the item
            onSubmit={handleSaveResolveIssue} 
            onClose={() => setResolvingIssueItem(null)} 
        />
      )}

      {/* Render Table Settings Modal */}
      <TableSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        allColumns={ALL_COLUMNS}
        initialVisibleColumns={visibleColumns} // Pass current derived configs
        onSave={handleSaveColumnSettings} // Handler updates visibleColumnIds state
      />
    </div>
  );
};

export default ToolApp;