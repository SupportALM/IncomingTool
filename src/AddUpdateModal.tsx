import React, { useState } from 'react';
import { StockItem } from './types';

interface AddUpdateModalProps {
  item: StockItem; // Pass the item for context
  onSubmit: (note: string) => void;
  onClose: () => void;
}

const AddUpdateModal: React.FC<AddUpdateModalProps> = ({ item, onSubmit, onClose }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!note.trim()) {
      setError('Please enter an update note.');
      return;
    }
    onSubmit(note);
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
  const textareaStyle: React.CSSProperties = {
      width: 'calc(100% - 16px)', padding: '8px', minHeight: '80px', marginTop: '5px'
  };
  const errorStyle: React.CSSProperties = { color: 'red', fontSize: '0.8em', marginTop: '4px' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3>Add Issue Update for:</h3>
        <p style={{margin: '5px 0 15px 0', fontStyle: 'italic'}}>{item.productName} - {item.deliveryName}</p>
        
        {/* Display existing issue description for context */}
        {item.issueDescription && (
            <div style={{marginBottom: '15px', padding: '10px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px'}}>
                <strong>Initial Issue:</strong> {item.issueDescription}
            </div>
        )}

        <label htmlFor="updateNote" style={{ fontWeight: 'bold' }}>
            Update Note:
        </label>
        <textarea 
            id="updateNote"
            value={note}
            onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(''); // Clear error on type
            }}
            style={textareaStyle}
            rows={4}
            placeholder="e.g., Contacted seller, awaiting response..."
        />
        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} style={{ padding: '8px 15px', fontWeight: 'bold' }}>
            Save Update Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUpdateModal; 