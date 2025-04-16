import React, { useState, useRef, useEffect } from "react";
import { StockItem, ItemStatus } from './types'; // Import the interface
import AddItemForm from './AddItemForm'; // Import the form component
import ItemDetailModal from './ItemDetailModal'; // Import the details modal

// --- Placeholder Components (to be implemented later) ---
const SearchBar = ({ onSearch }: { onSearch: (term: string) => void }) => (
  <input type="text" placeholder="Search by Delivery Name or Product Name..." onChange={e => onSearch(e.target.value)} style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }} />
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

// Function to determine available actions based on status
const getAvailableActions = (status: ItemStatus, isFlagged?: boolean): string[] => { // Added isFlagged
  let actions: string[] = [];
  switch (status) {
    case 'Pending Delivery':
      actions = ['Mark as Delivered', 'Report Issue', 'View Details']; break;
    case 'Delivered':
      actions = ['Archive', 'Report Issue', 'View Details']; break;
    case 'Issue':
      actions = ['Resolve Issue', 'Archive', 'View Details']; break;
    case 'Late': 
      actions = ['Mark as Delivered', 'Report Issue', 'View Details']; break;
    case 'Archived':
      actions = ['View Details']; break;
    default:
      actions = ['View Details']; break;
  }
  // Add flag/unflag action (unless archived)
  if (status !== 'Archived') {
      actions.unshift(isFlagged ? 'Unflag Item' : 'Flag Item'); // Add to beginning
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

// Updated StockProcessingList with correct syntax and late check
const StockProcessingList = ({
  items,
  onActionSelected,
  onViewDetails
}: {
  items: StockItem[];
  onActionSelected: (itemId: string, action: string) => void;
  onViewDetails: (itemId: string) => void;
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  return (
    <div>
      <h4>Stock & Processing List</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Order Date</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Qty</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Product Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Delivery Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
              <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>Actions</th>
            </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((item, index) => {
            const isLate = isItemLate(item); // Check lateness for each item
            return (
              <tr 
                key={item.id} 
                style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', cursor: 'pointer' }}
                onClick={() => onViewDetails(item.id)}
              >
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.orderDate}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {item.isFlagged && <span title="Flagged" style={{ marginRight: '5px' }}>🚩</span>}
                  {item.productName}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.deliveryName}</td>
                {/* Apply status style, checking for lateness */}
                <td 
                  style={{ border: '1px solid #ccc', padding: '8px', ...getStatusStyle(item.currentStatus, isLate, item.isFlagged) }} 
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.currentStatus}
                </td>
                {/* Actions Cell */}
                <td 
                  style={{ border: '1px solid #ccc', padding: '0px', textAlign: 'center', position: 'relative' }} 
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2em', padding: '8px' }}
                    title="Actions"
                    onClick={(e) => { // Need to stop propagation here too
                      e.stopPropagation(); 
                      handleMenuToggle(item.id); 
                    }}
                  >
                    ⋮
                  </button>
                  {openMenuId === item.id && (
                    <ActionMenu
                      itemId={item.id}
                      actions={getAvailableActions(item.currentStatus, item.isFlagged)}
                      onActionSelected={handleAction}
                      onClose={handleCloseMenu}
                    />
                  )}
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={6} style={{ border: '1px solid #ccc', padding: '16px', textAlign: 'center' }}>
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

// --- Mock Data --- 
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
    processorNotes: 'Verified quantity, box slightly damaged.',
    isFlagged: true,
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
  },
];

// --- Main Tool Component ---
const ToolApp = () => {
  const [allItems, setAllItems] = useState<StockItem[]>(MOCK_STOCK_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentFilter, setCurrentFilter] = useState<ItemStatus | 'All'>('Pending Delivery'); // Default filter
  const [selectedItemDetails, setSelectedItemDetails] = useState<StockItem | null>(null); // For View Details Modal
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false); // State for modal visibility
  const [showFlaggedOnly, setShowFlaggedOnly] = useState<boolean>(false); // State for flag toggle

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

  // --- Action Handling Logic ---
  const handleItemAction = (itemId: string, action: string) => {
    console.log(`Action: ${action} on item ${itemId}`);

    setAllItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          let updatedStatus = item.currentStatus;
          let updatedDateDelivered = item.dateDelivered;
          let updatedIssueDescription = item.issueDescription;
          let updatedProcessorNotes = item.processorNotes;
          let updatedFlag = item.isFlagged;
          
          // Determine new state based on action
          switch (action) {
            case 'Mark as Delivered':
              updatedStatus = 'Delivered';
              updatedDateDelivered = new Date().toISOString(); // Record delivery time
              // Maybe add a default processor note?
              // updatedProcessorNotes = item.processorNotes ? item.processorNotes + "; Delivered" : "Delivered";
              break;
            case 'Report Issue':
              updatedStatus = 'Issue';
              // In a real app, you'd likely open a modal here to get the issue description
              updatedIssueDescription = prompt("Please describe the issue:", item.issueDescription || '') || item.issueDescription;
              break;
            case 'Resolve Issue':
              // Could prompt for new status (e.g., Delivered, Archived)
              // For simplicity, let's mark it as Delivered for now
              updatedStatus = 'Delivered'; 
              updatedIssueDescription = undefined; // Clear issue description
              updatedProcessorNotes = item.processorNotes ? item.processorNotes + "; Issue Resolved" : "Issue Resolved";
              break;
            case 'Archive':
              updatedStatus = 'Archived';
              break;
            case 'Flag Item':
              updatedFlag = true;
              break;
            case 'Unflag Item':
              updatedFlag = false;
              break;
            // No case for 'View Details' as it's handled separately
          }
          return { 
              ...item, 
              currentStatus: updatedStatus,
              dateDelivered: updatedDateDelivered,
              issueDescription: updatedIssueDescription,
              processorNotes: updatedProcessorNotes,
              isFlagged: updatedFlag // Update flag status
           }; 
        }
        return item;
      })
    );
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

  const handleCloseAddItemModal = () => {
    setIsAddItemModalOpen(false); // Close the modal
  };

  const handleSaveNewItem = (newItemData: Omit<StockItem, 'id' | 'currentStatus' | 'dateDelivered' | 'processorNotes' | 'issueDescription'> & { isFlagged: boolean }) => {
    const newItem: StockItem = {
      ...newItemData,
      id: Date.now().toString(), // Simple unique ID for now
      currentStatus: 'Pending Delivery', // Default status for new items
      isFlagged: newItemData.isFlagged // Save flag from form
    };
    setAllItems(prevItems => [newItem, ...prevItems]); // Add to the beginning of the list
    handleCloseAddItemModal(); // Close the modal after saving
    console.log('Saved new item:', newItem); // Logging
  };

  return (
    <div style={{ padding: 24 }}> {/* Removed border from original template */}
      <h2>Incoming Stock Tool</h2>
      
      {/* Add Item Button */}
      <AddItemButton onClick={handleAddItem} />

      {/* Search and Filter Controls */}
      <SearchBar onSearch={handleSearch} />
      {/* Container for Filters and Flag Toggle */}
       <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
         <FilterTabs currentFilter={currentFilter} onFilterChange={handleFilterChange} />
         <FlagToggle isChecked={showFlaggedOnly} onChange={setShowFlaggedOnly} /> 
       </div>
      
      {/* Stock List Display */}
      <StockProcessingList 
        items={filteredItems} 
        onActionSelected={handleItemAction} 
        onViewDetails={handleViewDetails}
      />
      
      {/* Render Add Item Form conditionally (basic modal placeholder) */}
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
            onSave={handleSaveNewItem} 
            onClose={handleCloseAddItemModal} 
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
    </div>
  );
};

export default ToolApp; 