// server/invoiceTemplate.js

module.exports = (data, logoBase64, stampBase64) => {
    const logoSrc = logoBase64 || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    const titleText = data.invoiceType ? data.invoiceType.toUpperCase() : "TAX INVOICE";

return `
<!DOCTYPE html>
<html>
<head>
<style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Calibri', sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
    .container { border: 1px solid #000; width: 100%; box-sizing: border-box; }
    .bold { font-weight: bold; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .uppercase { text-transform: uppercase; }
    .small-text { font-size: 9px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    
    .header-table td { padding: 5px; border-bottom: 1px solid #000; vertical-align: top; }
    .logo-cell { width: 40%; border-right: 1px solid #000; }
    .info-cell { width: 60%; }
    .tax-title { font-size: 20px; text-align: right; font-weight: bold; margin-bottom: 5px; }

    .meta-table td { width: 50%; padding: 5px; border-bottom: 1px solid #000; vertical-align: top; border-right: 1px solid #000; }
    .meta-table td:last-child { border-right: none; }

    .address-table td { width: 50%; padding: 5px; border-bottom: 1px solid #000; vertical-align: top; border-right: 1px solid #000; }
    .address-table td:last-child { border-right: none; }
    .bill-title { font-weight: bold; background-color: #f0f0f0; border-bottom: 1px solid #000; display: block; margin: -5px -5px 5px -5px; padding: 2px 5px; }

    .items-table th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px; background-color: #f0f0f0; font-size: 10px; }
    .items-table td { border-right: 1px solid #000; padding: 5px; vertical-align: top; }
    .filler-row td { height: 200px; border-right: 1px solid #000; }

    .totals-wrapper { display: flex; border-top: 1px solid #000; }
    .notes-section { width: 60%; padding: 10px; border-right: 1px solid #000; }
    .math-section { width: 40%; }
    .math-row { display: flex; justify-content: space-between; padding: 5px; }
    .final-total { border-top: 1px solid #000; border-bottom: 1px solid #000; background-color: #f0f0f0; font-weight: bold; padding: 5px; display: flex; justify-content: space-between; }

    .tax-summary { width: 100%; border-collapse: collapse; border-top: 1px solid #000; font-size: 9px; margin-top: 0; }
    .tax-summary th, .tax-summary td { border: 1px solid #000; padding: 3px; text-align: center; }
    .tax-summary tr:last-child td { border-bottom: none; }
    .tax-summary th { background-color: #f0f0f0; }
</style>
</head>
<body>
    <div class="container">
        <table class="header-table">
            <tr>
                <td class="logo-cell"><img src="${logoSrc}" style="max-height: 80px; max-width: 100%;" /></td>
                <td class="info-cell">
                    <div class="tax-title">${titleText}</div>
                    <div class="bold" style="font-size: 16px;">MEETRA GREEN ENERGY</div>
                    <div>Shop No.7, Raiyaraj Complex, Amar Nagar Road</div>
                    <div>Jetpur Navagadh, Rajkot - 360370 Gujarat</div>
                    <div>GSTIN: 24BLAPH1265E1ZP</div>
                    <div>Contact: +91 7359227562 | Email: meetragreen@gmail.com</div>
                </td>
            </tr>
        </table>

        <table class="meta-table">
            <tr>
                <td>
                    <span class="bold">Invoice No:</span> ${data.invoiceNo}<br>
                    <span class="bold">Date:</span> ${new Date(data.date).toLocaleDateString('en-GB')}<br>
                    <span class="bold">Due Date:</span> ${new Date(data.dueDate).toLocaleDateString('en-GB')}
                </td>
                <td>
                    <span class="bold">Place of Supply:</span> Gujarat (24)<br>
                    <span class="bold">Type of Transport:</span> Road
                </td>
            </tr>
        </table>

        <table class="address-table">
            <tr>
                <td>
                    <div class="bill-title">Bill To</div>
                    <div class="bold uppercase">${data.buyer.name}</div>
                    <div>${data.buyer.address}</div>
                    <div>GSTIN: ${data.buyer.gstin}</div>
                    <div>State: Gujarat (24)</div>
                </td>
                <td>
                    <div class="bill-title">Ship To</div>
                    <div class="bold uppercase">${data.buyer.name}</div>
                    <div>${data.buyer.address}</div>
                    <div>State: Gujarat (24)</div>
                </td>
            </tr>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%; text-align: left;">Item & Description</th>
                    <th style="width: 10%;">HSN/SAC</th>
                    <th style="width: 10%;">Qty</th>
                    <th style="width: 15%;">Rate</th>
                    <th style="width: 15%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map((item, i) => `
                <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>
                        <span class="bold">${item.description}</span><br>
                        ${i === 0 ? '<span class="small-text">Warranty: As per manufacturer policy</span>' : ''}
                    </td>
                    <td class="text-center">${item.hsn}</td>
                    <td class="text-center">${item.quantity} ${item.unit}</td>
                    <td class="text-right">${item.rate}</td>
                    <td class="text-right bold">${item.amount}</td>
                </tr>
                `).join('')}
                <tr class="filler-row"><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
            </tbody>
        </table>

        <div class="totals-wrapper">
            <div class="notes-section">
                <div><span class="bold">Total In Words:</span></div>
                <div style="margin-bottom: 10px; font-style: italic;">${data.amountInWords} Only</div>
                <div class="bold" style="border-bottom: 1px solid #ccc; margin-bottom: 5px;">Bank Details</div>
                <div>Bank: ${data.bankDetails.bankName}</div>
                <div>IFSC: ${data.bankDetails.ifsc}</div>
                <div>A/C No: ${data.bankDetails.accNo}</div>
                <div>Branch: ${data.bankDetails.branch}</div>
                <div class="bold" style="margin-top: 15px; border-bottom: 1px solid #ccc;">Terms & Conditions</div>
                <div class="small-text">1. Goods once sold will not be taken back.<br>2. Interest @18% per annum will be charged on over due amount.<br>3. Subject to Jetpur Jurisdiction only.</div>
            </div>
            <div class="math-section">
                <div class="math-row"><span>Taxable Amount</span><span>${data.taxableValue}</span></div>
                <div class="math-row"><span>CGST</span><span>${data.totalCGST}</span></div>
                <div class="math-row"><span>SGST</span><span>${data.totalSGST}</span></div>
                <div class="math-row"><span>Round Off</span><span>${data.roundOff}</span></div>
                <div class="final-total"><span>Total</span><span>₹ ${data.grandTotal}</span></div>
                <div class="final-total" style="border-top: none;"><span>Balance Due</span><span>₹ ${data.grandTotal}</span></div>
                
                <div class="text-center" style="margin-top: 40px;">
                    ${stampBase64 
                        ? `<img src="${stampBase64}" style="max-height: 120px; display: block; margin: 0 auto;" />` 
                        : `<div style="height: 120px;"></div>`
                    }
                    <div class="bold" style="margin-top: 5px;">Authorized Signature</div>
                </div>
            </div>
        </div>

        <table class="tax-summary">
            <thead>
                <tr>
                    <th rowspan="2">HSN/SAC</th><th rowspan="2">Taxable Value</th>
                    <th colspan="2">CGST</th><th colspan="2">SGST</th><th rowspan="2">Total Tax</th>
                </tr>
                <tr><th>Rate</th><th>Amt</th><th>Rate</th><th>Amt</th></tr>
            </thead>
            <tbody>
                ${data.taxBreakdown.map(tax => `
                <tr>
                    <td>${tax.hsn}</td><td class="text-right">${tax.taxable.toFixed(2)}</td>
                    <td>${tax.rate / 2}%</td><td class="text-right">${tax.cgstAmount.toFixed(2)}</td>
                    <td>${tax.rate / 2}%</td><td class="text-right">${tax.sgstAmount.toFixed(2)}</td>
                    <td class="text-right">${(tax.cgstAmount + tax.sgstAmount).toFixed(2)}</td>
                </tr>`).join('')}
                <tr class="bold">
                    <td class="text-right">Total</td><td class="text-right">${data.taxableValue}</td>
                    <td></td><td class="text-right">${data.totalCGST}</td>
                    <td></td><td class="text-right">${data.totalSGST}</td>
                    <td class="text-right">${(parseFloat(data.totalCGST) + parseFloat(data.totalSGST)).toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`;
};