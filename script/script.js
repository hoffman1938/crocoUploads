function openTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");

  const links = document.querySelectorAll(".navbar a");
  links.forEach((link) => link.classList.remove("active"));
  const activeLink = document.querySelector(`.navbar a[href="#${tabId}"]`);
  if (activeLink) activeLink.classList.add("active");
}

let data = [];
let currentPage = 0;
let editIndex = -1;
const itemsPerPage = 25;
let sortColumn = null;
let sortDirection = "asc";

async function loadData() {
  try {
    const response = await fetch("/data");
    data = await response.json();
    renderTable();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function sortTable(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortColumn = column;
    sortDirection = "asc";
  }
  renderTable();
}

function getSortValue(val, column) {
  if (["callDate", "regDate"].includes(column)) {
    return new Date(val).getTime() || 0;
  } else if (!isNaN(parseFloat(val))) {
    return parseFloat(val);
  } else {
    return val.toString().toLowerCase();
  }
}

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();
  let filteredData = data.filter((row) => !row.deleted);
  if (searchValue) {
    filteredData = filteredData.filter((row) =>
      Object.values(row).some((val) =>
        val.toString().toLowerCase().includes(searchValue)
      )
    );
  }

  if (sortColumn) {
    filteredData.sort((a, b) => {
      const va = getSortValue(a[sortColumn], sortColumn);
      const vb = getSortValue(b[sortColumn], sortColumn);
      if (va < vb) return sortDirection === "asc" ? -1 : 1;
      if (va > vb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const start = currentPage * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  tableBody.innerHTML = "";
  pageData.forEach((row) => {
    const originalIndex = data.indexOf(row);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-select" data-index="${originalIndex}"></td>
      <td>${row.callDate}</td>
      <td>${row.userId}</td>
      <td>${row.regDate}</td>
      <td>${row.operator}</td>
      <td>${row.contact}</td>
      <td>${row.comment}</td>
      <td>${row.otherNote}</td>
      <td>
        <button class="edit-btn" onclick="editRow(${originalIndex})">რედაქტირება</button>
        <button class="delete-btn" onclick="deleteRow(${originalIndex})">წაშლა</button>
      </td>
    `;
    tableBody.appendChild(tr);

    tr.addEventListener("click", (e) => {
      if (!["INPUT", "BUTTON"].includes(e.target.tagName)) {
        const cb = tr.querySelector(".row-select");
        cb.checked = !cb.checked;
      }
    });
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "წინა";
  prevBtn.disabled = currentPage === 0;
  prevBtn.onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      renderTable();
    }
  };
  pagination.appendChild(prevBtn);

  const pageInfo = document.createElement("span");
  pageInfo.id = "pageInfo";
  pageInfo.textContent = `გვერდი ${currentPage + 1} / ${totalPages}`;
  pagination.appendChild(pageInfo);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "შემდეგი";
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.onclick = () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      renderTable();
    }
  };
  pagination.appendChild(nextBtn);
}

async function saveRow() {
  const today = new Date().toISOString().split("T")[0];
  const callDate = document.getElementById("callDate").value;
  if (new Date(callDate) < new Date(today)) {
    alert("დარეკვის თარიღი უნდა იყოს დღევანდელი ან მომავალი თარიღი.");
    return;
  }

  const updatedRow = {
    callDate: callDate,
    userId: document.getElementById("userId").value,
    regDate: document.getElementById("regDate").value,
    operator: document.getElementById("operator").value,
    contact: document.getElementById("contact").value,
    comment: document.getElementById("comment").value,
    otherNote: document.getElementById("otherNote").value,
    deleted: false,
  };

  if (editIndex !== -1) {
    data[editIndex] = updatedRow;
    editIndex = -1;
    document.getElementById("saveBtn").textContent = "შენახვა";
  } else {
    data.unshift(updatedRow);
  }

  await saveData();
  currentPage = 0;
  renderTable();
  clearInputs();
}

async function deleteRow(index) {
  if (index >= 0 && index < data.length) {
    data[index].deleted = true;
    await saveData();
    renderTable();
  }
}

async function bulkDeleteRows() {
  const selected = document.querySelectorAll(".row-select:checked");
  const indices = Array.from(selected).map((cb) => parseInt(cb.dataset.index));
  indices.sort((a, b) => b - a);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < data.length) {
      data[idx].deleted = true;
    }
  });
  await saveData();
  renderTable();
}

function editRow(index) {
  const row = data[index];
  document.getElementById("callDate").value = row.callDate;
  document.getElementById("userId").value = row.userId;
  document.getElementById("regDate").value = row.regDate;
  document.getElementById("operator").value = row.operator;
  document.getElementById("contact").value = row.contact;
  document.getElementById("comment").value = row.comment;
  document.getElementById("otherNote").value = row.otherNote;
  editIndex = index;
  document.getElementById("saveBtn").textContent = "განახლება";
}

function excelSerialToDate(serial) {
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  return serial.toString().trim();
}

async function handleExcelUpload(event) {
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
      "დარეკვის თარიღი": "callDate",
      "მომხმარებლის ID": "userId",
      "რეგისტრაციის თარიღი": "regDate",
      ოპერატორი: "operator",
      კონტაქტი: "contact",
      კომენტარი: "comment",
      "სხვა შენიშვნა (არსებობის შემთხვევაში)": "otherNote",
    };

    rows.forEach((row) => {
      if (row.length === 0) return;
      const newRow = { deleted: false };
      headers.forEach((header, idx) => {
        if (header in fieldMap) {
          let value = row[idx] || "";
          const field = fieldMap[header];
          if (field === "callDate" || field === "regDate") {
            newRow[field] = excelSerialToDate(value);
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
      data.unshift(newRow);
    });

    await saveData();
    currentPage = 0;
    renderTable();
  };
  reader.readAsBinaryString(file);
}

// For progress tab
let progressData = [];
let progressCurrentPage = 0;
let progressEditIndex = -1;
const progressItemsPerPage = 25;
let progressSortColumn = null;
let progressSortDirection = "asc";

// Load progress data
async function loadProgressData() {
  try {
    const response = await fetch("/progress-data");
    progressData = await response.json();
    calculateRepeats();
    renderProgressTable();
  } catch (error) {
    console.error("Error loading progress data:", error);
  }
}

function sortProgressTable(column) {
  if (progressSortColumn === column) {
    progressSortDirection = progressSortDirection === "asc" ? "desc" : "asc";
  } else {
    progressSortColumn = column;
    progressSortDirection = "asc";
  }
  renderProgressTable();
}

// Render progress table
function renderProgressTable() {
  const tableBody = document.getElementById("progressTableBody");
  const searchValue = document
    .getElementById("progressSearchInput")
    .value.toLowerCase();
  let filteredData = progressData.filter((row) => !row.deleted);
  if (searchValue) {
    filteredData = filteredData.filter((row) =>
      Object.values(row).some((val) =>
        val.toString().toLowerCase().includes(searchValue)
      )
    );
  }

  // Recalculate counts for all rows
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

    tr.addEventListener("click", (e) => {
      if (!["INPUT", "BUTTON"].includes(e.target.tagName)) {
        const cb = tr.querySelector(".progress-row-select");
        cb.checked = !cb.checked;
      }
    });
  });

  renderProgressPagination(totalPages);
}

function renderProgressPagination(totalPages) {
  const pagination = document.getElementById("progressPagination");
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "წინა";
  prevBtn.disabled = progressCurrentPage === 0;
  prevBtn.onclick = () => {
    if (progressCurrentPage > 0) {
      progressCurrentPage--;
      renderProgressTable();
    }
  };
  pagination.appendChild(prevBtn);

  const pageInfo = document.createElement("span");
  pageInfo.id = "progressPageInfo";
  pageInfo.textContent = `გვერდი ${progressCurrentPage + 1} / ${totalPages}`;
  pagination.appendChild(pageInfo);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "შემდეგი";
  nextBtn.disabled = progressCurrentPage >= totalPages - 1;
  nextBtn.onclick = () => {
    if (progressCurrentPage < totalPages - 1) {
      progressCurrentPage++;
      renderProgressTable();
    }
  };
  pagination.appendChild(nextBtn);
}

function timeToFraction(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h + (m || 0) / 60) / 24;
}

function fractionToTime(fraction) {
  const hours = Math.floor(fraction * 24);
  const minutes = Math.floor((fraction * 24 - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function parseDateTime(row) {
  let dt = new Date(row.date);
  if (row.hour) {
    const [h, m] = row.hour.split(":").map(Number);
    dt.setHours(h || 0, m || 0, 0, 0);
  } else {
    dt.setHours(0, 0, 0, 0);
  }
  return dt;
}

function calculateRepeats() {
  const sorted = progressData
    .filter((r) => !r.deleted)
    .sort((a, b) => parseDateTime(a) - parseDateTime(b));

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    const result = row.result.trim();
    const contact = row.contact.trim();
    const dateStr = row.date;
    const timeStr = row.hour || "09:00";
    const currentDate = new Date(dateStr);
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0] + " " + timeStr;
    if (result === "") {
      row.repeat = "";
      continue;
    }
    if (
      ["სხვისი ნომერი", "არ სურს ", "ვერ", "შედგა კომუნიკაცია", "Res"].includes(
        result
      ) ||
      contact === "ვერ"
    ) {
      row.repeat = "აღარ";
      continue;
    }

    if (["გათიშულია", "არპასუხი", "სხვა დროს დარეკვა"].includes(result)) {
      const currentFraction = timeToFraction(timeStr);
      const z2 = 0.041666; // 1 hour
      let newFraction = currentFraction + z2;
      let newDate = new Date(currentDate);
      if (newFraction >= 1) {
        newFraction -= 1;
        newDate.setDate(newDate.getDate() + 1);
      }
      const newTime = fractionToTime(newFraction);
      row.repeat = newDate.toISOString().split("T")[0] + " " + newTime;
      continue;
    }
    row.repeat = tomorrowStr;
  }
}

async function saveProgressRow() {
  const userId = document.getElementById("progressUserId").value;
  const found = data.find((r) => r.userId === userId && !r.deleted);
  const verified = found ? found.contact : "არა";

  const newRow = {
    date: document.getElementById("progressDate").value,
    hour: document.getElementById("progressHour").value,
    source: document.getElementById("progressSource").value,
    operator: document.getElementById("progressOperator").value,
    userId: userId,
    contact: document.getElementById("progressContact").value,
    result: document.getElementById("progressResult").value,
    nextCall: document.getElementById("progressNextCall").value,
    note: document.getElementById("progressNote").value,
    repeat: "",
    operator2: document.getElementById("progressOperator2").value,
    contact2: document.getElementById("progressContact2").value,
    result2: document.getElementById("progressResult2").value,
    comment: document.getElementById("progressComment").value,
    verified: verified,
    category: document.getElementById("progressCategory").value,
    count: 0,
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
  calculateRepeats();
  progressCurrentPage = 0;
  renderProgressTable();
  clearProgressInputs();
}

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

async function deleteProgressRow(index) {
  if (index >= 0 && index < progressData.length) {
    progressData[index].deleted = true;
    await saveProgressData();
    calculateRepeats();
    renderProgressTable();
  }
}

async function progressBulkDeleteRows() {
  const selected = document.querySelectorAll(".progress-row-select:checked");
  const indices = Array.from(selected).map((cb) => parseInt(cb.dataset.index));
  indices.sort((a, b) => b - a);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < progressData.length) {
      progressData[idx].deleted = true;
    }
  });
  await saveProgressData();
  calculateRepeats();
  renderProgressTable();
}

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

function excelSerialToTime(serial) {
  if (typeof serial === "number" && serial < 1) {
    const hours = Math.floor(serial * 24);
    const minutes = Math.floor((serial * 24 - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
  return serial.toString().trim();
}

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
    calculateRepeats();
    progressCurrentPage = 0;
    renderProgressTable();
  };
  reader.readAsBinaryString(file);
}

function clearInputs() {
  document.getElementById("callDate").value = "";
  document.getElementById("userId").value = "";
  document.getElementById("regDate").value = "";
  document.getElementById("operator").value = "";
  document.getElementById("contact").value = "";
  document.getElementById("comment").value = "";
  document.getElementById("otherNote").value = "";
}

function clearProgressInputs() {
  document.getElementById("progressDate").value = "";
  document.getElementById("progressHour").value = "";
  document.getElementById("progressSource").value = "";
  document.getElementById("progressOperator").value = "";
  document.getElementById("progressUserId").value = "";
  document.getElementById("progressContact").value = "";
  document.getElementById("progressResult").value = "";
  document.getElementById("progressNextCall").value = "";
  document.getElementById("progressNote").value = "";
  document.getElementById("progressOperator2").value = "";
  document.getElementById("progressContact2").value = "";
  document.getElementById("progressResult2").value = "";
  document.getElementById("progressComment").value = "";
  document.getElementById("progressVerified").value = "";
  document.getElementById("progressCategory").value = "";
}

// Auto-set Verified on userId change
document.getElementById("progressUserId").addEventListener("input", () => {
  const userId = document.getElementById("progressUserId").value;
  const found = data.find((r) => r.userId === userId && !r.deleted);
  document.getElementById("progressVerified").value = found
    ? found.contact
    : "არა";
});

// Search listener for progress
document.getElementById("progressSearchInput").addEventListener("input", () => {
  progressCurrentPage = 0;
  renderProgressTable();
});

// Load on page load
loadProgressData();

// Set default date for progress
document.getElementById("progressDate").value = new Date()
  .toISOString()
  .split("T")[0];

async function saveData() {
  try {
    await fetch("/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Dark mode toggle function
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const toggle = document.querySelector(".dark-mode-toggle");
  toggle.textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
}

// Load data on page load
loadData();

// Search input listener
document.getElementById("searchInput").addEventListener("input", () => {
  currentPage = 0;
  renderTable();
});

// Set default call date to today
document.getElementById("callDate").value = new Date()
  .toISOString()
  .split("T")[0];
document.getElementById("callDate").min = new Date()
  .toISOString()
  .split("T")[0];

// Table scroll indicators
function updateScrollIndicators(event) {
  const wrapper = event.target;
  const scrollLeft = wrapper.scrollLeft;
  const scrollWidth = wrapper.scrollWidth;
  const clientWidth = wrapper.clientWidth;

  wrapper.classList.toggle("scroll-left", scrollLeft > 0);
  wrapper.classList.toggle(
    "scroll-right",
    scrollLeft < scrollWidth - clientWidth - 1
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".table-wrapper").forEach((wrapper) => {
    wrapper.addEventListener("scroll", updateScrollIndicators);
    updateScrollIndicators({ target: wrapper });
  });
});

// For upload tab
let uploadData = [];
let uploadCurrentPage = 0;
let uploadEditIndex = -1;
const uploadItemsPerPage = 25;
let uploadSortColumn = null;
let uploadSortDirection = "asc";

async function loadUploadData() {
  try {
    const response = await fetch("/upload-data");
    uploadData = await response.json();
    renderUploadTable();
  } catch (error) {
    console.error("Error loading upload data:", error);
  }
}

function sortUploadTable(column) {
  if (uploadSortColumn === column) {
    uploadSortDirection = uploadSortDirection === "asc" ? "desc" : "asc";
  } else {
    uploadSortColumn = column;
    uploadSortDirection = "asc";
  }
  renderUploadTable();
}

function getUploadSortValue(row, column) {
  let val;
  switch (column) {
    case "currentDate":
      val = new Date(row.currentDate).getTime() || 0;
      break;
    case "operator":
    case "type":
    case "userId":
    case "uploadTime":
      val = row[column] ? row[column].toLowerCase() : "";
      break;
    case "actionValidity":
      val = new Date(row.year, row.month - 1, row.day).getTime() || 0;
      break;
    case "completionValidity":
      val = new Date(row.year, row.month - 1, row.day).getTime() || 0;
      break;
    default:
      val = row[column];
  }
  return val;
}

function renderUploadTable() {
  const tableBody = document.getElementById("uploadTableBody");
  const searchValue = document
    .getElementById("uploadSearchInput")
    .value.toLowerCase();
  let filteredData = uploadData.filter((row) => !row.deleted);
  if (searchValue) {
    filteredData = filteredData.filter((row) =>
      Object.values(row).some((val) =>
        val.toString().toLowerCase().includes(searchValue)
      )
    );
  }

  if (uploadSortColumn) {
    filteredData.sort((a, b) => {
      const va = getUploadSortValue(a, uploadSortColumn);
      const vb = getUploadSortValue(b, uploadSortColumn);
      if (va < vb) return uploadSortDirection === "asc" ? -1 : 1;
      if (va > vb) return uploadSortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filteredData.length / uploadItemsPerPage);
  const start = uploadCurrentPage * uploadItemsPerPage;
  const end = start + uploadItemsPerPage;
  const pageData = filteredData.slice(start, end);

  tableBody.innerHTML = "";
  pageData.forEach((row) => {
    const originalIndex = uploadData.indexOf(row);
    const actionValidity = `${row.day} ${row.month} ${row.year}`;
    const completionValidity = `${row.day}/${row.month}/${row.year}`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="upload-row-select" data-index="${originalIndex}"></td>
      <td>${row.currentDate}</td>
      <td>${row.operator}</td>
      <td>${row.type}</td>
      <td>${row.userId}</td>
      <td>${actionValidity}</td>
      <td>${completionValidity}</td>
      <td>${row.uploadTime}</td>
      <td>
        <button class="edit-btn" onclick="editUploadRow(${originalIndex})">რედაქტირება</button>
        <button class="delete-btn" onclick="deleteUploadRow(${originalIndex})">წაშლა</button>
      </td>
    `;
    tableBody.appendChild(tr);

    tr.addEventListener("click", (e) => {
      if (!["INPUT", "BUTTON"].includes(e.target.tagName)) {
        const cb = tr.querySelector(".upload-row-select");
        cb.checked = !cb.checked;
      }
    });
  });

  renderUploadPagination(totalPages);
}

function renderUploadPagination(totalPages) {
  const pagination = document.getElementById("uploadPagination");
  pagination.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "წინა";
  prevBtn.disabled = uploadCurrentPage === 0;
  prevBtn.onclick = () => {
    if (uploadCurrentPage > 0) {
      uploadCurrentPage--;
      renderUploadTable();
    }
  };
  pagination.appendChild(prevBtn);

  const pageInfo = document.createElement("span");
  pageInfo.id = "uploadPageInfo";
  pageInfo.textContent = `გვერდი ${uploadCurrentPage + 1} / ${totalPages}`;
  pagination.appendChild(pageInfo);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "შემდეგი";
  nextBtn.disabled = uploadCurrentPage >= totalPages - 1;
  nextBtn.onclick = () => {
    if (uploadCurrentPage < totalPages - 1) {
      uploadCurrentPage++;
      renderUploadTable();
    }
  };
  pagination.appendChild(nextBtn);
}

async function saveUploadRow() {
  const today = new Date().toISOString().split("T")[0];
  const newRow = {
    currentDate: today,
    operator: document.getElementById("uploadOperator").value,
    type: document.getElementById("uploadType").value,
    userId: document.getElementById("uploadUserId").value,
    day: document.getElementById("uploadDay").value,
    month: document.getElementById("uploadMonth").value,
    year: document.getElementById("uploadYear").value,
    uploadTime: document.getElementById("uploadTime").value,
    deleted: false,
  };

  if (uploadEditIndex !== -1) {
    uploadData[uploadEditIndex] = newRow;
    uploadEditIndex = -1;
    document.getElementById("uploadSaveBtn").textContent = "შენახვა";
  } else {
    uploadData.unshift(newRow);
  }

  await saveUploadData();
  uploadCurrentPage = 0;
  renderUploadTable();
  clearUploadInputs();
}

function clearUploadInputs() {
  document.getElementById("uploadOperator").value = "";
  document.getElementById("uploadType").value = "";
  document.getElementById("uploadUserId").value = "";
  document.getElementById("uploadDay").value = "";
  document.getElementById("uploadMonth").value = "";
  document.getElementById("uploadYear").value = "";
  document.getElementById("uploadTime").value = "";
}

function editUploadRow(index) {
  const row = uploadData[index];
  document.getElementById("uploadOperator").value = row.operator;
  document.getElementById("uploadType").value = row.type;
  document.getElementById("uploadUserId").value = row.userId;
  document.getElementById("uploadDay").value = row.day;
  document.getElementById("uploadMonth").value = row.month;
  document.getElementById("uploadYear").value = row.year;
  document.getElementById("uploadTime").value = row.uploadTime;
  uploadEditIndex = index;
  document.getElementById("uploadSaveBtn").textContent = "განახლება";
}

async function deleteUploadRow(index) {
  if (index >= 0 && index < uploadData.length) {
    uploadData[index].deleted = true;
    await saveUploadData();
    renderUploadTable();
  }
}

async function uploadBulkDeleteRows() {
  const selected = document.querySelectorAll(".upload-row-select:checked");
  const indices = Array.from(selected).map((cb) => parseInt(cb.dataset.index));
  indices.sort((a, b) => b - a);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < uploadData.length) {
      uploadData[idx].deleted = true;
    }
  });
  await saveUploadData();
  renderUploadTable();
}

async function saveUploadData() {
  try {
    await fetch("/save-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadData),
    });
  } catch (error) {
    console.error("Error saving upload data:", error);
  }
}

