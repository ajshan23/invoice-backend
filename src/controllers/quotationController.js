import { encode } from "base64-arraybuffer";
import puppeteer from "puppeteer";
import Quotation from "../models/quotationModel.js";
import User from "../models/userModel.js";

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
  const { companyName, date, items, quotationNumber, terms } = req.body;
  const formattedDate = new Date(date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, " / ");

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found",
    });
  }

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

    const newInvoice = new Quotation({
      companyName,
      date,
      items,
      quotationNumber,
      terms,
      totalPrice,
      VATAmount,
      finalAmount,
      preparedBy: req.user.id,
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
       html {
              margin: 0;
              padding: 0;
              background-color: #e0e0e0; /* For debugging */
              height: auto; /* Will override dynamically */
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
  padding-top: 8px;
  margin: 0;
  width: 104vw; /* Full viewport width */
  position: relative;
  left: 50%;
  transform: translateX(-50%); /* Centers the container */
}

.bottom_div img {
  width: 104vw; /* Full viewport width */
  height: auto;
  display: block;
}
                /* Updated styles for equal column widths */
.quotation-table th:nth-child(4),
.quotation-table td:nth-child(4),
.quotation-table th:nth-child(5),
.quotation-table td:nth-child(5),
.quotation-table th:nth-child(6),
.quotation-table td:nth-child(6) {
  width: 80px; /* Set equal width for Quantity, Unit Price, and Total Price */
  text-align: center;
}
  .riyal-icon {
  width: 10px !important;
  height: 12px !important;
  vertical-align: middle;
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
          <span style="color: red; font-style: normal;letter-spacing:3px; font-weight:500;font-size:14px;">&nbsp; ${quotationNumber}</span>
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
                ${
                  // Generate rows for items and sub-items
                  items
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
                          <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                            item.price
                          }</td>
                          <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                            item.quantity * item.price
                          }</td>
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
                              <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                                subItem.price
                              }</td>
                              <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
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
                    .join("")
                }
                ${
                  // Calculate total rows and add extra rows if needed
                  (() => {
                    // Count total rows: 1 per main item + sub-items + 2 extra rows per main item
                    const totalRows = items.reduce(
                      (sum, item) => sum + 1 + item.subItems.length + 2,
                      0
                    );
                    const rowsNeeded = Math.max(15 - totalRows, 0); // Minimum 15 rows
                    let extraRows = "";
                    for (let i = 0; i < rowsNeeded; i++) {
                      extraRows += `
                        <tr>
                          <td class="p-15"></td>
                          <td class="p-15"></td>
                          <td class="p-15"></td>
                          <td class="p-15"></td>
                          <td class="p-15"></td>
                          <td class="p-15"></td>
                        </tr>
                      `;
                    }
                    return extraRows;
                  })()
                }
              </tbody>
          <tfoot>
                <tr>
                  <td colspan="3" class="total">
                     <span>${totalInword} <img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> , before VAT </span>
                  </td>
                  <td colspan="2" class="bg-blue">Total Before VAT</td>
                   <td style="text-align: center; white-space: nowrap; ">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${totalPrice}</span>
</td>
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>+15% VAT on total amount</span></td>
                  <td colspan="2" class="bg-blue" style="background-color: #0055a4 !important;">15% VAT</td>
                  <td style="text-align: center; white-space: nowrap;">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${VATAmount}</span>
</td>
                 
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>${finalAmountInword} <img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> , (15% VAT Inclusive)</span></td>
                  <td colspan="2" class="bg-blue bg-blue-last">Total With VAT(15%)</td>
              <td style="text-align: center; white-space: nowrap; ">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${finalAmount}</span>
</td>
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
  <img src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/footer.svg" alt="Footer Image" style="width: 100%; height: auto;">
</div>
        </div>
      </div>
    </body>
  </html>
