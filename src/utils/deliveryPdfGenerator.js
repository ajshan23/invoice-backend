import { encode } from "base64-arraybuffer";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a PDF buffer for a delivery note
 * @param {Object} deliveryData - Delivery note data
 * @param {boolean} [saveToFile=false] - Whether to save PDF to file system
 * @returns {Promise<{buffer: Buffer, base64: string}>} PDF buffer and base64 encoded string
 */
export const generateDeliveryPdfBuffer = async (
  deliveryData,
  saveToFile = false
) => {
  const {
    companyName,
    date,
    items,
    deliveryNumber,
    receivedBy,
    signatureImage,
  } = deliveryData;

  // Format date to DD / MM / YYYY
  const formattedDate = new Date(date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");

  // Generate HTML content
  const htmlContent = generateHtmlContent({
    companyName,
    formattedDate,
    items,
    deliveryNumber,
    signatureImage,
    receivedBy,
  });

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000 });
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded", "load"],
    });

    // Wait for fonts and content to load
    await Promise.all([
      page.waitForSelector(".quotation-container", { visible: true }),
      page.evaluate(() => document.fonts.ready),
    ]);

    // Calculate precise height for PDF
    const preciseHeight = await page.evaluate(() => {
      const container = document.querySelector(".quotation-container");
      if (!container) return 0;
      const lastElement = container.lastElementChild;
      const containerTop = container.getBoundingClientRect().top;
      const lastElementBottom = lastElement.getBoundingClientRect().bottom;
      const rawHeight = lastElementBottom - containerTop;
      return Math.ceil(rawHeight) + 10; // Adding 10px buffer
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      width: "786px",
      height: `${preciseHeight}px`,
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      preferCSSPageSize: false,
      scale: 1,
    });

    // Optionally save to file system
    if (saveToFile) {
      const pdfPath = path.join(
        __dirname,
        `../../temp/delivery_${deliveryNumber}.pdf`
      );

      if (!fs.existsSync(path.join(__dirname, "../../temp"))) {
        fs.mkdirSync(path.join(__dirname, "../../temp"));
      }

      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`PDF saved to: ${pdfPath}`);
    }

    return {
      buffer: pdfBuffer,
      base64: encode(pdfBuffer),
    };
  } finally {
    await browser.close();
  }
};

/**
 * Generates HTML content for the delivery note
 * @param {Object} params - Delivery note parameters
 * @returns {string} HTML content
 */
