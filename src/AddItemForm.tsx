import React, { useState, useEffect } from 'react';
import { StockItem, PurchaseStatus, Destination, ItemStatus } from './types';

// Helper component for the info icon (basic tooltip)
const InfoIcon = ({ text }: { text: string }) => (
  <span title={text} style={{ cursor: 'help', marginLeft: '4px', borderBottom: '1px dotted gray' }}>
    ?
  </span>
);

interface AddItemFormProps {
  onSave: (newItemOrUpdate: Omit<StockItem, 'id' | 'currentStatus' | 'dateDelivered' | 'processorNotes' | 'issueDescription'> & { isFlagged: boolean }) => void;
  onClose: () => void;
  initialData?: StockItem | null;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSave, onClose, initialData }) => {
  const isEditing = !!initialData;

  // Initialize state for each form field
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>(initialData?.purchaseStatus || 'Purchased');
  const [deliveryName, setDeliveryName] = useState(initialData?.deliveryName || '');
  const [productName, setProductName] = useState(initialData?.productName || '');
  const [quantity, setQuantity] = useState<number | ''>(initialData?.quantity || '');
  const [pricePerItem, setPricePerItem] = useState<number | ''>(initialData?.pricePerItem || '');
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber || '');
  const [orderDate, setOrderDate] = useState(() => (initialData?.orderDate || new Date().toISOString().split('T')[0]));
  const [seller, setSeller] = useState(initialData?.seller || '');
  const [isVatRegistered, setIsVatRegistered] = useState<'Yes' | 'No' | 'Unknown'>(initialData?.isVatRegistered || 'Unknown');
  const [destination, setDestination] = useState<Destination>(initialData?.destination || '');
  const [asinSku, setAsinSku] = useState(initialData?.asinSku || '');
  const [acquisitionNotes, setAcquisitionNotes] = useState(initialData?.acquisitionNotes || '');
  const [isFlagged, setIsFlagged] = useState(initialData?.isFlagged || false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate state if initialData changes (needed if modal reuses component instance)
  useEffect(() => {
    if (initialData) {
      setPurchaseStatus(initialData.purchaseStatus || 'Purchased');
      setDeliveryName(initialData.deliveryName || '');
      setProductName(initialData.productName || '');
      setQuantity(initialData.quantity || '');
      setPricePerItem(initialData.pricePerItem || '');
      setOrderNumber(initialData.orderNumber || '');
      setOrderDate(initialData.orderDate || new Date().toISOString().split('T')[0]);
      setSeller(initialData.seller || '');
      setIsVatRegistered(initialData.isVatRegistered || 'Unknown');
      setDestination(initialData.destination || '');
      setAsinSku(initialData.asinSku || '');
      setAcquisitionNotes(initialData.acquisitionNotes || '');
      setIsFlagged(initialData.isFlagged || false);
      setErrors({}); // Clear errors when loading new data
    } else {
      // Reset form if initialData becomes null (e.g., switching from edit to add)
      // Optional: Add logic here to reset all fields if needed
    }
  }, [initialData]); // Re-run effect if initialData changes

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!deliveryName.trim()) newErrors.deliveryName = 'Delivery Name is required.';
    if (!productName.trim()) newErrors.productName = 'Product Name is required.';
    if (quantity === '' || quantity <= 0) newErrors.quantity = 'Quantity must be a positive number.';
    if (pricePerItem === '' || pricePerItem < 0) newErrors.pricePerItem = 'Price must be zero or positive.';
    if (!orderDate) newErrors.orderDate = 'Order Date is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      onSave({
        purchaseStatus,
        deliveryName,
        productName,
        quantity: Number(quantity),
        pricePerItem: Number(pricePerItem),
        orderNumber: orderNumber || undefined,
        orderDate,
        seller: seller || undefined,
        isVatRegistered: isVatRegistered === 'Unknown' ? undefined : isVatRegistered,
        destination: destination || undefined,
        asinSku: asinSku || undefined,
        acquisitionNotes: acquisitionNotes || undefined,
        isFlagged: isFlagged,
      });
    }
  };

  // Basic form styling (can be improved later)
  const formStyle: React.CSSProperties = {
    backgroundColor: 'white',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    maxWidth: '500px', // Limit width
    margin: '20px auto' // Center it for now
  };
  const inputGroupStyle: React.CSSProperties = { marginBottom: '15px' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
  const inputStyle: React.CSSProperties = { width: 'calc(100% - 16px)', padding: '8px' }; // Adjust width for padding
  const errorStyle: React.CSSProperties = { color: 'red', fontSize: '0.8em', marginTop: '4px' };

  return (
    <div style={formStyle}> {/* This div acts as a basic modal container for now */}
      <h3>{isEditing ? 'Edit Stock Item' : 'Add New Stock Item'}</h3>
      <form onSubmit={handleSubmit}>

        {/* Acquisition Details Section (Example) */}
        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="deliveryName">
            Delivery Name
            <InfoIcon text="Group items arriving together with a unique name. Helps find them later. Example: eBay Batch Apr 16" />
          </label>
          <input
            id="deliveryName"
            type="text"
            value={deliveryName}
            onChange={(e) => setDeliveryName(e.target.value)}
            style={inputStyle}
          />
          {errors.deliveryName && <div style={errorStyle}>{errors.deliveryName}</div>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="productName">
            Product Name
            <InfoIcon text="The common name of the item. Example: Blue Widget Model X" />
          </label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={inputStyle}
          />
          {errors.productName && <div style={errorStyle}>{errors.productName}</div>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="quantity">
            Quantity
            <InfoIcon text="How many units of this item are included? Example: 50" />
          </label>
          <input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            min="1"
          />
          {errors.quantity && <div style={errorStyle}>{errors.quantity}</div>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="pricePerItem">
            Price Per Item
            <InfoIcon text="The cost for one single unit. Example: 12.50" />
          </label>
          <input
            id="pricePerItem"
            type="number"
            value={pricePerItem}
            onChange={(e) => setPricePerItem(e.target.value === '' ? '' : Number(e.target.value))}
            style={inputStyle}
            min="0"
            step="0.01"
          />
          {errors.pricePerItem && <div style={errorStyle}>{errors.pricePerItem}</div>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="orderDate">
            Order Date
            <InfoIcon text="The date the item was purchased or the return initiated." />
          </label>
          <input
            id="orderDate"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            style={inputStyle}
          />
          {errors.orderDate && <div style={errorStyle}>{errors.orderDate}</div>}
        </div>
        
        {/* Add other fields similarly... */}
         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="purchaseStatus">
            Purchase Status
            <InfoIcon text="What is the origin of this item?" />
          </label>
          <select 
            id="purchaseStatus" 
            value={purchaseStatus} 
            onChange={(e) => setPurchaseStatus(e.target.value as PurchaseStatus)}
            style={inputStyle}
          >
            <option value="Purchased">Purchased</option>
            <option value="Ordered">Ordered</option>
            <option value="Return Expected">Return Expected</option>
          </select>
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="orderNumber">
            Order Number
            <InfoIcon text="Optional: External reference like eBay order ID or PO number. Example: 12-34567-89012" />
          </label>
          <input
            id="orderNumber"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            style={inputStyle}
          />
        </div>

         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="seller">
            Seller / Source
            <InfoIcon text="Optional: Who did this item come from? Example: ebay_seller_123 or Customer Name (Return)" />
          </label>
          <input
            id="seller"
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            style={inputStyle}
          />
        </div>
        
         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="isVatRegistered">
            Seller VAT Registered?
            <InfoIcon text="Optional: Is the seller registered for VAT?" />
          </label>
          <select 
            id="isVatRegistered" 
            value={isVatRegistered} 
            onChange={(e) => setIsVatRegistered(e.target.value as 'Yes' | 'No' | 'Unknown')}
            style={inputStyle}
          >
            <option value="Unknown">Unknown</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="destination">
            Planned Destination
            <InfoIcon text="Optional: Where is this item intended to go after processing? Example: FBA Prep" />
          </label>
           {/* Basic dropdown + text input for custom destinations */}
           <select 
                value={['FBA Prep', 'Local Stock Shelf A', 'Refurbish Pile', 'Return to Supplier'].includes(destination) ? destination : 'Other'}
                onChange={(e) => {
                    if (e.target.value === 'Other') {
                        setDestination(''); // Clear if switching to Other for custom input
                    } else {
                        setDestination(e.target.value as Destination);
                    }
                }}
                style={{ ...inputStyle, width: 'auto', marginRight: '10px' }}
            >
                <option value="FBA Prep">FBA Prep</option>
                <option value="Local Stock Shelf A">Local Stock Shelf A</option>
                <option value="Refurbish Pile">Refurbish Pile</option>
                <option value="Return to Supplier">Return to Supplier</option>
                <option value="Other">Other (Specify Below)</option>
            </select>
            <input
                type="text"
                placeholder="Specify destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ ...inputStyle, width: 'calc(50% - 26px)' }} // Adjust width
            />
        </div>

         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="asinSku">
            ASIN / SKU
            <InfoIcon text="Optional: Amazon ASIN or internal SKU. Helps link inventory. Example: B0C1EXAMPLE / BLUE-WIDGET-XL" />
          </label>
          <input
            id="asinSku"
            type="text"
            value={asinSku}
            onChange={(e) => setAsinSku(e.target.value)}
            style={inputStyle}
          />
        </div>

         <div style={inputGroupStyle}>
          <label style={labelStyle} htmlFor="acquisitionNotes">
            Acquisition Notes
            <InfoIcon text="Optional: Any specific notes from the purchase, order, or return request. Example: Seller mentioned slight scratch." />
          </label>
          <textarea
            id="acquisitionNotes"
            value={acquisitionNotes}
            onChange={(e) => setAcquisitionNotes(e.target.value)}
            style={{ ...inputStyle, height: '60px' }}
          />
        </div>

        {/* Flag Checkbox */}
        <div style={{ ...inputGroupStyle, display: 'flex', alignItems: 'center' }}>
            <input
                type="checkbox"
                id="isFlagged"
                checked={isFlagged}
                onChange={(e) => setIsFlagged(e.target.checked)}
                style={{ marginRight: '10px' }} 
            />
            <label htmlFor="isFlagged" style={{ fontWeight: 'normal' }}> {/* Remove bold from checkbox label */}
                Flag this item for follow-up
                 <InfoIcon text="Check this box to mark the item with a flag for easy filtering later." />
            </label>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" onClick={onClose} style={{ marginRight: '10px', padding: '8px 15px' }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: '8px 15px', fontWeight: 'bold' }}>
            {isEditing ? 'Update Item' : 'Save Item'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddItemForm; 