`;

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Set initial viewport
    await page.setViewport({ width: 800, height: 1000 });

    // Load content with waiting
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded", "load"],
    });

    // Wait for everything to render
    await Promise.all([
      page.waitForSelector(".quotation-container", { visible: true }),
      page.evaluate(() => document.fonts.ready),
    ]);

    // Get PRECISE height with 10px compensation
    const preciseHeight = await page.evaluate(() => {
      const container = document.querySelector(".quotation-container");
      if (!container) return 0;

      // Get the actual bottom position of the last element
      const lastElement = container.lastElementChild;
      const containerTop = container.getBoundingClientRect().top;
      const lastElementBottom = lastElement.getBoundingClientRect().bottom;

      // Calculate visible height and apply 10px correction
      const rawHeight = lastElementBottom - containerTop;
      return Math.ceil(rawHeight) - 5; // Deduct the persistent 10px gap
    });

    // Generate PDF with corrected height
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

    await browser.close();

    res.json({
      success: true,
      pdf: encode(pdfBuffer),
      debug: {
        calculatedHeight: preciseHeight,
        compensation: "10px subtracted",
      },
    });
  } catch (error) {
    console.error("Final PDF Error:", error);
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    // Build query with access control
    const query = {
      $or: [
        { companyName: { $regex: search, $options: "i" } },
        { quotationNumber: { $regex: search, $options: "i" } },
      ],
      ...(req.user.role !== "admin" && { preparedBy: req.user._id }), // Changed to preparedBy
    };

    const invoices = await Quotation.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("preparedBy", "name email"); // Only populate preparedBy

    const totalInvoices = await Quotation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalInvoices / limit),
        totalInvoices,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const deleteInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization - admin or creator (using preparedBy)
    if (
      req.user.role !== "admin" &&
      quotation.preparedBy.toString() !== req.user._id.toString() // Changed to preparedBy
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this quotation",
      });
    }

    await quotation.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error("Error deleting Quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, date, items, quotationNumber, terms } = req.body;

    // Find the quotation
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check authorization - admin or creator (using preparedBy)
    if (
      req.user.role !== "admin" &&
      quotation.preparedBy.toString() !== req.user._id.toString() // Changed to preparedBy
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this quotation",
      });
    }

    // Recalculate prices
    const totalPrice = items.reduce((total, item) => {
      const itemTotal = item.quantity * item.price;
      const subItemsTotal = item.subItems.reduce(
        (subTotal, subItem) => subTotal + subItem.quantity * subItem.price,
        0
      );
      return total + itemTotal + subItemsTotal;
    }, 0);

    const VATAmount = Math.ceil(totalPrice * 0.15);
    const finalAmount = totalPrice + VATAmount;

    // Update the quotation
    const updatedQuotation = await Quotation.findByIdAndUpdate(
      id,
      {
        companyName,
        date,
        items,
        quotationNumber,
        terms,
        totalPrice,
        VATAmount,
        finalAmount,
        preparedBy: req.user._id, // Keep the original preparedBy
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedQuotation });
  } catch (error) {
    console.error("Error updating Quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  console.log("Fetching Quotation by ID:", req.params.id);
  
  try {
    const quotation = await Quotation.findById(req.params.id).populate(
      "preparedBy",
      "name email"
    ); // Only populate preparedBy

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check access - admin or creator (using preparedBy)
    if (
      req.user.role !== "admin" &&
      quotation.preparedBy._id.toString() !== req.user._id.toString() // Changed to preparedBy
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to access this quotation",
      });
    }
    console.log(quotation);
    

    res.status(200).json({ success: true, data: quotation });
  } catch (error) {
    console.error("Error fetching Quotation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generatePdfById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the Quotation from the database
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res
        .status(404)
        .json({ success: false, error: "Quotation not found" });
    }

    // Extract data from the Quotation
    const { companyName, date, items, quotationNumber, terms } = quotation;

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
          html {
              margin: 0;
              padding: 0;
              background-color: #e0e0e0; /* For debugging */
              height: auto; /* Will override dynamically */
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
  padding-top: 8px;
  margin: 0;
  width: 104vw; /* Full viewport width */
  position: relative;
  left: 50%;
  transform: translateX(-50%); /* Centers the container */
}

.bottom_div img {
  width: 104vw; /* Full viewport width */
  height: auto;
  display: block;
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
              /* Updated styles for equal column widths */
.quotation-table th:nth-child(4),
.quotation-table td:nth-child(4),
.quotation-table th:nth-child(5),
.quotation-table td:nth-child(5),
.quotation-table th:nth-child(6),
.quotation-table td:nth-child(6) {
  width: 80px; /* Set equal width for Quantity, Unit Price, and Total Price */
  text-align: center;
}
.riyal-icon {
  width: 10px !important;
  height: 12px !important;
  vertical-align: middle;
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
              <span style="color: red; font-style: normal;letter-spacing:3px; font-weight:500;font-size:14px;">&nbsp;${quotationNumber}</span>
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
            ${
              // Generate rows for items and sub-items
              items
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
                      <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                        item.price
                      }</td>
                      <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                        item.quantity * item.price
                      }</td>
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
                            <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
                              subItem.price
                            }</td>
                            <td class="cent"><img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> ${
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
                .join("")
            }
            ${
              // Calculate total rows and add extra rows if needed
              (() => {
                // Count total rows: 1 per main item + sub-items + 2 extra rows per main item
                const totalRows = items.reduce(
                  (sum, item) => sum + 1 + item.subItems.length + 2,
                  0
                );
                const rowsNeeded = Math.max(15 - totalRows, 0); // Minimum 15 rows
                let extraRows = "";
                for (let i = 0; i < rowsNeeded; i++) {
                  extraRows += `
                    <tr>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                      <td class="p-15"></td>
                    </tr>
                  `;
                }
                return extraRows;
              })()
            }
          </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="total">
                     <span>${totalInword} <img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> , before VAT </span>
                  </td>
                  <td colspan="2" class="bg-blue">Total Before VAT</td>
                   <td style="text-align: center; white-space: nowrap; ">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${totalPrice}</span>
</td>
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>+15% VAT on total amount</span></td>
                  <td colspan="2" class="bg-blue" style="background-color: #0055a4 !important;">15% VAT</td>
                  <td style="text-align: center; white-space: nowrap;">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${VATAmount}</span>
</td>
                 
                </tr>
                <tr>
                  <td colspan="3" class="total"><span>${finalAmountInword} <img width="10px" height="12px" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" /> , (15% VAT Inclusive)</span></td>
                  <td colspan="2" class="bg-blue bg-blue-last">Total With VAT(15%)</td>
              <td style="text-align: center; white-space: nowrap; ">
  <img class="riyal-icon" src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/riyal_icon.png" style="display: inline; vertical-align: middle; " />
  <span style="font-weight: 400; margin-left: 3px; display: inline; vertical-align: middle; ">${finalAmount}</span>
</td>
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
  <img src="https://krishnadas-test-1.s3.ap-south-1.amazonaws.com/footer.svg" alt="Footer Image" style="width: 100%; height: auto;">
</div>
          </div>
          
        </body>
      </html>
    `;
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    // Set initial viewport
    await page.setViewport({ width: 800, height: 1000 });

    // Load content with waiting
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded", "load"],
    });

    // Wait for everything to render
    await Promise.all([
      page.waitForSelector(".quotation-container", { visible: true }),
      page.evaluate(() => document.fonts.ready),
    ]);

    // Get PRECISE height with 10px compensation
    const preciseHeight = await page.evaluate(() => {
      const container = document.querySelector(".quotation-container");
      if (!container) return 0;

      // Get the actual bottom position of the last element
      const lastElement = container.lastElementChild;
      const containerTop = container.getBoundingClientRect().top;
      const lastElementBottom = lastElement.getBoundingClientRect().bottom;

      // Calculate visible height and apply 10px correction
      const rawHeight = lastElementBottom - containerTop;
      return Math.ceil(rawHeight) - 5; // Deduct the persistent 10px gap
    });

    // Generate PDF with corrected height
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

    await browser.close();

    res.json({
      success: true,
      pdf: encode(pdfBuffer),
      debug: {
        calculatedHeight: preciseHeight,
        compensation: "10px subtracted",
      },
    });
  } catch (error) {
    console.error("Final PDF Error:", error);
    res.status(500).json({
      success: false,
      error: "PDF generation failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
