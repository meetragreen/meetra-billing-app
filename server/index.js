const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const invoiceController = require('./invoiceController');

const app = express();
app.use(express.json());
app.use(cors());

// DATABASE
const MONGO_URI = 'mongodb+srv://meetragreen:meetra123@cluster0.ray2juw.mongodb.net/meetraDB?appName=Cluster0';
mongoose.connect(MONGO_URI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => res.send('Server Running'));

// API Endpoints
app.post('/api/create-invoice', invoiceController.createInvoice);
app.post('/api/email-invoice', invoiceController.emailInvoice);
app.get('/api/next-invoice-number', invoiceController.getNextInvoiceNumber); // <--- NEW ROUTE

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));