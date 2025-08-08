# Excel-Site: Data Management Application

## Overview
This project is a web-based application for managing user registration, progress tracking, and upload data. It features a tabbed interface with real-time updates using Socket.io, data persistence via MongoDB, and Excel file import/export capabilities using ExcelJS and XLSX. The frontend is built with HTML, CSS, and JavaScript, while the backend uses Node.js with Express.

The application has three main tabs:
1. **New Registrations-Verifications**: Handles user registration data, including call dates, user IDs, operators, and comments.
2. **Progresses-Repeats**: Tracks progress with details like dates, sources, results, and repeat interactions.
3. **Uploads**: Manages upload records with operator details, types, and validity dates.

Key features:
- Real-time data synchronization across clients using Socket.io.
- Pagination, sorting, filtering, and searching for data tables.
- Excel import and export for bulk data handling.
- Dark mode toggle.
- Persistent selections for bulk operations like deletion and export.

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript, XLSX (for Excel handling), Socket.io-client.
- **Backend**: Node.js, Express, Mongoose (MongoDB ORM), Socket.io.
- **Database**: MongoDB Atlas.
- **Dependencies**: Listed in `package.json` (e.g., exceljs, cors, dotenv).

## Setup and Installation
1. **Clone the repository**:

2. **Install dependencies**:

3. **Configure MongoDB**:
- Update the MongoDB connection URI in `server.js` with your credentials.
- Ensure the database name is `excel-site-db` with collections: `data`, `progress`, `upload`.

4. **Run the application**:
- The server runs on `http://localhost:3000`.
- Open the URL in a browser to access the app.

5. **Development Tools**:
- Use `localtunnel` (dev dependency) for exposing the local server if needed: `lt --port 3000`.

## File Structure
- `index.html`: Main HTML file with tabbed UI.
- `main.js`: Core JavaScript for tab switching, dark mode, event listeners, and Socket.io integration.
- `tab1.js`: Logic for the first tab (registrations-verifications).
- `tab2.js`: Logic for the second tab (progresses-repeats).
- `tab3.js`: Logic for the third tab (uploads).
- `utils.js`: Utility functions for sorting, date/time conversions, and input clearing.
- `server.js`: Backend server with API endpoints and MongoDB models.
- `package.json`: Project metadata and dependencies.
- `README.md`: This documentation.

## Usage
- **Tabs Navigation**: Click on navbar links to switch tabs.
- **Adding Data**: Fill in the form in each tab and click "Save".
- **Editing/Deleting**: Use buttons in table rows; bulk delete selected rows.
- **Filtering**: Open filters popup to apply column-based filters.
- **Searching**: Use search inputs to filter table data.
- **Excel Operations**:
- Upload Excel files to import data.
- Download selected data as Excel.
- **Real-Time Updates**: Changes are broadcasted to all connected clients.