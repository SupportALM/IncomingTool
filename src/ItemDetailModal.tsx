import React from 'react';
import { StockItem } from './types';

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