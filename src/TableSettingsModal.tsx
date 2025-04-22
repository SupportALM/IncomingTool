import React, { useState, useEffect } from 'react';
import { ColumnConfig } from './ToolApp'; // Import ColumnConfig from ToolApp

interface TableSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: ColumnConfig[];
  initialVisibleColumns: ColumnConfig[];
  onSave: (newVisibleColumnIds: Array<ColumnConfig['id']>) => void;
}

// --- Main Modal Component ---
const TableSettingsModal: React.FC<TableSettingsModalProps> = ({
  isOpen,
  onClose,
  allColumns,
  initialVisibleColumns,
  onSave
}) => {
  // State to track checked status of each column ID
  const [checkedState, setCheckedState] = useState<Record<ColumnConfig['id'], boolean>>(() =>
    // Initialize state using Object.fromEntries for correct typing
    Object.fromEntries(
        allColumns.map(col => [col.id, false])
    ) as Record<ColumnConfig['id'], boolean>
  );

  // Initialize or update checked state when modal opens or initialVisibleColumns change
  useEffect(() => {
    if (isOpen) {
        const visibleIds = new Set(initialVisibleColumns.map(col => col.id));
        // Create the updated state object directly using Object.fromEntries
        const updatedCheckedState = Object.fromEntries(
            allColumns.map(col => [col.id, visibleIds.has(col.id)])
        ) as Record<ColumnConfig['id'], boolean>;
        setCheckedState(updatedCheckedState);
    }
  }, [isOpen, initialVisibleColumns, allColumns]);

  const handleCheckboxChange = (columnId: ColumnConfig['id']) => {
      setCheckedState(prevState => ({
          ...prevState,
          [columnId]: !prevState[columnId]
      }));
  };

  const handleSaveChanges = () => {
    // Filter all column IDs to get only the ones that are checked
    const newVisibleColumnIds = allColumns
        .map(col => col.id)
        .filter(id => checkedState[id]);
    onSave(newVisibleColumnIds); // Pass the array of visible IDs
  };

  if (!isOpen) return null;

  // Basic modal styling
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 60
  };
  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px',
    border: '1px solid #ccc', width: '400px', // Adjusted width
    maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  };
  const listContainerStyle: React.CSSProperties = {
    flexGrow: 1, overflowY: 'auto', // Make the list scrollable
    padding: '10px 0', border: '1px solid #eee', borderRadius: '4px',
    marginBottom: '15px'
  };
  const checkboxItemStyle: React.CSSProperties = {
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center'
  };
  const checkboxLabelStyle: React.CSSProperties = {
      marginLeft: '10px',
      cursor: 'pointer'
  };

  return (
    <div style={overlayStyle} onClick={onClose} >
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} >
        <h3>Configure Table Columns</h3>
        <p>Select the columns you want to display:</p>

        {/* Single list for all columns with checkboxes */}
        <div style={listContainerStyle} >
           {allColumns.map(col => (
              <div key={col.id} style={checkboxItemStyle}>
                  <input
                      type="checkbox"
                      id={`col-checkbox-${col.id}`}
                      checked={checkedState[col.id] || false}
                      onChange={() => handleCheckboxChange(col.id)}
                      disabled={col.id === 'actions'} // Optionally disable toggling for essential columns like 'actions'
                  />
                  <label htmlFor={`col-checkbox-${col.id}`} style={checkboxLabelStyle}>
                      {col.label}
                  </label>
              </div>
           ))}
        </div>

        <div style={{ marginTop: 'auto', textAlign: 'right', borderTop: '1px solid #eee', paddingTop: '15px' }} >
          <button type="button" onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px' }} >
            Cancel
          </button>
          <button type="button" onClick={handleSaveChanges} style={{ padding: '8px 15px', fontWeight: 'bold' }} >
            Save Column Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableSettingsModal; 