const generateHtmlContent = ({
  companyName,
  formattedDate,
  items,
  deliveryNumber,
  signatureImage,
  receivedBy,
}) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Delivery Note</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap" rel="stylesheet">
    <style>
      html {
        margin: 0;
        padding: 0;
        background-color: #e0e0e0;
        height: auto;
      }
      body {
        font-family: 'Poppins', sans-serif;
        background: #f9f9f9;
        margin: 0;
        padding: 0;
        height: auto;
      }
      .quotation-container {
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        max-width: 786px;
        min-width: 786px;
        margin: auto;
      }
      .quotation-header {
        display: flex;
        align-items: center;
        border-bottom: 2px solid #562777b0;
      }
      .quotation_head {
        padding-left: 7px;
        padding-right: 7px;
        padding-top:3px;
        padding-bottom:3px;
        border-radius: 15px;
        border: 2px solid #562777;
      }
      .divs {
        font-size: 14px;
        line-height: normal;
        margin: 0;
        color: #0055a4;
      }
      .quotation-table tr {
        height: 20px;
      }
      .quotation-header img {
        max-height: 70px;
      }
      .quotation-header h5 {
        font-size: 17px;
        line-height: normal;
        margin: 0;
        color: #562777;
        font-weight: 700;
      }
      .blue_font {
        font-size: 14px;
        color: #0355a4;
        font-weight: 600;
      }
      .quotation-header h5.arabic {
        font-size: 26px;
        font-family: "Cairo", sans-serif;
      }
      .arabic {
        font-family: "Cairo", sans-serif;
      }
      .pt-10 {
        padding-top: 16px;
      }
      .italic {
        font-style: italic;
      }
      .company_name_itelic {
        font-family: "DM Serif Text", serif;
        font-style: italic;
        font-size:18px;
      }
      .compny_name {
        border-bottom: 1px dashed #0355a4;
        width: 80%;
        display: inline-block;
        vertical-align: middle;
        line-height: 1;
      }
      .cmpny_span {
        color: black;
        padding-left: 20px;
        font-weight: semi-bold;
      }
      .logo_flex {
        display: flex;
        align-items: center;
        margin-left: auto;
      }
      .quotation-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 0px;
        border: 2px solid #0355a4;
        font-size: 13px;
        font-weight:400;
      }
      
      /* Updated Table Column Styles */
      .quotation-table th:first-child,
      .quotation-table td:first-child {
        width: 40px !important;
        min-width: 40px !important;
        max-width: 40px !important;
        text-align: center;
        padding: 8px 4px !important;
      }
      
      .quotation-table th:nth-child(2),
      .quotation-table td:nth-child(2) {
        width: auto;
        min-width: 400px;
        padding-left: 10px !important;
      }
      
      .quotation-table th:nth-child(3),
      .quotation-table td:nth-child(3) {
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
        text-align: center;
      }

      .quotation-table th {
        background-color:rgb(230,232,247);
        color: #0355a4;
        border-right: 1px solid #0355a4;
        border-bottom: 2px solid #0355a4;
      }
      .quotation-table td {
        padding: 8px;
        vertical-align: middle;
        border-right: 1px solid #0355a4;
        border-bottom: 1px dotted #0355a480;
      }
      .quotation-table tbody td {
        border-bottom: 1px dotted #0355a480;
      }
      .quotation-table tfoot td {
        border-bottom: 2px solid #0355a4;
        padding: 8px;
        text-align: center;
        border-right: 1px solid #0355a4;
        font-family: "Roboto", sans-serif;
      }
      tfoot {
        border-top: 2px solid #0355a4;
      }
      .bg-blue {
        background-color: #0355a4;
        color: white;
        font-family: "poppins", sans-serif;
        border-bottom: 2px solid white !important;
        text-align: left !important;
        font-size: 14px;
        font-weight: 500;
      }
      .bg-blue.bg-blue-last {
        border-bottom: 2px solid #0355a4 !important;
      }
      .seal_flex {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
      .seal_flex .content {
        width: 70%;
      }
      .seal_flex .content p {
        font-size: 11px;
        color: #1055a5;
        margin: 0;
      }
      .seal_flex .content ul {
        padding-left: 14px;
        font-size: 10px;
        color: #1055a5;
        margin: 0;
      }
      .seal_flex .seal {
        width: 30%;
        text-align: right;
      }
      .seal_flex .seal p {
        font-size: 13px;
        color: #1055a5;
        margin: 0;
      }
      .seal_box {
        border: 2px solid #1055a5;
        text-align: center;
        border-radius: 15px;
        padding: 5px 12px;
        margin-top: 5px;
      }
      .seal_box img {
        width: 100px;
      }
      .bottom_div {
        padding-top: 8px;
        margin: 0;
        width: 104vw;
        position: relative;
        left: 50%;
        transform: translateX(-50%);
      }
      .bottom_div img {
        width: 104vw;
        height: auto;
        display: block;
      }
      .riyal-icon {
        width: 10px !important;
        height: 12px !important;
        vertical-align: middle;
      }
      .cent {
        text-align: center;
        vertical-align: middle;
      }
      .total span {
        border-bottom: 1px dotted #0355a480;
        font-size: 14px;
      }
      .p-15 {
        height: 20px;
      }
      .quotation-table td:nth-child(3) img {
        width: 80px;
        height: auto;
        max-height: 100px;
        display: block;
        margin: 0 auto;
      }
      .received-by {
        width: 50%;
      }
      .received-by h4 {
        border-bottom: 1px solid #0355a4;
        padding-bottom: 2px;
        color: #0355a4;
        margin-bottom: 30px;
        font-size: 14px;
        font-weight: 600;
        font-family: 'Poppins', sans-serif;
      }
      .nameSign {
        font-weight: 600;
      }
      .signature {
        width: 50%;
        text-align: right;
      }
      .signature-content {
        text-align: center;
        margin-top: 10px;
      }
      .signature-text {
        font-size: 14px;
        font-weight: 500;
        margin: 0;
      }
      .signature-seal {
        width: 100px;
      }
      .underline {
        border-bottom: 1px dashed black;
        display: inline-block;
        min-width: 300px;
        padding-bottom: 3px;
      }
      .company-name {
        font-family: "DM Serif Text", serif;
        font-style: italic;
        font-size: 18px;
        border-bottom: 1px dashed #0355a4;
        display: inline-block;
        padding-bottom: 2px;
      }
      .empty-row {
        height: 20px;
      }
        signature-inline{
        height: 40px;
        display: inline-block;
        vertical-align: middle;
        margin-left: 10px;
        }
       
    </style>
  </head>
  <body>
    <div class="quotation-container">
      <div class="quotation-header">
        <div class="quotation_head">
          <div class="arabic divs" style="text-align:center; font-weight: 900;">عرض سعر</div>
          <div class="divs" style="text-align:center; font-weight: 900;">Delivery Note</div>
        </div>
        <div class="logo_flex">
          <img
            src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/isclogo.jpg"
            alt="Company Logo"
          />
        </div>
      </div>
      <p class="blue_font italic">
        <strong>No. </strong>
        <span style="color: red; font-style: normal;letter-spacing:3px; font-weight:500;font-size:14px;">&nbsp; ${deliveryNumber}</span>
      </p>
      <p class=" pt-10" style="margin-bottom: 0">
        <span class="blue_font">Date:</span> <span style="color: black font-weight:400;font-size:14px"><i> ${formattedDate}</i></span>
      </p>
      <div style="display: flex; align-items: center">
        <p class="blue_font">Company Name:</p>
        <p class="compny_name">
          <span class="cmpny_span company_name_itelic"><i>${companyName}</i></span>
        </p>
      </div>
      <table class="quotation-table">
        <thead style="bg-color:rgb(201, 205, 241);">
          <tr>
            <th><span class="arabic">رقم</span><br />No.</th>
            <th>DESCRIPTION <span class="arabic"> الــــوصــــف </span> </th>
            <th><span class="arabic">الکمیة</span> <br />QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map((item, index) => {
              return `
                <tr>
                  <td class="cent">0${index + 1}</td>
                  <td>${item.description}</td>
                  <td class="cent">${item.quantity} pcs</td>
                </tr>
              `;
            })
            .join("")}
          ${(() => {
            const rowsNeeded = Math.max(15 - items.length, 0);
            let extraRows = "";
            for (let i = 0; i < rowsNeeded; i++) {
              extraRows += `
                <tr>
                  <td class="p-15"></td>
                  <td class="p-15"></td>
                  <td class="p-15"></td>
                </tr>
              `;
            }
            return extraRows;
          })()}
        </tbody>
      </table>
      <div class="footer">
        <div class="seal_flex">
        <div class="received-by">
  <h4>Received by</h4>
  <p>
    <span class="nameSign">Name</span>:
    <span class="underline">${receivedBy || ""}</span>
  </p>
  <p>
    <span class="nameSign">Sign</span>:
    <span class="underline">
    &nbsp;&nbsp;
      <img src="${signatureImage || ""}" 
     alt="Signature" 
     width="60" 
     height="45" />
    </span>
  </p>
</div>
          <div class="signature">
            <div class="signature-content">
              <p class="signature-text">Above received items are in good condition</p>
              <p class="signature-text arabic">تم استلام المواد المذكورة أعلاه بحالة جيدة</p>
              <div style="display: flex;flex-direction:row; justify-content: center; align-items: center;gap:10px;">
                <img class="signature-seal" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/seeel.jpg" alt="Company Seal" />
                <img class="signature-seal" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/WhatsApp-Image-2025-04-11-at-20.05.51_18539052.svg" alt="Company Seal" />
              </div>
            </div>
          </div>
        </div>
        <div class="bottom_div">
          <img src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/footer.svg" alt="Footer Image" style="width: 100%; height: auto;">
        </div>
      </div>
    </div>
  </body>
</html>`;
};
