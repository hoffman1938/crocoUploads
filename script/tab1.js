// tab1.js (updated with persistent selections)
let data = [];
let currentPage = 0;
let editIndex = -1;
const itemsPerPage = 25;
let sortColumn = null;
let sortDirection = "asc";
let filterValues = {};
let selectedIndices = new Set();

async function loadData() {
  try {
    const response = await fetch("/data");
    data = await response.json();
    createFilters();
    renderTable();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function createFilters() {
  const columns = ['callDate', 'userId', 'regDate', 'operator', 'contact', 'comment', 'otherNote'];
  const filtersContainer = document.getElementById('filters');
  filtersContainer.innerHTML = '';

  let tempFilteredData = data.filter((row) => !row.deleted);
  Object.keys(filterValues).forEach(col => {
    if (filterValues[col]) {
      tempFilteredData = tempFilteredData.filter(row => String(row[col]) === filterValues[col]);
    }
  });

  columns.forEach(column => {
    const uniqueValues = [...new Set(tempFilteredData.map(row => String(row[column]) || ''))].sort();
    if (filterValues[column] && !uniqueValues.includes(filterValues[column])) {
      filterValues[column] = '';
    }
    const label = document.createElement('label');
    label.textContent = `${column}: `;
    const select = document.createElement('select');
    select.id = `filter-${column}`;
    select.innerHTML = '<option value="">ყველა</option>' + uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
    select.value = filterValues[column] || '';
    select.addEventListener('change', (e) => {
      filterValues[column] = e.target.value;
      createFilters();
    });
    label.appendChild(select);
    filtersContainer.appendChild(label);
  });
}

function openFiltersPopup(modalId) {
  createFilters();
  document.getElementById(modalId).style.display = "block";
}

function closeFiltersPopup(modalId) {
  document.getElementById(modalId).style.display = "none";
}

async function applyFiltersTab1(modalId) {
  const columns = ['callDate', 'userId', 'regDate', 'operator', 'contact', 'comment', 'otherNote'];
  columns.forEach(column => {
    const select = document.getElementById(`filter-${column}`);
    if (select) {
      filterValues[column] = select.value;
    }
  });
  await loadData(); // Reload from server for freshness
  currentPage = 0;
  renderTable();
  closeFiltersPopup(modalId);
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

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  const searchValue = document
    .getElementById("searchInput")
    .value.toLowerCase();
  let filteredData = data.filter((row) => !row.deleted);

  Object.keys(filterValues).forEach(column => {
    if (filterValues[column]) {
      filteredData = filteredData.filter(row => String(row[column]) === filterValues[column]);
    }
  });

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

    const cb = tr.querySelector(".row-select");
    cb.checked = selectedIndices.has(originalIndex);
    cb.addEventListener("change", (e) => {
      const idx = parseInt(e.target.dataset.index);
      if (e.target.checked) {
        selectedIndices.add(idx);
      } else {
        selectedIndices.delete(idx);
      }
    });

    tr.addEventListener("click", (e) => {
      if (!["INPUT", "BUTTON"].includes(e.target.tagName)) {
        const cb = tr.querySelector(".row-select");
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
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
  createFilters();
  currentPage = 0;
  renderTable();
  clearInputs();
}

async function deleteRow(index) {
  if (index >= 0 && index < data.length) {
    data[index].deleted = true;
    selectedIndices.delete(index);
    await saveData();
    createFilters();
    renderTable();
  }
}

async function bulkDeleteRows() {
  const indices = Array.from(selectedIndices);
  if (indices.length === 0) {
    alert("გთხოვთ აირჩიოთ მინიმუმ ერთი ჩანაწერი.");
    return;
  }
  indices.sort((a, b) => b - a);
  indices.forEach((idx) => {
    if (idx >= 0 && idx < data.length) {
      data[idx].deleted = true;
    }
  });
  await saveData();
  selectedIndices.clear();
  createFilters();
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
    createFilters();
    currentPage = 0;
    renderTable();
  };
  reader.readAsBinaryString(file);
}

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

function downloadSelectedTab1() {
  const indices = Array.from(selectedIndices);
  if (indices.length === 0) {
    alert("გთხოვთ აირჩიოთ მინიმუმ ერთი ჩანაწერი.");
    return;
  }

  indices.sort((a, b) => a - b); // Sort by original index for consistent order
  const selectedData = indices.map(idx => data[idx]);

  const headers = ["დარეკვის თარიღი", "მომხმარებლის ID", "რეგისტრაციის თარიღი", "ოპერატორი", "კონტაქტი", "კომენტარი", "სხვა შენიშვნა"];
  const ws_data = [headers, ...selectedData.map(row => [row.callDate, row.userId, row.regDate, row.operator, row.contact, row.comment, row.otherNote])];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "selected_data.xlsx");
}