// tab2.js (updated with persistent selections)
let progressData = [];
let progressCurrentPage = 0;
let progressEditIndex = -1;
const progressItemsPerPage = 25;
let progressSortColumn = null;
let progressSortDirection = "asc";
let progressFilterValues = {};
let progressSelectedIndices = new Set();

/**
 * Loads progress data from the server, calculates repeats, and renders the table.
 */
async function loadProgressData() {
  try {
    const response = await fetch("/progress-data");
    progressData = await response.json();
    calculateRepeats();
    createProgressFilters();
    renderProgressTable();
  } catch (error) {
    console.error("Error loading progress data:", error);
  }
}

/**
 * Creates filter dropdowns for progress data.
 */
function createProgressFilters() {
  const columns = ['date', 'hour', 'source', 'operator', 'userId', 'contact', 'result', 'nextCall', 'note', 'repeat', 'operator2', 'contact2', 'result2', 'comment', 'verified', 'category'];
  const filtersContainer = document.getElementById('progressFilters');
  filtersContainer.innerHTML = '';

  let tempFilteredData = progressData.filter((row) => !row.deleted);
  Object.keys(progressFilterValues).forEach(col => {
    if (progressFilterValues[col]) {
      tempFilteredData = tempFilteredData.filter(row => String(row[col]) === progressFilterValues[col]);
    }
  });

  columns.forEach(column => {
    const uniqueValues = [...new Set(tempFilteredData.map(row => String(row[column]) || ''))].sort();
    if (progressFilterValues[column] && !uniqueValues.includes(progressFilterValues[column])) {
      progressFilterValues[column] = '';
    }
    const label = document.createElement('label');
    label.textContent = `${column}: `;
    const select = document.createElement('select');
    select.id = `progress-filter-${column}`;
    select.innerHTML = '<option value="">ყველა</option>' + uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
    select.value = progressFilterValues[column] || '';
    select.addEventListener('change', (e) => {
      progressFilterValues[column] = e.target.value;
      createProgressFilters();
    });
    label.appendChild(select);
    filtersContainer.appendChild(label);
  });
}

/**
 * Opens the filters popup for the progress tab.
 * @param {string} modalId - The ID of the modal.
 */
function openFiltersPopup(modalId) {
  createProgressFilters();
  document.getElementById(modalId).style.display = "block";
}

/**
 * Closes the filters popup.
 * @param {string} modalId - The ID of the modal.
 */
function closeFiltersPopup(modalId) {
  document.getElementById(modalId).style.display = "none";
}

/**
 * Applies filters for the progress tab and re-renders the table.
 * @param {string} modalId - The ID of the modal.
 */
async function applyFiltersTab2(modalId) {
  await loadProgressData();
  progressCurrentPage = 0;
  renderProgressTable();
  closeFiltersPopup(modalId);
}

/**
 * Sorts the progress table by the specified column.
 * @param {string} column - The column to sort by.
 */
function sortProgressTable(column) {
  if (progressSortColumn === column) {
    progressSortDirection = progressSortDirection === "asc" ? "desc" : "asc";
  } else {
    progressSortColumn = column;
    progressSortDirection = "asc";
  }
  renderProgressTable();
}

/**
 * Renders the progress table with filtered, sorted, and paginated data.
 */
