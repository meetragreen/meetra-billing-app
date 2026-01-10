import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    invoiceType: 'Tax Invoice',
    signatureType: 'Physical', 
    customInvoiceNo: '',
    buyer: { name: '', address: '', gstin: '', phone: '' },
    
    items: [
        { description: 'SOLAR ROOFTOP ONGRID POWER GENERATING SYSTEM', hsn: '854143', quantity: '', unit: 'KW', rate: '', taxRate: '5' },
        { description: 'SOLAR INSTALLTION CHARGES', hsn: '995461', quantity: '', unit: 'KW', rate: '', taxRate: '18' }
    ]
  });
  
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/next-invoice-number?type=${formData.invoiceType}`)
      .then(res => setFormData(prev => ({ ...prev, customInvoiceNo: res.data.nextInvoiceNo })))
      .catch(err => console.error(err));
  }, [formData.invoiceType]);

  const handleBuyerChange = (e) => {
    setFormData({ ...formData, buyer: { ...formData.buyer, [e.target.name]: e.target.value } });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', hsn: '', quantity: '', unit: '', rate: '', taxRate: '12' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  // --- NEW: VALIDATION FUNCTION ---
  const validateForm = () => {
    if(!formData.buyer.name) {
        alert("Please enter Buyer Name");
        return false;
    }
    for (let i = 0; i < formData.items.length; i++) {
        // If row has description but missing qty/rate, stop them.
        if (formData.items[i].description && (!formData.items[i].quantity || !formData.items[i].rate)) {
            alert(`Please enter Quantity and Rate for item: ${formData.items[i].description}`);
            return false;
        }
    }
    return true;
  };

  const handleDownload = async () => {
    if (!validateForm()) return; // Stop if invalid

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/create-invoice', formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.customInvoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) { console.error(error); alert('Error generating invoice.'); }
    setLoading(false);
  };

  const handleEmail = async () => {
    if (!validateForm()) return; // Stop if invalid

    const customerEmail = prompt("Enter customer email address:");
    if (!customerEmail) return;
    setEmailLoading(true);
    try {
        await axios.post('http://localhost:5000/api/email-invoice', { ...formData, email: customerEmail });
        alert("✅ Email Sent Successfully!");
    } catch (error) { console.error(error); alert("❌ Error sending email."); }
    setEmailLoading(false);
  };

  const handleShare = async () => {
    if (!validateForm()) return; // Stop if invalid

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/create-invoice', formData, { responseType: 'blob' });
      const file = new File([response.data], `${formData.customInvoiceNo}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Invoice', text: `Invoice ${formData.customInvoiceNo}` });
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${formData.customInvoiceNo}.pdf`);
        document.body.appendChild(link);
        link.click();
        if (formData.buyer.phone) window.open(`https://wa.me/91${formData.buyer.phone}`, '_blank');
      }
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const styles = {
    global: { boxSizing: 'border-box' },
    container: { fontFamily: '"Segoe UI", Roboto, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { color: '#2c3e50', fontSize: '2.5rem', fontWeight: '700', margin: '0' },
    card: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px', marginBottom: '30px', maxWidth: '1000px', margin: '0 auto 30px auto', width: '100%', boxSizing: 'border-box' },
    cardHeader: { borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' },
    cardTitle: { fontSize: '1.25rem', color: '#34495e', fontWeight: '600', margin: 0 },
    gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' },
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase' },
    input: { padding: '12px 15px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    invoiceInput: { padding: '12px 15px', borderRadius: '8px', border: '2px solid #2980b9', fontSize: '1.2rem', fontWeight: 'bold', color: '#2980b9', outline: 'none', width: '100%', boxSizing: 'border-box' },
    typeSelector: { display: 'flex', gap: '20px', marginBottom: '10px' },
    radioLabel: { fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    itemRow: { display: 'grid', gridTemplateColumns: '3fr 1fr 0.7fr 1fr 1fr 50px', gap: '10px', padding: '15px 0', alignItems: 'center', borderBottom: '1px solid #f0f2f5', width: '100%' },
    btn: { padding: '14px 28px', borderRadius: '50px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', color: 'white' },
    btnPrimary: { backgroundColor: '#27ae60' }, btnSecondary: { backgroundColor: '#2980b9' }, btnSuccess: { backgroundColor: '#25D366' },
    btnDanger: { backgroundColor: '#e74c3c', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: 0 }, 
    btnAdd: { backgroundColor: '#f39c12', marginTop: '20px' },
    buttonContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Meetra Green Energy</h1>
        <p>Professional Invoicing Suite</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{fontSize: '24px'}}>⚙️</span><h2 style={styles.cardTitle}>Invoice Setup</h2></div>
        <div style={styles.gridTwo}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Invoice Type</label>
                <div style={styles.typeSelector}>
                    <label style={styles.radioLabel}><input type="radio" name="invoiceType" value="Tax Invoice" checked={formData.invoiceType === 'Tax Invoice'} onChange={(e) => setFormData({...formData, invoiceType: e.target.value})} /> Tax Invoice</label>
                    <label style={styles.radioLabel}><input type="radio" name="invoiceType" value="Proforma Invoice" checked={formData.invoiceType === 'Proforma Invoice'} onChange={(e) => setFormData({...formData, invoiceType: e.target.value})} /> Proforma Invoice</label>
                </div>
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Invoice Number</label>
                <input type="text" style={styles.invoiceInput} value={formData.customInvoiceNo} onChange={(e) => setFormData({...formData, customInvoiceNo: e.target.value})} />
                <small style={{color: '#888'}}>Auto-incrementing based on type. Edit if needed.</small>
            </div>
        </div>
        <div style={{...styles.gridTwo, marginTop: '20px'}}>
             <div style={styles.inputGroup}>
                <label style={styles.label}>Signature Mode</label>
                <div style={styles.typeSelector}>
                    <label style={styles.radioLabel}><input type="radio" name="signatureType" value="Physical" checked={formData.signatureType === 'Physical'} onChange={(e) => setFormData({...formData, signatureType: e.target.value})} /> Physical (Blank)</label>
                    <label style={styles.radioLabel}><input type="radio" name="signatureType" value="Digital" checked={formData.signatureType === 'Digital'} onChange={(e) => setFormData({...formData, signatureType: e.target.value})} /> Digital (Auto-Stamp)</label>
                </div>
            </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{fontSize: '24px'}}>👤</span><h2 style={styles.cardTitle}>Client Information</h2></div>
        <div style={styles.gridTwo}>
          <div style={styles.inputGroup}><label style={styles.label}>Buyer Name</label><input style={styles.input} name="name" onChange={handleBuyerChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Phone Number</label><input style={styles.input} name="phone" onChange={handleBuyerChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>Address</label><input style={styles.input} name="address" onChange={handleBuyerChange} /></div>
          <div style={styles.inputGroup}><label style={styles.label}>GSTIN (Optional)</label><input style={styles.input} name="gstin" onChange={handleBuyerChange} /></div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}><span style={{fontSize: '24px'}}>📦</span><h2 style={styles.cardTitle}>Invoice Items</h2></div>
        <div style={{...styles.itemRow, borderBottom: '2px solid #ddd', paddingBottom: '10px', marginBottom: '10px'}}>
            <span style={styles.label}>Item Name</span><span style={styles.label}>HSN</span><span style={styles.label}>Qty</span><span style={styles.label}>Rate</span><span style={styles.label}>Tax</span><span style={{textAlign:'center', ...styles.label}}>Del</span>
        </div>
        {formData.items.map((item, index) => (
          <div key={index} style={styles.itemRow}>
            <input style={styles.input} placeholder="Item Description" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
            <input style={styles.input} placeholder="HSN" value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
            <input style={styles.input} placeholder="0" type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
            <input style={styles.input} placeholder="₹ 0.00" type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} />
            <select style={styles.input} value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}>
                <option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
            </select>
            <button onClick={() => removeItem(index)} style={styles.btnDanger}>✕</button>
          </div>
        ))}
        <button onClick={addItem} style={{...styles.btn, ...styles.btnAdd}}>+ Add New Item</button>
      </div>

      <div style={styles.buttonContainer}>
        <button onClick={handleDownload} disabled={loading} style={{...styles.btn, ...styles.btnPrimary}}>{loading ? 'Generating...' : `⬇ Download`}</button>
        <button onClick={handleEmail} disabled={emailLoading} style={{...styles.btn, ...styles.btnSecondary}}>{emailLoading ? 'Sending...' : '✉ Send Email'}</button>
        <button onClick={handleShare} style={{...styles.btn, ...styles.btnSuccess}}>📱 Share / WhatsApp</button>
      </div>
    </div>
  );
}

export default App;