const Invoice = require('./invoiceModel');
const invoiceTemplate = require('./invoiceTemplate');
const puppeteer = require('puppeteer');
const { ToWords } = require('to-words');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: { currency: false, ignoreDecimal: false, ignoreZeroCurrency: false }
});

// --- 1. GET NEXT INVOICE NUMBER ---
exports.getNextInvoiceNumber = async (req, res) => {
    try {
        const { type } = req.query; 
        const currentYearShort = new Date().getFullYear().toString().slice(-2);
        
        let prefix = '', regexPattern = '';
        if (type === 'Proforma Invoice') {
            prefix = `PI-${currentYearShort}-`; 
            regexPattern = `^PI-${currentYearShort}-`;
        } else {
            prefix = `MGE-${currentYearShort}`;
            regexPattern = `^MGE-${currentYearShort}`;
        }

        const lastInvoice = await Invoice.findOne({ invoiceNo: { $regex: regexPattern }, invoiceType: type }).sort({ createdAt: -1 });

        let nextNum = '001';
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNo.split('-');
            if (type === 'Proforma Invoice') {
                 if(parts[2]) nextNum = (parseInt(parts[2]) + 1).toString().padStart(3, '0');
            } else {
                 if(parts[1]) nextNum = (parseInt(parts[1].slice(2)) + 1).toString().padStart(3, '0');
            }
        }
        res.status(200).json({ nextInvoiceNo: `${prefix}${nextNum}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching number" });
    }
};

// --- 2. GET ALL INVOICES (HISTORY) ---
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ date: -1 });
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: "Error fetching history", error });
    }
};

// --- 3. DELETE INVOICE ---
exports.deleteInvoice = async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Invoice deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting invoice", error });
    }
};

// --- 4. GET DASHBOARD STATS (GRAPH) ---
exports.getDashboardStats = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        const stats = await Invoice.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    invoiceType: 'Tax Invoice' 
                }
            },
            {
                $group: {
                    _id: { $month: "$date" }, 
                    total: { $sum: { $toDouble: "$grandTotal" } } 
                }
            }
        ]);

        const monthlyData = Array(12).fill(0).map((_, i) => {
            const found = stats.find(s => s._id === (i + 1));
            return {
                name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                Turnover: found ? found.total : 0
            };
        });

        res.status(200).json(monthlyData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error stats", error });
    }
};

// --- PDF GENERATOR ---
const generatePDF = async (invoiceData, signatureType) => {
    const logoPath = path.join(__dirname, 'LOGO.png'); 
    let logoBase64 = '';
    if (fs.existsSync(logoPath)) {
        const bitmap = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${bitmap.toString('base64')}`;
    }

    let stampBase64 = null;
    if (signatureType === 'Digital') {
        const stampPath = path.join(__dirname, 'STAMP.png');
        if (fs.existsSync(stampPath)) {
            const stampBitmap = fs.readFileSync(stampPath);
            stampBase64 = `data:image/png;base64,${stampBitmap.toString('base64')}`;
        }
    }

    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote', '--single-process', '--disable-extensions'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, 
    });

    try {
        const page = await browser.newPage();
        const htmlContent = invoiceTemplate(invoiceData, logoBase64, stampBase64);
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 }); 
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, timeout: 60000 });
        return pdfBuffer;
    } catch (error) {
        console.error("PDF Generation failed:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

const calculateInvoice = async (reqBody) => {
    const { buyer, items, invoiceType, customInvoiceNo } = reqBody;
    let totalTaxable = 0, totalCGST = 0, totalSGST = 0, taxBreakdown = {};

    const calculatedItems = items.map(item => {
        const quantity = parseFloat(item.quantity) || 0; 
        const rate = parseFloat(item.rate) || 0;
        const taxRate = parseFloat(item.taxRate) || 0;
        const amount = quantity * rate;
        const cVal = amount * ((taxRate / 2) / 100);
        const sVal = amount * ((taxRate / 2) / 100);
        totalTaxable += amount;
        totalCGST += cVal;
        totalSGST += sVal;

        if (!taxBreakdown[item.hsn]) taxBreakdown[item.hsn] = { hsn: item.hsn, taxable: 0, rate: taxRate, cgstAmount: 0, sgstAmount: 0 };
        taxBreakdown[item.hsn].taxable += amount;
        taxBreakdown[item.hsn].cgstAmount += cVal;
        taxBreakdown[item.hsn].sgstAmount += sVal;

        return { ...item, quantity, rate, amount: amount.toFixed(2) };
    });

    const grandTotalRaw = totalTaxable + totalCGST + totalSGST;
    const grandTotal = Math.round(grandTotalRaw);
    
    return new Invoice({
        invoiceNo: customInvoiceNo, 
        invoiceType: invoiceType || 'Tax Invoice',
        date: new Date(),
        dueDate: new Date(),
        buyer,
        items: calculatedItems,
        taxableValue: totalTaxable.toFixed(2),
        totalCGST: totalCGST.toFixed(2),
        totalSGST: totalSGST.toFixed(2),
        roundOff: (grandTotal - grandTotalRaw).toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        amountInWords: `INR ${toWords.convert(grandTotal)}`,
        taxBreakdown: Object.values(taxBreakdown)
    });
};

exports.createInvoice = async (req, res) => {
    try {
        const { signatureType } = req.body; 
        const newInvoice = await calculateInvoice(req.body);
        await newInvoice.save(); 
        const pdfBuffer = await generatePDF(newInvoice, signatureType);
        res.set({ 'Content-Type': 'application/pdf', 'Content-Length': pdfBuffer.length });
        res.send(pdfBuffer);
    } catch (error) { console.log("Error:", error); res.status(500).json({ message: 'Error', error }); }
};

// --- EMAIL FIXED FOR RENDER (PORT 465) ---
exports.emailInvoice = async (req, res) => {
    try {
        const { email, signatureType } = req.body;
        const newInvoice = await calculateInvoice(req.body); 
        const pdfBuffer = await generatePDF(newInvoice, signatureType);

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com", 
            port: 465,       // SSL Port for Render
            secure: true,    // Required for 465
            auth: { 
                user: 'meetragreen@gmail.com', 
                pass: 'icsd aiya rvkk rqrn' 
            }
        });

        const mailOptions = {
            from: 'Meetra Green Energy <meetragreen@gmail.com>',
            to: email,
            subject: `${newInvoice.invoiceType} - ${newInvoice.invoiceNo}`,
            text: `Dear ${newInvoice.buyer.name},\n\nPlease find attached invoice.\n\nRegards,\nMeetra Green Energy`,
            attachments: [{ filename: `${newInvoice.invoiceNo}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) { console.log("Email Error:", error); res.status(500).json({ message: 'Error sending email', error }); }
};