async function handleUploadExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const workbook = XLSX.read(e.target.result, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const excelData = XLSX.utils.sheet_to_json(sheet, {
      header: [
        null,
        "operator",
        "type",
        "userId",
        "day",
        "month",
        "year",
        null,
        "uploadTime",
        null,
        null,
        null,
        null,
      ],
      defval: "",
    });

    const today = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    excelData.forEach((row) => {
      if (
        !row.operator &&
        !row.type &&
        !row.userId &&
        !row.day &&
        !row.month &&
        !row.year &&
        !row.uploadTime
      )
        return;
      const newRow = { deleted: false, currentDate: today };
      newRow.operator = row.operator;
      newRow.type = row.type;
      newRow.userId = (row.userId || "").toString();
      newRow.day = (row.day || "").toString();
      newRow.month = (row.month || "").toString();
      newRow.year = (row.year || "").toString();
      newRow.uploadTime =
        typeof row.uploadTime === "number" && row.uploadTime < 1
          ? excelSerialToTime(row.uploadTime)
          : row.uploadTime || currentTime;
      uploadData.unshift(newRow);
    });

    await saveUploadData();
    uploadCurrentPage = 0;
    renderUploadTable();
  };
  reader.readAsBinaryString(file);
}

// Load upload data on page load
loadUploadData();

// Search listener for upload
document.getElementById("uploadSearchInput").addEventListener("input", () => {
  uploadCurrentPage = 0;
  renderUploadTable();
});
