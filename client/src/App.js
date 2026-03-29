/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// --- API CONFIG ---
const API_URL = 'https://meetra-billing-app-rku3.onrender.com'; 

// --- INDIAN NUMBER FORMATTER ---
const formatInr = (num) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);

function App() {
  const [activeTab, setActiveTab] = useState('create'); 

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Meetra Green Energy</h1>
        <p>Professional Invoicing Suite</p>
      </div>

      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('create')} style={activeTab === 'create' ? styles.activeTab : styles.tab}>📄 New Invoice</button>
        <button onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? styles.activeTab : styles.tab}>📊 Dashboard & History</button>
      </div>

      {activeTab === 'create' ? <InvoiceForm /> : <Dashboard />}
    </div>
  );
}

function InvoiceForm() {
    const [formData, setFormData] = useState({
        invoiceType: 'Tax Invoice', signatureType: 'Physical', customInvoiceNo: '',
        buyer: { name: '', address: '', gstin: '', phone: '' },
        items: [{ description: 'SUPPLY OF ROOFTOP SOLAR SYSTEM', hsn: '85414011', quantity: '', unit: 'KW', rate: '', taxRate: '5' }, { description: 'INSTALLTION & COMMISSIONING OF SOLAR', hsn: '995461', quantity: '', unit: 'KW', rate: '', taxRate: '18' }]
    });
    const [loading, setLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/api/next-invoice-number?type=${formData.invoiceType}`)
          .then(res => setFormData(prev => ({ ...prev, customInvoiceNo: res.data.nextInvoiceNo })))
          .catch(err => console.error(err));
    }, [formData.invoiceType]);

    const handleBuyerChange = (e) => setFormData({ ...formData, buyer: { ...formData.buyer, [e.target.name]: e.target.value } });
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };
    const addItem = () => setFormData({ ...formData, items: [...formData.items, { description: '', hsn: '', quantity: '', unit: 'KW', rate: '', taxRate: '12' }] });
    const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });

    const validateForm = () => {
        if(!formData.buyer.name) { alert("Please enter Buyer Name"); return false; }
        return true;
    };

    // --- LIVE CALCULATION LOGIC ---
    const calculateTotals = () => {
        let taxable = 0, cgst = 0, sgst = 0;
        formData.items.forEach(item => {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;
            const amount = qty * rate;
            taxable += amount;
            cgst += amount * ((taxRate / 2) / 100);
            sgst += amount * ((taxRate / 2) / 100);
        });
        const grandTotalRaw = taxable + cgst + sgst;
        const grandTotal = Math.round(grandTotalRaw);
        const roundOff = grandTotal - grandTotalRaw;
        return { taxable, cgst, sgst, roundOff, grandTotal };
    };
    
    const totals = calculateTotals();

    const handleDownload = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/create-invoice`, formData, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${formData.customInvoiceNo}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) { console.error(error); alert('Error generating invoice.'); }
        setLoading(false);
    };

    const handleEmail = async () => {
        if (!validateForm()) return;
        const customerEmail = prompt("Enter customer email address:");
        if (!customerEmail) return;
        setEmailLoading(true);
        try {
            await axios.post(`${API_URL}/api/email-invoice`, { ...formData, email: customerEmail });
            alert("✅ Email Sent Successfully!");
        } catch (error) { console.error(error); alert("❌ Error sending email."); }
        setEmailLoading(false);
    };

    const handleShare = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            await handleDownload();
            if (formData.buyer.phone) {
                const waUrl = `https://web.whatsapp.com/send?phone=91${formData.buyer.phone}&text=Please find attached invoice ${formData.customInvoiceNo}`;
                window.open(waUrl, '_blank');
            } else {
                alert("👉 PDF has been downloaded. Please open WhatsApp manually.");
            }
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    return (
        <div>
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
                    </div>
                </div>
                <div style={{...styles.gridTwo, marginTop: '20px'}}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Signature Mode</label>
                        <div style={styles.typeSelector}>
                            <label style={styles.radioLabel}><input type="radio" name="signatureType" value="Physical" checked={formData.signatureType === 'Physical'} onChange={(e) => setFormData({...formData, signatureType: e.target.value})} /> Physical</label>
                            <label style={styles.radioLabel}><input type="radio" name="signatureType" value="Digital" checked={formData.signatureType === 'Digital'} onChange={(e) => setFormData({...formData, signatureType: e.target.value})} /> Digital</label>
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
                {formData.items.map((item, index) => (
                    <div key={index} style={styles.itemRow}>
                        <input style={styles.input} value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                        <input style={styles.input} value={item.hsn} onChange={(e) => handleItemChange(index, 'hsn', e.target.value)} />
                        <input style={styles.input} placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                        <input style={styles.input} placeholder="Rate" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} />
                        <select style={styles.input} value={item.taxRate} onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}>
                            <option value={5}>5%</option><option value={12}>12%</option><option value={18}>18%</option>
                        </select>
                        <button onClick={() => removeItem(index)} style={styles.btnDanger}>✕</button>
                    </div>
                ))}
                <button onClick={addItem} style={{...styles.btn, ...styles.btnAdd}}>+ Add New Item</button>
            </div>

            {/* --- LIVE SUMMARY BOX --- */}
            <div style={styles.summaryCard}>
                <h3 style={{marginTop: 0, color: '#2c3e50'}}>📊 Live Bill Summary</h3>
                <div style={styles.summaryRow}><span>Taxable Amount:</span> <span>₹ {formatInr(totals.taxable)}</span></div>
                <div style={styles.summaryRow}><span>CGST:</span> <span>₹ {formatInr(totals.cgst)}</span></div>
                <div style={styles.summaryRow}><span>SGST:</span> <span>₹ {formatInr(totals.sgst)}</span></div>
                <div style={styles.summaryRow}><span>Round Off:</span> <span>₹ {totals.roundOff.toFixed(2)}</span></div>
                <div style={styles.summaryTotal}><span>Grand Total:</span> <span>₹ {formatInr(totals.grandTotal)}</span></div>
            </div>

            <div style={styles.buttonContainer}>
                <button onClick={handleDownload} disabled={loading} style={{...styles.btn, ...styles.btnPrimary}}>{loading ? 'Generating...' : `⬇ Download PDF`}</button>
                <button onClick={handleEmail} disabled={emailLoading} style={{...styles.btn, ...styles.btnSecondary}}>{emailLoading ? 'Sending...' : '✉ Send Email'}</button>
                <button onClick={handleShare} style={{...styles.btn, ...styles.btnSuccess}}>📱 Share / WhatsApp</button>
            </div>
        </div>
    );
}