function renderProgressTable() {
  const tableBody = document.getElementById("progressTableBody");
  const searchValue = document
    .getElementById("progressSearchInput")
    .value.toLowerCase();
  let filteredData = progressData.filter((row) => !row.deleted);

  Object.keys(progressFilterValues).forEach(column => {
    if (progressFilterValues[column]) {
      filteredData = filteredData.filter(row => String(row[column]) === progressFilterValues[column]);
    }
  });

  if (searchValue) {
    filteredData = filteredData.filter((row) =>
      Object.values(row).some((val) =>
        val.toString().toLowerCase().includes(searchValue)
      )
    );
  }

  filteredData.forEach((row) => {
    row.count = filteredData.filter((r) => r.userId === row.userId).length;
  });

  if (progressSortColumn) {
    filteredData.sort((a, b) => {
      const va = getSortValue(a[progressSortColumn], progressSortColumn);
      const vb = getSortValue(b[progressSortColumn], progressSortColumn);
      if (va < vb) return progressSortDirection === "asc" ? -1 : 1;
      if (va > vb) return progressSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredData.length / progressItemsPerPage);
  const start = progressCurrentPage * progressItemsPerPage;
  const end = start + progressItemsPerPage;
  const pageData = filteredData.slice(start, end);

  tableBody.innerHTML = "";
  pageData.forEach((row) => {
    const originalIndex = progressData.indexOf(row);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="progress-row-select" data-index="${originalIndex}"></td>
      <td>${row.date}</td>
      <td>${row.hour}</td>
      <td>${row.source}</td>
      <td>${row.operator}</td>
      <td>${row.userId}</td>
      <td>${row.contact}</td>
      <td>${row.result}</td>
      <td>${row.nextCall}</td>
      <td>${row.note}</td>
      <td>${row.repeat}</td>
      <td>${row.operator2}</td>
      <td>${row.contact2}</td>
      <td>${row.result2}</td>
      <td>${row.comment}</td>
      <td>${row.verified}</td>
      <td>${row.category}</td>
      <td>${row.count}</td>
      <td>
        <button class="edit-btn" onclick="editProgressRow(${originalIndex})">რედაქტირება</button>
        <button class="delete-btn" onclick="deleteProgressRow(${originalIndex})">წაშლა</button>
      </td>
    `;
    tableBody.appendChild(tr);

    const cb = tr.querySelector(".progress-row-select");
    cb.checked = progressSelectedIndices.has(originalIndex);
    cb.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      if (e.target.checked) {
        progressSelectedIndices.add(idx);
      } else {
        progressSelectedIndices.delete(idx);
      }
    });

    tr.addEventListener("click", (e) => {
      if (!["INPUT", "BUTTON"].includes(e.target.tagName)) {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      }
    });
  });

  // Pagination
  const pagination = document.getElementById("progressPagination");
  pagination.innerHTML = `Page ${progressCurrentPage + 1} of ${totalPages}`;
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = progressCurrentPage === 0;
  prevBtn.onclick = () => {
    if (progressCurrentPage > 0) {
      progressCurrentPage--;
      renderProgressTable();
    }
  };
  pagination.prepend(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = progressCurrentPage >= totalPages - 1;
  nextBtn.onclick = () => {
    if (progressCurrentPage < totalPages - 1) {
      progressCurrentPage++;
      renderProgressTable();
    }
  };
  pagination.appendChild(nextBtn);
}

/**
 * Calculates repeat counts for progress data.
 */
function calculateRepeats() {
  const userCounts = {};
  progressData.forEach((row) => {
    if (!row.deleted) {
      userCounts[row.userId] = (userCounts[row.userId] || 0) + 1;
    }
  });
  progressData.forEach((row) => {
    row.count = userCounts[row.userId] || 0;
  });
}

/**
 * Saves or updates a progress row and refreshes the table.
 */
async function saveProgressRow() {
  const newRow = {
    date: document.getElementById("progressDate").value,
    hour: document.getElementById("progressHour").value,
    source: document.getElementById("progressSource").value,
    operator: document.getElementById("progressOperator").value,
    userId: document.getElementById("progressUserId").value,
    contact: document.getElementById("progressContact").value,
    result: document.getElementById("progressResult").value,
    nextCall: document.getElementById("progressNextCall").value,
    note: document.getElementById("progressNote").value,
    repeat: "", // Calculated later
    operator2: document.getElementById("progressOperator2").value,
    contact2: document.getElementById("progressContact2").value,
    result2: document.getElementById("progressResult2").value,
    comment: document.getElementById("progressComment").value,
    verified: document.getElementById("progressVerified").value,
    category: document.getElementById("progressCategory").value,
    count: 0, // Calculated later
    deleted: false,
  };

  if (progressEditIndex !== -1) {
    progressData[progressEditIndex] = newRow;
    progressEditIndex = -1;
    document.getElementById("progressSaveBtn").textContent = "შენახვა";
  } else {
    progressData.unshift(newRow);
  }

  await saveProgressData();
  await loadProgressData();
  clearProgressInputs();
}

/**
 * Populates form inputs for editing a progress row.
 * @param {number} index - The index of the row.
 */
function editProgressRow(index) {
  const row = progressData[index];
  document.getElementById("progressDate").value = row.date;
  document.getElementById("progressHour").value = row.hour;
  document.getElementById("progressSource").value = row.source;
  document.getElementById("progressOperator").value = row.operator;
  document.getElementById("progressUserId").value = row.userId;
  document.getElementById("progressContact").value = row.contact;
  document.getElementById("progressResult").value = row.result;
  document.getElementById("progressNextCall").value = row.nextCall;
  document.getElementById("progressNote").value = row.note;
  document.getElementById("progressOperator2").value = row.operator2;
  document.getElementById("progressContact2").value = row.contact2;
  document.getElementById("progressResult2").value = row.result2;
  document.getElementById("progressComment").value = row.comment;
  document.getElementById("progressVerified").value = row.verified;
  document.getElementById("progressCategory").value = row.category;
  progressEditIndex = index;
  document.getElementById("progressSaveBtn").textContent = "განახლება";
}

/**
 * Deletes a progress row by marking it as deleted.
 * @param {number} index - The index of the row.
 */
async function deleteProgressRow(index) {
  if (index >= 0 && index < progressData.length) {
    progressData[index].deleted = true;
    progressSelectedIndices.delete(index);
    await saveProgressData();
    await loadProgressData();
  }
}

/**
 * Bulk deletes selected progress rows.
 */
async function progressBulkDeleteRows() {
  const indices = Array.from(progressSelectedIndices);
  if (indices.length === 0) {
    alert("გთხოვთ აირჩიოთ მინიმუმ ერთი ჩანაწერი.");
    return;
  }
  indices.sort((a, b) => b - a);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < progressData.length) {
      progressData[idx].deleted = true;
    }
  });
  await saveProgressData();
  progressSelectedIndices.clear();
  await loadProgressData();
}

/**
 * Saves progress data to the server.
 */
async function saveProgressData() {
  try {
    await fetch("/save-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progressData),
    });
  } catch (error) {
    console.error("Error saving progress data:", error);
  }
}

/**
 * Handles Excel upload for progress tab.
 * @param {Event} event - The file input event.
 */
async function handleProgressExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const workbook = XLSX.read(e.target.result, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (excelData.length < 1) return;

    const headers = excelData[0].map((h) => String(h ?? "").trim());
    const rows = excelData.slice(1);

    const fieldMap = {
      Date: "date",
      Hour: "hour",
      Source: "source",
      თამთა: "operator",
      UserID: "userId",
      Contact: "contact",
      Result: "result",
      "Next Call": "nextCall",
      Note: "note",
      განმეორებითი: "repeat",
      "Operator 2": "operator2",
      "Contact 2": "contact2",
      "Result 2": "result2",
      კომენტარი: "comment",
      Verified: "verified",
      Category: "category",
      Count: "count",
    };

    rows.forEach((row) => {
      if (row.length === 0) return;
      const newRow = { deleted: false };
      headers.forEach((header, idx) => {
        if (header in fieldMap) {
          let value = row[idx] || "";
          const field = fieldMap[header];
          if (field === "date") {
            newRow[field] = excelSerialToDate(value);
          } else if (field === "hour") {
            newRow[field] = excelSerialToTime(value);
          } else {
            newRow[field] = value.toString();
          }
        }
      });
      Object.keys(fieldMap).forEach((key) => {
        if (!(fieldMap[key] in newRow)) {
          newRow[fieldMap[key]] = "";
        }
      });
      progressData.unshift(newRow);
    });

    await saveProgressData();
    await loadProgressData();
  };
  reader.readAsBinaryString(file);
}

/**
 * Downloads selected progress rows as Excel.
 */
function downloadSelectedTab2() {
  const indices = Array.from(progressSelectedIndices);
  if (indices.length === 0) {
    alert("გთხოვთ აირჩიოთ მინიმუმ ერთი ჩანაწერი.");
    return;
  }

  indices.sort((a, b) => a - b); // Sort by original index for consistent order
  const selectedData = indices.map(idx => progressData[idx]);

  const headers = ["Date", "Hour", "Source", "ოპერატორი", "UserID", "Contact", "Result", "Next Call", "Note", "განმეორებითი", "Operator 2", "Contact 2", "Result 2", "კომენტარი", "Verified", "Category", "Count"];
  const ws_data = [headers, ...selectedData.map(row => [row.date, row.hour, row.source, row.operator, row.userId, row.contact, row.result, row.nextCall, row.note, row.repeat, row.operator2, row.contact2, row.result2, row.comment, row.verified, row.category, row.count])];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Progress");
  XLSX.writeFile(wb, "selected_progress.xlsx");
}