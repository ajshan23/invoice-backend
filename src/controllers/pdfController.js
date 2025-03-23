import { encode } from "base64-arraybuffer";
import puppeteer from "puppeteer";
import Invoice from "../models/invoiceModel.js";

function numberToWords(num) {
  const belowTwenty = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertToWords(n) {
    if (n < 20) return belowTwenty[n];
    if (n < 100)
      return (
        tens[Math.floor(n / 10)] +
        (n % 10 !== 0 ? " " + belowTwenty[n % 10] : "")
      );
    if (n < 1000)
      return (
        belowTwenty[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " " + convertToWords(n % 100) : "")
      );
    if (n < 1000000)
      return (
        convertToWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convertToWords(n % 1000) : "")
      );
    if (n < 1000000000)
      return (
        convertToWords(Math.floor(n / 1000000)) +
        " Million" +
        (n % 1000000 !== 0 ? " " + convertToWords(n % 1000000) : "")
      );
    return (
      convertToWords(Math.floor(n / 1000000000)) +
      " Billion" +
      (n % 1000000000 !== 0 ? " " + convertToWords(n % 1000000000) : "")
    );
  }

  // Remove decimal part
  const integerPart = Math.floor(num);
  return integerPart === 0 ? "Zero" : convertToWords(integerPart);
}

const alpha = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

