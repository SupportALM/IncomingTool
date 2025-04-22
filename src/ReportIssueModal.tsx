import React, { useState } from 'react';
import { StockItem } from './types'; // Import StockItem if needed for context

interface ReportIssueModalProps {
  item: StockItem; // Pass the item for context
  onSubmit: (description: string) => void;
  onClose: () => void;
}

const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ item, onSubmit, onClose }) => {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!description.trim()) {
      setError('Please enter a description of the issue.');
      return;
    }
    onSubmit(description);
  };

  // Basic modal styling (similar to others)
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', zIndex: 50,
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px',
    border: '1px solid #ccc', maxWidth: '500px', width: '90%',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };
  const textareaStyle: React.CSSProperties = {
      width: 'calc(100% - 16px)', padding: '8px', minHeight: '80px', marginTop: '5px'
  };
  const errorStyle: React.CSSProperties = { color: 'red', fontSize: '0.8em', marginTop: '4px' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3>Report Issue for:</h3>
        <p style={{margin: '5px 0 15px 0', fontStyle: 'italic'}}>{item.productName} - {item.deliveryName}</p>
        
        <label htmlFor="issueDescription" style={{ fontWeight: 'bold' }}>
            Describe the Issue:
        </label>
        <textarea 
            id="issueDescription"
            value={description}
            onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(''); // Clear error on type
            }}
            style={textareaStyle}
            rows={4}
        />
        {error && <div style={errorStyle}>{error}</div> }

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={{ padding: '8px 15px', fontWeight: 'bold' }}>
            Save Issue Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIssueModal; 