function Dashboard() {
    const [stats, setStats] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(() => {
        axios.get(`${API_URL}/api/dashboard?year=${year}`).then(res => setStats(res.data)).catch(err => console.error(err));
        axios.get(`${API_URL}/api/invoices`).then(res => setInvoices(res.data)).catch(err => console.error(err));
    }, [year]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = (id) => {
        if(!window.confirm("Delete?")) return;
        axios.delete(`${API_URL}/api/invoices/${id}`).then(() => { alert("Deleted!"); fetchData(); });
    };

    return (
        <div style={{padding: '0 10px'}}>
            <div style={styles.card}>
                <div style={styles.cardHeader}><span style={{fontSize: '24px'}}>📈</span><h2 style={styles.cardTitle}>Turnover Analysis ({year})</h2>
                <select style={{...styles.input, width:'auto', marginLeft:'auto'}} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                </select></div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer><BarChart data={stats}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Turnover" fill="#27ae60" /></BarChart></ResponsiveContainer>
                </div>
            </div>
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>📜 History</h2>
                {invoices.map(inv => (
                    <div key={inv._id} style={{borderBottom:'1px solid #eee', padding:'10px', display:'flex', justifyContent:'space-between'}}>
                        <span>{inv.invoiceNo} - {inv.buyer.name}</span>
                        <button onClick={() => handleDelete(inv._id)} style={styles.btnDanger}>Del</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: { fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px 20px' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { color: '#2c3e50', fontSize: '2.5rem', fontWeight: '700' },
    tabContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
    tab: { padding: '10px 20px', background: '#ecf0f1', color: '#333', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '1rem' },
    activeTab: { padding: '10px 20px', background: '#2980b9', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none', fontSize: '1rem' },
    card: { backgroundColor: '#fff', borderRadius: '12px', padding: '30px', marginBottom: '30px', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    cardHeader: { borderBottom: '2px solid #ecf0f1', paddingBottom: '15px', marginBottom: '25px', display:'flex', alignItems:'center' },
    cardTitle: { fontSize: '1.25rem', color: '#34495e', fontWeight: '600', margin: 0, marginLeft: '10px' },
    gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#7f8c8d' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', width: '100%', boxSizing: 'border-box' },
    invoiceInput: { padding: '12px', borderRadius: '8px', border: '2px solid #2980b9', fontWeight: 'bold', color: '#2980b9', width: '100%', fontSize: '1.1rem' },
    typeSelector: { display: 'flex', gap: '20px' },
    radioLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    itemRow: { display: 'grid', gridTemplateColumns: '3fr 1fr 0.7fr 1fr 1fr 50px', gap: '10px', padding: '15px 0', alignItems: 'center', borderBottom: '1px solid #f0f2f5' },
    btn: { padding: '14px 28px', borderRadius: '50px', border: 'none', fontWeight: '600', cursor: 'pointer', color: 'white', fontSize: '1rem' },
    btnPrimary: { backgroundColor: '#27ae60' },
    btnSecondary: { backgroundColor: '#2980b9' },
    btnSuccess: { backgroundColor: '#25D366' },
    btnDanger: { backgroundColor: '#e74c3c', width: '40px', height: '40px', borderRadius: '8px', color: 'white', border: 'none', cursor: 'pointer' },
    btnAdd: { backgroundColor: '#f39c12', marginTop: '20px' },
    summaryCard: { backgroundColor: '#e8f8f5', padding: '20px', borderRadius: '12px', maxWidth: '1000px', margin: '0 auto 30px auto', border: '1px solid #1abc9c' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '1.1rem', color: '#2c3e50', fontWeight: '500' },
    summaryTotal: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '1.4rem', fontWeight: 'bold', borderTop: '2px solid #1abc9c', marginTop: '10px', color: '#16a085' },
    buttonContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', paddingBottom: '50px' }
};

export default App;