import React, { useState , useCallback} from 'react';
import './table.css'

const initialData = {
    rows: [
      {
        id: "electronics",
        label: "Electronics",
        value: 1500,
        children: [
          {
            id: "phones",
            label: "Phones",
            value: 800
          },
          {
            id: "laptops",
            label: "Laptops",
            value: 700
          }
        ]
      },
      {
        id: "furniture",
        label: "Furniture",
        value: 1000,
        children: [
          {
            id: "tables",
            label: "Tables",
            value: 300
          },
          {
            id: "chairs",
            label: "Chairs",
            value: 700
          }
        ]
      }
    ]
  };
  
  const RowInput = ({ rowId, onAllocationPercent, onAllocationValue }) => {
    const [localInput, setLocalInput] = useState('');
  
    const handleInputChange = (e) => {
      setLocalInput(e.target.value);
    };
  
    const handlePercentClick = () => {
      const value = parseFloat(localInput);
      if (!isNaN(value)) {
        onAllocationPercent(rowId, value);
        setLocalInput('');
      }
    };
  
    const handleValueClick = () => {
      const value = parseFloat(localInput);
      if (!isNaN(value) && value >= 0) {
        onAllocationValue(rowId, value);
        setLocalInput('');
      }
    };
  
    return (
      <>
        <td className="input-cell">
          <input
            type="text"
            inputMode="decimal"
            value={localInput}
            onChange={handleInputChange}
            placeholder="Enter value"
          />
        </td>
        <td className="button-cell">
          <button onClick={handlePercentClick}>
            Allocation %
          </button>
        </td>
        <td className="button-cell">
          <button onClick={handleValueClick}>
            Allocation Val
          </button>
        </td>
      </>
    );
  };
  
  function HierarchicalTable() {
    const [data, setData] = useState(initialData);
    const [originalValues] = useState(JSON.parse(JSON.stringify(initialData)));
  
    const calculateSubtotal = (children) => {
      return children.reduce((sum, child) => sum + child.value, 0);
    };
  
    const getOriginalValue = (id, isParent = false) => {
      if (isParent) {
        const parent = originalValues.rows.find(r => r.id === id);
        return parent ? parent.value : 0;
      }
      for (const row of originalValues.rows) {
        if (row.id === id) return row.value;
        if (row.children) {
          const child = row.children.find(c => c.id === id);
          if (child) return child.value;
        }
      }
      return 0;
    };
  
    const calculateVariance = (currentValue, originalValue) => {
      if (originalValue === 0) return 0;
      return ((currentValue - originalValue) / originalValue * 100);
    };
  
    const handleAllocationPercent = useCallback((rowId, value) => {
      setData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        
        for (let i = 0; i < newData.rows.length; i++) {
          const row = newData.rows[i];
          
          if (row.id === rowId) {
            const currentTotal = calculateSubtotal(row.children);
            const targetValue = row.value * (1 + value / 100);
            
            row.children = row.children.map(child => ({
              ...child,
              value: (child.value / currentTotal) * targetValue
            }));
            
            row.value = calculateSubtotal(row.children);
            return newData;
          }
          
          if (row.children) {
            const childIndex = row.children.findIndex(c => c.id === rowId);
            if (childIndex !== -1) {
              const child = row.children[childIndex];
              const updatedValue = child.value * (1 + value / 100);
              
              row.children[childIndex] = {
                ...child,
                value: updatedValue
              };
              
              row.value = calculateSubtotal(row.children);
              return newData;
            }
          }
        }
        
        return newData;
      });
    }, []);
  
    const handleAllocationValue = useCallback((rowId, value) => {
      setData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        
        for (let i = 0; i < newData.rows.length; i++) {
          const row = newData.rows[i];
          
          if (row.id === rowId) {
            const currentTotal = calculateSubtotal(row.children);
            const targetValue = value;
            
            row.children = row.children.map(child => ({
              ...child,
              value: (child.value / currentTotal) * targetValue
            }));
            
            row.value = calculateSubtotal(row.children);
            return newData;
          }
          
          if (row.children) {
            const childIndex = row.children.findIndex(c => c.id === rowId);
            if (childIndex !== -1) {
              const child = row.children[childIndex];
              
              row.children[childIndex] = {
                ...child,
                value: value
              };
              
              row.value = calculateSubtotal(row.children);
              return newData;
            }
          }
        }
        
        return newData;
      });
    }, []);
  
    const calculateGrandTotal = () => {
      return data.rows.reduce((sum, row) => sum + row.value, 0);
    };
  
    const getOriginalGrandTotal = () => {
      return originalValues.rows.reduce((sum, row) => sum + row.value, 0);
    };
  
    const TableRow = ({ row, isChild = false }) => {
      const originalValue = getOriginalValue(row.id, !isChild && row.children);
      const variance = calculateVariance(row.value, originalValue);
  
      return (
        <>
          <tr className={isChild ? 'child-row' : 'parent-row'}>
            <td className="label-cell">
              {isChild && <span className="indent">-- </span>}
              {row.label}
            </td>
            <td className="value-cell">{row.value.toFixed(2)}</td>
            <RowInput 
              rowId={row.id}
              onAllocationPercent={handleAllocationPercent}
              onAllocationValue={handleAllocationValue}
            />
            <td className="variance-cell">
              {variance.toFixed(2)}%
            </td>
          </tr>
          {!isChild && row.children && row.children.map(child => (
            <TableRow key={child.id} row={child} isChild={true} />
          ))}
        </>
      );
    };
  
    const grandTotal = calculateGrandTotal();
    const originalGrandTotal = getOriginalGrandTotal();
    const grandTotalVariance = calculateVariance(grandTotal, originalGrandTotal);
  
    return (
      <div className="container">
        <h1>Hierarchical Sales Table</h1>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th>Input</th>
                <th>Allocation %</th>
                <th>Allocation Val</th>
                <th>Variance %</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <TableRow key={row.id} row={row} />
              ))}
              <tr className="grand-total">
                <td className="label-cell"><strong>Grand Total</strong></td>
                <td className="value-cell"><strong>{grandTotal.toFixed(2)}</strong></td>
                <td className="input-cell"></td>
                <td className="button-cell"></td>
                <td className="button-cell"></td>
                <td className="variance-cell"><strong>{grandTotalVariance.toFixed(2)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

export default HierarchicalTable