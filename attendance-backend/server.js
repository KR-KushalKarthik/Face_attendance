const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const FILE = 'C:/temp/attendance.xlsx';


app.post('/attendance', async (req, res) => {
  try {
    const { name, date, checkIn, checkOut = '' } = req.body;

    console.log('📥 Data received:', req.body);

    const workbook = new ExcelJS.Workbook();
    let sheet;

    if (fs.existsSync(FILE)) {
      await workbook.xlsx.readFile(FILE);
      sheet = workbook.getWorksheet('Attendance');
    }

    if (!sheet) {
      sheet = workbook.addWorksheet('Attendance');
      sheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Check In', key: 'checkIn', width: 15 },
        { header: 'Check Out', key: 'checkOut', width: 15 },
      ];
    }

    sheet.addRow({ name, date, checkIn, checkOut });

    await workbook.xlsx.writeFile(FILE);

    console.log('✅ Excel updated');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error saving attendance:', error);
    res.status(500).json({ success: false });
  }
});

app.listen(3000, () => {
  console.log('✅ Backend running at http://localhost:3000');
});
