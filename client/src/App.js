import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

// --- API CONFIG ---
const API_URL = 'https://meetra-billing-app.onrender.com'; 

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
        for (let i = 0; i < formData.items.length; i++) {
            if (formData.items[i].description && (!formData.items[i].quantity || !formData.items[i].rate)) {
                alert(`Please enter Quantity and Rate for item: ${formData.items[i].description}`);
                return false;
            }
        }
        return true;
    };

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
            setTimeout(() => window.location.reload(), 2000);
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
          const response = await axios.post(`${API_URL}/api/create-invoice`, formData, { responseType: 'blob' });
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
            if (formData.buyer.phone) {
                window.open(`https://web.whatsapp.com/send?phone=91${formData.buyer.phone}&text=Please find attached invoice ${formData.customInvoiceNo}`, '_blank');
                alert("⚠️ ON DESKTOP: WhatsApp cannot auto-attach files.\n\n1. The PDF has been downloaded.\n2. WhatsApp Web will open now.\n3. Please drag and drop the PDF into the chat.");
            } else { alert("⚠️ PDF Downloaded.\n\nTo share on WhatsApp Desktop, please open WhatsApp manually and attach the downloaded file."); }
          }
        } catch (error) { console.error(error); alert("Share failed or was canceled."); }
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
                        <small style={{color: '#888'}}>Auto-incrementing. Edit if needed.</small>
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

function Dashboard() {
    const [stats, setStats] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = () => {
        axios.get(`${API_URL}/api/dashboard?year=${year}`).then(res => setStats(res.data)).catch(err => console.error(err));
        axios.get(`${API_URL}/api/invoices`).then(res => setInvoices(res.data)).catch(err => console.error(err));
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, [year]);

    const handleDelete = (id) => {
        if(!window.confirm("Are you sure you want to delete this invoice?")) return;
        axios.delete(`${API_URL}/api/invoices/${id}`)
            .then(() => { alert("Deleted!"); fetchData(); })
            .catch(err => console.error(err));
    };

    return (
        <div style={{padding: '0 10px'}}>
            <div style={styles.card}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <h2 style={styles.cardTitle}>📈 Turnover Analysis ({year})</h2>
                    <select style={styles.input} value={year} onChange={(e) => setYear(e.target.value)}><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option></select>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={stats}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Turnover" fill="#27ae60" /></BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div style={styles.card}>
                <h2 style={{...styles.cardTitle, marginBottom:'20px'}}>📜 Invoice History</h2>
                <div style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '600px'}}>
                        <thead>
                            <tr style={{backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd', textAlign: 'left'}}>
                                <th style={{padding: '12px'}}>Date</th><th style={{padding: '12px'}}>Invoice No</th><th style={{padding: '12px'}}>Customer</th><th style={{padding: '12px'}}>GSTIN</th><th style={{padding: '12px'}}>Tax (GST)</th><th style={{padding: '12px'}}>Total Amount</th><th style={{padding: '12px'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv._id} style={{borderBottom: '1px solid #eee'}}>
                                    <td style={{padding: '12px'}}>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td style={{padding: '12px', fontWeight:'bold', color:'#2980b9'}}>{inv.invoiceNo}</td>
                                    <td style={{padding: '12px'}}>{inv.buyer.name}</td>
                                    <td style={{padding: '12px'}}>{inv.buyer.gstin || '-'}</td>
                                    <td style={{padding: '12px'}}>₹ {(parseFloat(inv.totalCGST) + parseFloat(inv.totalSGST)).toFixed(2)}</td>
                                    <td style={{padding: '12px', fontWeight:'bold'}}>₹ {inv.grandTotal}</td>
                                    <td style={{padding: '12px'}}><button onClick={() => handleDelete(inv._id)} style={{...styles.btnDanger, width:'auto', padding:'5px 10px', fontSize:'0.9rem'}}>Delete</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { fontFamily: '"Segoe UI", Roboto, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box' },
    header: { textAlign: 'center', marginBottom: '40px' },
    title: { color: '#2c3e50', fontSize: '2.5rem', fontWeight: '700', margin: '0' },
    tabContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' },
    tab: { padding: '10px 20px', border: 'none', background: '#ecf0f1', color: '#333', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' },
    activeTab: { padding: '10px 20px', border: 'none', background: '#2980b9', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' },
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
    btnPrimary: { backgroundColor: '#27ae60' }, 
    btnSecondary: { backgroundColor: '#2980b9' }, 
    btnSuccess: { backgroundColor: '#25D366' },
    btnDanger: { backgroundColor: '#e74c3c', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: 0, color: 'white', border: 'none', cursor: 'pointer' }, 
    btnAdd: { backgroundColor: '#f39c12', marginTop: '20px' },
    buttonContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' }
};

export default App;