export const generatePdf = async (req, res) => {
  const { companyName, date, items, invoiceNumber, terms } = req.body;
  const formattedDate = new Date(date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");
  // Calculate total price
  const totalPrice = items.reduce((total, item) => {
    let itemTotal = item.quantity * item.price;
    let subItemsTotal = item.subItems.reduce((subTotal, subItem) => {
      return subTotal + subItem.quantity * subItem.price;
    }, 0);
    return total + itemTotal + subItemsTotal;
  }, 0);

  const totalInword = numberToWords(totalPrice); // Convert totalPrice to words (ignoring decimals)
  const VATAmount = Math.ceil(totalPrice * 0.15);
  const finalAmount = totalPrice + VATAmount;
  const finalAmountInword = numberToWords(finalAmount);

  try {
    // Dynamically generate the HTML content using template literals

    const newInvoice = new Invoice({
      companyName,
      date,
      items,
      invoiceNumber,
      terms,
      totalPrice,
      VATAmount,
      finalAmount,
    });

    await newInvoice.save();
    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Quotation</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet"
      />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap" rel="stylesheet">
      <style>
        /* Your existing CSS styles */
        body {
          font-family: 'Poppins', sans-serif;
          background: #f9f9f9;
        }

        .quotation-container {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          max-width: 786px;
          min-width: 786px;
          margin: auto;
          // padding: 39px;
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
          // font-weight: 800;
        }

        .quotation-table tr {
          height: 20px; /* Fixed height for all rows */
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
          .arabic{
          font-family: "Cairo", sans-serif;
          }

        .pt-10 {
          padding-top: 16px;
        }

        .italic {
          font-style: italic;
        }
        .company_name_itelic{
        
            font-family: "DM Serif Text", serif;
            font-style: italic;
            font-size:18px;

          }

        .compny_name {
          border-bottom: 1px dashed #0355a4;

          width: 80%;
                display: inline-block; /* Add this */
  vertical-align: middle; /* Add this */
  /* Optional: Add line-height if the underline is too far below */
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
          border: 2px solid #0355a4; /* Outer border */
          font-size: 13px;
          font-weight:400;
          
        }

        .quotation-table th{
        // padding-inline: 8px;
        border-right: 1px solid #0355a4; /* Column separator */
          border-bottom: 2px solid #0355a4; /* Thicker bottom border for headers */
          
        }

        .quotation-table td {
          padding: 8px;
          vertical-align: middle;
          border-right: 1px solid #0355a4; /* Column separator */
          border-bottom: 1px dotted #0355a480; /* Keep dotted border for rows */
        }

        .quotation-table th {
          background: transparent;
          color: #0355a4;
        }

        .quotation-table tbody td {
          border-bottom: 1px dotted #0355a480; /* Keep dotted border for rows */
        }

        .quotation-table tfoot td {
          border-bottom: 2px solid #0355a4; /* Thicker border for footer */
          padding: 8px;
          text-align: center;
          border-right: 1px solid #0355a4; /* Column separator */
          font-family: "Roboto", sans-serif;
          // font-weight: 300;
        }

        tfoot {
          border-top: 2px solid #0355a4; /* Thicker border for footer */
        }

        .bg-blue {
          background-color: #0355a4;
          color: white;
          font-family: "poppins", sans-serif;
          border-bottom: 2px solid white !important;
          text-align: left !important; /* Force left alignment */
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
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          border-top: 1px solid rgba(86, 39, 119, 0.6); /* Thin border with reduced opacity */
          padding-top: 8px;
          position: relative;
        }

        .bottom_div div {
            width: 50%;
            position: relative; /* Required for alignment */
        }

        .bottom_div div p {
            font-size: 9px;
            color: black;
            margin: 0;
        }

          /* Add the vertical line */
         .bottom_div::before {
            content: '';
            position: absolute;
            left: 50%;
            top: 8px;
            bottom: 0;
            width: 1px;
            background-color: rgba(86, 39, 119, 0.6); /* Thin line with reduced opacity */
            transform: translateX(-50%);
          }

          /* Align the first div's content to the right */
          .bottom_div div:first-child {
              text-align: left;
              padding-right: 10px; /* Add some spacing */
          }

/* Align the second div's content to the left */
.bottom_div div:last-child {
    text-align: left;
    padding-left: 10px; /* Add some spacing */
}

        /* Centering only the .cent class */
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

        /* New styles for the image column */
        .quotation-table th:nth-child(3),
        .quotation-table td:nth-child(3) {
          width: 80px; /* Reduced width for the image column */
          text-align: center;
        }

        .quotation-table td:nth-child(3) img {
          width: 80px; /* Fixed width for the image */
          height: auto; /* Maintain aspect ratio */
          max-height: 100px; /* Limit maximum height */
          display: block;
          margin: 0 auto; /* Center the image horizontally */
        }
      </style>
    </head>
    <body>
      <div class="quotation-container">
        <div class="quotation-header">
          <div class="quotation_head">
            <div class="arabic divs" style="text-align:center; font-weight: 900;">عرض سعر</div>
            <div class="divs" style="text-align:center; font-weight: 900;">QUOTATION</div>
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
          <span style="color: red; font-style: normal;letter-spacing:3px; font-weight:500;font-size:14px;">&nbsp; ${invoiceNumber}</span>
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
          <thead>
            <tr>
              <th><span class="arabic">رقم</span><br />No.</th>
              <th>DESCRIPTION <span class="arabic"> الــــوصــــف </span> </th>
              <th><span class="arabic">صَوْرة</span><br />IMG</th>
              <th><span class="arabic">الکمیة</span> <br />QUANTITY</th>
              <th><span class="arabic">السعر الوحدة</span><br />UNIT PRICE</th>
              <th><span class="arabic">قیمة الإجمالي</span><br />TOTAL PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item, index) => {
                const rowCount = 1 + item.subItems.length + 2; // Main item + sub-items + 2 extra rows
                return `
                    <tr>
                      <td class="cent">0${index + 1}</td>
                      <td>${item.name}</td>
                      <td rowspan="${rowCount}" style="vertical-align: top;">
                        ${
                          item.image
                            ? `<img src="${item.image}" alt="Item Image" />`
                            : ""
                        }
                      </td>
                      <td class="cent">${item.quantity} pcs</td>
                      <td class="cent">${item.price}</td>
                      <td class="cent">${item.quantity * item.price}</td>
                    </tr>
                    ${item.subItems
                      .map(
                        (subItem, subIndex) => `
                        <tr>
                          <td></td>
                          <td>${alpha[subIndex]}.&nbsp;${subItem.name}</td>
                          <td class="cent">${subItem.quantity} pcs</td>
                          <td class="cent">${subItem.price}</td>
                          <td class="cent">${
                            subItem.quantity * subItem.price
                          }</td>
                        </tr>
                      `
                      )
                      .join("")}
                    <!-- Add two extra rows after each main item -->
                    <tr>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                    </tr>
                    <tr>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                    </tr>
                  `;
              })
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="total">
                <span>${totalInword} Saudi Riyals, before VAT </span>
              </td>
              <td colspan="2" class="bg-blue">Total Before VAT</td>
              <td><span style="font-weight: 400;">${totalPrice}</span></td>
            </tr>
            <tr>
              <td colspan="3" class="total"><span>+15% VAT on total amount</span></td>
              <td colspan="2" class="bg-blue" style="background-color: #0055a4 !important;">15% VAT</td>
              <td><span style="font-weight: 400;">${VATAmount}</span></td>
            </tr>
            <tr>
              <td colspan="3" class="total"><span>${finalAmountInword} SR, (15% VAT Inclusive)</span></td>
              <td colspan="2" class="bg-blue bg-blue-last">Total With VAT(15%)</td>
              <td><span style="font-weight: 400;">${finalAmount}</span></td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">
          <div class="seal_flex">
            <div class="content">
              <p>Terms & Conditions :</p>
              <ul>
              ${terms.map((term) => `<li>${term}</li>`).join("")}
                
              </ul>
              <p style="margin-bottom: 0px; padding-top: 10px">
                We look forward to hear from you soon,
              </p>
              <p style="margin-top: 0px">Thanks & Regards</p>
            </div>
            <div class="seal">
              <p class="" style="margin-top: 0px; text-align: left;font-weight:600;font-size:12px;">
                Stamp & Signature
              </p>
              <div class="seal_box">
                <img
                  src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/seeel.jpg"
                  alt="Company Seal"
                />
              </div>
            </div>
          </div>
          <div class="bottom_div">
              <div>
                  <p>
                      Kingdom of Saudi Arabia - Riyadh - P.O.Box 8199 - Post Code: 13252
                  </p>
                  <p>
                      Tel.: +966 11 2098112 - Mobile: +966 553559551 - C.R.: 1010588769
                  </p>
              </div>
              <div>
                  <p>
                      المـمـلـكـة الـعـربـيـة الـسـعـوديـة - الـــريـــاض - ص.ب ٨١٩٩ -
                      الـــرمـــز الــبــريــدي ١٣٢٥٢
                  </p>
                  <p>هاتف: ٢٠٩٨١١٢ ١١ +٩٦٦ - جوال: ٥٥٣٥٥٩٥٥١ +٩٦٦ - سجل تجاري: ١</p>
              </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set viewport to match your design
    await page.setViewport({ width: 1200, height: 800 });

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Generate PDF with printBackground enabled
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Convert the PDF buffer to a base64 string
    const pdfBase64 = encode(pdfBuffer);

    // Send the response
    res.json({ success: true, pdf: pdfBase64 });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, search = "" } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the number of documents to skip
    const skip = (pageNumber - 1) * limitNumber;

    // Define the search query
    const searchQuery = {
      $or: [
        { companyName: { $regex: search, $options: "i" } }, // Case-insensitive search on companyName
        { invoiceNumber: { $regex: search, $options: "i" } }, // Case-insensitive search on invoiceNumber
      ],
    };

    // Fetch invoices with pagination and search
    const invoices = await Invoice.find(searchQuery)
      .skip(skip)
      .limit(limitNumber)
      .exec();

    // Get the total count of matching invoices (for pagination)
    const totalInvoices = await Invoice.countDocuments(searchQuery);

    // Calculate total pages
    const totalPages = Math.ceil(totalInvoices / limitNumber);

    // Send the response
    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalInvoices,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  console.log("ethy");

  try {
    const { id } = req.params;
    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    if (!deletedInvoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: deletedInvoice });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, date, items, invoiceNumber, terms } = req.body;

    // Validate and convert the incoming date to a Date object
    let parsedDate;
    try {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Please use YYYY-MM-DD format.",
      });
    }

    // Recalculate the total price from items and sub-items
    const totalPrice = items.reduce((total, item) => {
      const itemTotal = item.quantity * item.price;
      const subItemsTotal =
        item.subItems && Array.isArray(item.subItems)
          ? item.subItems.reduce(
              (subTotal, subItem) =>
                subTotal + subItem.quantity * subItem.price,
              0
            )
          : 0;
      return total + itemTotal + subItemsTotal;
    }, 0);

    // Calculate VAT (15% of totalPrice, rounded up)
    const VATAmount = Math.ceil(totalPrice * 0.15);

    // Calculate final amount (total price + VAT)
    const finalAmount = totalPrice + VATAmount;

    // Format the date for display purposes (optional)
    const formattedDate = parsedDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " / ");

    // Update the invoice with the recalculated amounts and provided details
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      {
        companyName,
        date: parsedDate, // Store as Date object
        items,
        invoiceNumber,
        terms,
        totalPrice,
        VATAmount,
        finalAmount,
      },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Optionally add formattedDate to the response if needed for display
    const responseData = {
      ...updatedInvoice.toObject(),
      formattedDate, // Include this if your frontend needs the formatted version
    };

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the invoice by ID
    const invoice = await Invoice.findById(id);

    // If invoice not found, return 404
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Return the invoice
    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generatePdfById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the invoice from the database
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, error: "Invoice not found" });
    }

    // Extract data from the invoice
    const { companyName, date, items, invoiceNumber, terms } = invoice;

    // Format the date for display
    const formattedDate = new Date(date)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " / ");

    // Calculate total price (same as your original generatePdf)
    const totalPrice = items.reduce((total, item) => {
      let itemTotal = item.quantity * item.price;
      let subItemsTotal = item.subItems.reduce((subTotal, subItem) => {
        return subTotal + subItem.quantity * subItem.price;
      }, 0);
      return total + itemTotal + subItemsTotal;
    }, 0);

    const totalInword = numberToWords(totalPrice); // Using your existing numberToWords function
    const VATAmount = Math.ceil(totalPrice * 0.15);
    const finalAmount = totalPrice + VATAmount;
    const finalAmountInword = numberToWords(finalAmount);

    // Generate HTML content (identical to your original generatePdf, just using fetched data)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Quotation</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
            rel="stylesheet"
          />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&display=swap" rel="stylesheet">
          <style>
            /* Your existing CSS styles (unchanged) */
            body {
              font-family: 'Poppins', sans-serif;
              background: #f9f9f9;
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
              font-size: 18px;
            }
            .compny_name {
              border-bottom: 1px dashed #0355a4;
              width: 80%;
              display: inline-block; /* Add this */
  vertical-align: middle; /* Add this */
  /* Optional: Add line-height if the underline is too far below */
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
              font-weight: 400;
            }
            .quotation-table th {
              border-right: 1px solid #0355a4;
              border-bottom: 2px solid #0355a4;
            }
            .quotation-table td {
              padding: 8px;
              vertical-align: middle;
              border-right: 1px solid #0355a4;
              border-bottom: 1px dotted #0355a480;
            }
            .quotation-table th {
              background: transparent;
              color: #0355a4;
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
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
              border-top: 1px solid rgba(86, 39, 119, 0.6);
              padding-top: 8px;
              position: relative;
            }
            .bottom_div div {
              width: 50%;
              position: relative;
            }
            .bottom_div div p {
              font-size: 9px;
              color: black;
              margin: 0;
            }
            .bottom_div::before {
              content: '';
              position: absolute;
              left: 50%;
              top: 8px;
              bottom: 0;
              width: 1px;
              background-color: rgba(86, 39, 119, 0.6);
              transform: translateX(-50%);
            }
            .bottom_div div:first-child {
              text-align: left;
              padding-right: 10px;
            }
            .bottom_div div:last-child {
              text-align: left;
              padding-left: 10px;
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
            .quotation-table th:nth-child(3),
            .quotation-table td:nth-child(3) {
              width: 80px;
              text-align: center;
            }
            .quotation-table td:nth-child(3) img {
              width: 80px;
              height: auto;
              max-height: 100px;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="quotation-container">
            <div class="quotation-header">
              <div class="quotation_head">
                <div class="arabic divs" style="text-align:center; font-weight: 900;">عرض سعر</div>
                <div class="divs" style="text-align:center; font-weight: 900;">QUOTATION</div>
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
              <span style="color: red; font-style: normal;letter-spacing:3px; font-weight:500;font-size:14px;">&nbsp;${invoiceNumber}</span>
            </p>
            <p class="pt-10" style="margin-bottom: 0">
              <span class="blue_font">Date:</span> <span style="color: black font-weight:400;font-size:14px"><i> ${formattedDate}</i></span>
            </p>
            <div style="display: flex; align-items: center">
              <p class="blue_font">Company Name:</p>
              <p class="compny_name">
                <span class="cmpny_span company_name_itelic"><i>${companyName}</i></span>
              </p>
            </div>
            <table class="quotation-table">
              <thead>
                <tr>
                  <th><span class="arabic">رقم</span><br />No.</th>
                  <th>DESCRIPTION <span class="arabic"> الــــوصــــف </span></th>
                  <th><span class="arabic">صَوْرة</span><br />IMG</th>
                  <th><span class="arabic">الکمیة</span> <br />QUANTITY</th>
                  <th><span class="arabic">السعر الوحدة</span><br />UNIT PRICE</th>
                  <th><span class="arabic">قیمة الإجمالي</span><br />TOTAL PRICE</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map((item, index) => {
                    const rowCount = 1 + item.subItems.length + 2; // Main item + sub-items + 2 extra rows
                    return `
                      <tr>
                        <td class="cent">0${index + 1}</td>
                        <td>${item.name}</td>
                        <td rowspan="${rowCount}" style="vertical-align: top;">
                          ${
                            item.image
                              ? `<img src="${item.image}" alt="Item Image" />`
                              : ""
                          }
                        </td>
                        <td class="cent">${item.quantity} pcs</td>
                        <td class="cent">${item.price}</td>
                        <td class="cent">${item.quantity * item.price}</td>
                      </tr>
                      ${item.subItems
                        .map(
                          (subItem, subIndex) => `
                          <tr>
                            <td></td>
                            <td>${String.fromCharCode(97 + subIndex)}. ${
                            subItem.name
                          }</td>
                            <td class="cent">${subItem.quantity} pcs</td>
                            <td class="cent">${subItem.price}</td>
                            <td class="cent">${
                              subItem.quantity * subItem.price
                            }</td>
                          </tr>
                        `
                        )
                        .join("")}
                      <!-- Add two extra rows after each main item -->
                      <tr>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                      </tr>
                      <tr>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                        <td class="p-15"></td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total">
                    <span>${totalInword} Saudi Riyals, before VAT </span>
                  </td>
                  <td colspan="2" class="bg-blue">Total Before VAT</td>
                  <td><span style="font-weight: 400;">${totalPrice}</span></td>
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>+15% VAT on total amount</span></td>
                  <td colspan="2" class="bg-blue" style="background-color: #0055a4 !important;">15% VAT</td>
                  <td><span style="font-weight: 400;">${VATAmount}</span></td>
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>${finalAmountInword} SR, (15% VAT Inclusive)</span></td>
                  <td colspan="2" class="bg-blue bg-blue-last">Total With VAT(15%)</td>
                  <td><span style="font-weight: 400;">${finalAmount}</span></td>
                </tr>
              </tfoot>
            </table>
            <div class="footer">
              <div class="seal_flex">
                <div class="content">
                  <p>Terms & Conditions :</p>
                  <ul>
                    ${terms.map((term) => `<li>${term}</li>`).join("")}
                  </ul>
                  <p style="margin-bottom: 0px; padding-top: 10px">
                    We look forward to hear from you soon,
                  </p>
                  <p style="margin-top: 0px">Thanks & Regards</p>
                </div>
                <div class="seal">
                  <p class="" style="margin-top: 0px; text-align: left;font-weight:600;font-size:12px;">
                    Stamp & Signature
                  </p>
                  <div class="seal_box">
                    <img
                      src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/seeel.jpg"
                      alt="Company Seal"
                    />
                  </div>
                </div>
              </div>
              <div class="bottom_div">
                <div>
                  <p>
                    Kingdom of Saudi Arabia - Riyadh - P.O.Box 8199 - Post Code: 13252
                  </p>
                  <p>
                    Tel.: +966 11 2098112 - Mobile: +966 553559551 - C.R.: 1010588769
                  </p>
                </div>
                <div>
                  <p>
                    المـمـلـكـة الـعـربـيـة الـسـعـوديـة - الـــريـــاض - ص.ب ٨١٩٩ -
                    الـــرمـــز الــبــريــدي ١٣٢٥٢
                  </p>
                  <p>هاتف: ٢٠٩٨١١٢ ١١ +٩٦٦ - جوال: ٥٥٣٥٥٩٥٥١ +٩٦٦ - سجل تجاري: ١</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer (same as your original code)
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set viewport to match your design
    await page.setViewport({ width: 1200, height: 800 });

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Generate PDF with printBackground enabled
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Convert the PDF buffer to a base64 string
    const pdfBase64 = encode(pdfBuffer);

    // Send the response
    res.json({ success: true, pdf: pdfBase64 });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
