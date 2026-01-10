const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    hsn: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'KW' },
    rate: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    amount: { type: String } 
});

const invoiceSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true }, // MGE-26001
    invoiceType: { type: String, default: 'Tax Invoice' }, // NEW: 'Tax Invoice' or 'Proforma Invoice'
    date: { type: Date, default: Date.now },
    dueDate: { type: Date, default: Date.now },
    buyer: {
        name: String,
        address: String,
        stateCode: String,
        gstin: String,
        phone: String
    },
    bankDetails: {
        bankName: { type: String, default: 'Bank Of Baroda' },
        ifsc: { type: String, default: 'BARB0VJJETP' },
        accNo: { type: String, default: '80400200003267' },
        branch: { type: String, default: 'STAND CHOWK,JETPUR BRANCH' }
    },
    items: [itemSchema],
    taxableValue: String,
    totalCGST: String,
    totalSGST: String,
    roundOff: String,
    grandTotal: String,
    amountInWords: String,
    taxBreakdown: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);