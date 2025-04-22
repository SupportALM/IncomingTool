import React from 'react';
import { StockItem, ActivityEvent } from './types';

interface ItemDetailModalProps {
  item: StockItem;
  onClose: () => void;
}

// Helper function to format optional fields
const formatValue = (value: string | number | undefined | null, prefix = '', suffix = '') => {
  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#888' }}>N/A</span>; // Indicate if not available
  }
  return `${prefix}${value}${suffix}`;
};

// Helper function to format an activity event into a readable string
const formatActivityEvent = (event: ActivityEvent): string => {
  const time = new Date(event.timestamp).toLocaleString();
  switch (event.type) {
    case 'CREATED':
      return `${time}: Item Created`;
    case 'EDITED':
      const fields = event.details.changedFields?.join(', ') || 'details';
      return `${time}: Item Edited (${fields} changed)`;
    case 'STATUS_CHANGED':
      return `${time}: Status changed from ${event.details.previousStatus || '?'} to ${event.details.newStatus || '?'}`;
    case 'FLAG_TOGGLED':
      return `${time}: Item ${event.details.isFlagged ? 'Flagged' : 'Unflagged'}`;
    case 'ISSUE_REPORTED':
      return `${time}: Issue Reported: ${event.details.issueDescription || ''}`;
    case 'ISSUE_UPDATE_ADDED':
      return `${time}: Issue Update Added: ${event.details.note || ''}`;
    case 'ISSUE_RESOLVED':
      return `${time}: Issue Resolved (Outcome: ${event.details.resolutionOutcome || 'N/A'}${event.details.note ? ` - Note: ${event.details.note}` : ''}`;
    case 'NOTE_ADDED': // For general notes in future
      return `${time}: Note Added: ${event.details.note || ''}`;
    default:
      return `${time}: Unknown action`;
  }
};

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px 30px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    maxWidth: '600px',
    maxHeight: '80vh', // Prevent modal from being too tall
    overflowY: 'auto', // Allow scrolling if content overflows
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30, // Ensure it's above the AddItemForm if both were open
  };

  const detailRowStyle: React.CSSProperties = {
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    display: 'inline-block',
    minWidth: '150px',
    marginRight: '10px',
  };

  const historySectionStyle: React.CSSProperties = {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #ccc',
  };

  const historyItemStyle: React.CSSProperties = {
    marginBottom: '8px',
    paddingBottom: '8px',
    borderBottom: '1px dashed #eee',
    fontSize: '0.9em',
  };

  return (
    <div style={overlayStyle} onClick={onClose}> {/* Close on overlay click */}
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
        <h3>Item Details: {item.productName} - {item.deliveryName}</h3>

        <div style={detailRowStyle}>
          <span style={labelStyle}>ID:</span> {item.id}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Status:</span> {item.currentStatus}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Product Name:</span> {item.productName}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Delivery Name:</span> {item.deliveryName}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Quantity:</span> {item.quantity}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Price Per Item:</span> {formatValue(item.pricePerItem, '£')}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Order Date:</span> {item.orderDate}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Purchase Status:</span> {formatValue(item.purchaseStatus)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Order Number:</span> {formatValue(item.orderNumber)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Seller / Source:</span> {formatValue(item.seller)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Seller VAT Reg?:</span> {formatValue(item.isVatRegistered)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Planned Destination:</span> {formatValue(item.destination)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>ASIN / SKU:</span> {formatValue(item.asinSku)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Acquisition Notes:</span> {formatValue(item.acquisitionNotes)}
        </div>
        <div style={detailRowStyle}>
          <span style={labelStyle}>Date Delivered:</span> {formatValue(item.dateDelivered ? new Date(item.dateDelivered).toLocaleString() : undefined)}
        </div>
         <div style={detailRowStyle}>
          <span style={labelStyle}>Processor Notes:</span> {formatValue(item.processorNotes)}
        </div>
        <div style={{ ...detailRowStyle, borderBottom: 'none' }}> {/* Remove border on last item */}
          <span style={labelStyle}>Issue Description:</span> {formatValue(item.issueDescription)}
        </div>

        {/* --- History Section --- */}
        {(item.activityLog && item.activityLog.length > 0) && (
          <div style={historySectionStyle}>
            <h4>History / Activity Log</h4>
            {/* Display newest first */}
            {[...(item.activityLog)].reverse().map((event, index) => (
              <div key={`${event.timestamp}-${index}`} style={historyItemStyle}>
                {formatActivityEvent(event)}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '8px 15px', fontWeight: 'bold' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal; 