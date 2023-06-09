const puppeteer = require('puppeteer');
const fs = require('fs');
const XLSX = require('xlsx');

const scrapeMarinaData = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Go to the directory page
  await page.goto('https://tnkymarinaassociations.com/directory.php');

  // Wait for the data to load
  await page.waitForSelector('.content');

  // Get the data from all pages
  const rowData = [];

  let pageNumber = 1;

  while (pageNumber <= 2) {
    // Get the data from the current page
    const pageData = await page.evaluate(async () => {
      const container = document.querySelector('.content-container.col_2col2575.two.last.containerLevel1');
      const table = container.querySelector('.data-table.mem-directory');
      const tbody = table.querySelector('tbody');

      const rows = Array.from(tbody.querySelectorAll('tr'));
      const rowData = [];

      for (const row of rows) {
        const nameElement = row.querySelector('td:nth-child(1) a');
        const name = nameElement ? nameElement.textContent.trim() : '';

        const addressElement = row.querySelector('td:nth-child(2)');
        const address = addressElement ? addressElement.textContent.trim() : '';

        const cell = row.querySelector('td:nth-child(3) p');
        const phoneElement = cell ? cell.childNodes[0] : null;
        const phone = phoneElement ? phoneElement.textContent.trim() : '';

        const emailLink = cell && cell.querySelector('a[href^="mailto:"]');
        const email = emailLink ? emailLink.getAttribute('href').replace('mailto:', '') : '';

        // Add a delay of 3-5 seconds before retrieving the next item
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

        rowData.push({ name, address, phone, email });
      }

      return rowData;
    });

    rowData.push(...pageData);

    // Increment the page number
    pageNumber++;

    // Generate the URL for the next page
    const nextPageURL = `https://tnkymarinaassociations.com/directory.php?p=${pageNumber}`;

    // Add a delay of 3-5 seconds before proceeding to the next page
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3000) + 2000));

    // Go to the next page
    await page.goto(nextPageURL);
  }

  // Convert data to Excel format
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rowData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Marina Data');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  // Save Excel file
  fs.writeFileSync('test.xlsx', excelBuffer);

  console.log('Data exported to KY & TN Marina Association.xlsx');

  await browser.close();
};

scrapeMarinaData();
