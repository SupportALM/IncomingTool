import React, { useState } from 'react';
import { StockItem } from './types';

interface ResolveIssueModalProps {
  item: StockItem; // Pass the item for context
  onSubmit: (outcome: string, note?: string) => void;
  onClose: () => void;
}

const RESOLUTION_OUTCOMES = [
    "Item Accepted / Kept As Is",
    "Item Repaired / Refurbished",
    "Partial Refund Received",
    "Returned to Supplier",
    "Disposed Of",
    "Other" // Allows adding notes for specifics
];

const ResolveIssueModal: React.FC<ResolveIssueModalProps> = ({ item, onSubmit, onClose }) => {
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!outcome) {
      setError('Please select a resolution outcome.');
      return;
    }
    onSubmit(outcome, note.trim() || undefined); // Pass note only if it has content
  };

  // Basic modal styling (reuse styles or define similarly)
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
  const inputGroupStyle: React.CSSProperties = { marginBottom: '15px' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
  const inputStyle: React.CSSProperties = { width: 'calc(100% - 16px)', padding: '8px' }; 
  const errorStyle: React.CSSProperties = { color: 'red', fontSize: '0.8em', marginTop: '4px' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3>Resolve Issue for:</h3>
        <p style={{margin: '5px 0 15px 0', fontStyle: 'italic'}}>{item.productName} - {item.deliveryName}</p>
        
        {/* Display existing issue description for context */}
        {item.issueDescription && (
            <div style={{marginBottom: '15px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px'}}>
                <strong>Initial Issue:</strong> {item.issueDescription}
            </div>
        )}

        <div style={inputGroupStyle}>
            <label htmlFor="resolutionOutcome" style={labelStyle}>
                Resolution Outcome:
            </label>
            <select 
                id="resolutionOutcome"
                value={outcome}
                onChange={(e) => {
                    setOutcome(e.target.value);
                    if (error) setError(''); // Clear error on change
                }}
                style={inputStyle}
            >
                <option value="" disabled>-- Select an Outcome --</option>
                {RESOLUTION_OUTCOMES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
             {error && <div style={errorStyle}>{error}</div>}
        </div>

        <div style={inputGroupStyle}>
            <label htmlFor="resolutionNotes" style={labelStyle}>
                Resolution Notes (Optional):
            </label>
            <textarea 
                id="resolutionNotes"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{...inputStyle, minHeight: '60px'}}
                rows={3}
                placeholder="e.g., Supplier issued refund, repaired screen..."
            />
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={{ padding: '8px 15px', fontWeight: 'bold' }}>
            Save Resolution
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveIssueModal; 