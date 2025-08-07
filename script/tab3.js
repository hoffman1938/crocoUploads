// tab3.js
let uploadData = [];
let uploadCurrentPage = 0;
let uploadEditIndex = -1;
const uploadItemsPerPage = 25;
let uploadSortColumn = null;
let uploadSortDirection = "asc";
let uploadFilterValues = {};

async function loadUploadData() {
  try {
    const response = await fetch("/upload-data");
    uploadData = await response.json();
    createUploadFilters();
    renderUploadTable();
  } catch (error) {
    console.error("Error loading upload data:", error);
  }
}

function createUploadFilters() {
  const columns = ['currentDate', 'operator', 'type', 'userId', 'uploadTime', 'actionValidity', 'completionValidity'];
  const filtersContainer = document.getElementById('uploadFilters');
  filtersContainer.innerHTML = '';

  let tempFilteredData = uploadData.filter((row) => !row.deleted);
  Object.keys(uploadFilterValues).forEach(col => {
    if (uploadFilterValues[col]) {
      if (col === 'actionValidity') {
        tempFilteredData = tempFilteredData.filter(row => `${row.day} ${row.month} ${row.year}` === uploadFilterValues[col]);
      } else if (col === 'completionValidity') {
        tempFilteredData = tempFilteredData.filter(row => `${row.day}/${row.month}/${row.year}` === uploadFilterValues[col]);
      } else {
        tempFilteredData = tempFilteredData.filter(row => String(row[col]) === uploadFilterValues[col]);
      }
    }
  });

  columns.forEach(column => {
    let uniqueValues;
    if (column === 'actionValidity') {
      uniqueValues = [...new Set(tempFilteredData.map(row => `${row.day} ${row.month} ${row.year}` || ''))].sort();
    } else if (column === 'completionValidity') {
      uniqueValues = [...new Set(tempFilteredData.map(row => `${row.day}/${row.month}/${row.year}` || ''))].sort();
    } else {
      uniqueValues = [...new Set(tempFilteredData.map(row => String(row[column]) || ''))].sort();
    }
    if (uploadFilterValues[column] && !uniqueValues.includes(uploadFilterValues[column])) {
      uploadFilterValues[column] = '';
    }
    const label = document.createElement('label');
    label.textContent = `${column}: `;
    const select = document.createElement('select');
    select.id = `upload-filter-${column}`;
    select.innerHTML = '<option value="">ყველა</option>' + uniqueValues.map(val => `<option value="${val}">${val}</option>`).join('');
    select.value = uploadFilterValues[column] || '';
    select.addEventListener('change', (e) => {
      uploadFilterValues[column] = e.target.value;
      createUploadFilters();
    });
    label.appendChild(select);
    filtersContainer.appendChild(label);
  });
}

function openFiltersPopup(modalId) {
  createUploadFilters();
  document.getElementById(modalId).style.display = "block";
}

function closeFiltersPopup(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function applyFilters(modalId) {
  uploadCurrentPage = 0;
  renderUploadTable();
  closeFiltersPopup(modalId);
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

  Object.keys(uploadFilterValues).forEach(column => {
    if (uploadFilterValues[column]) {
      if (column === 'actionValidity') {
        filteredData = filteredData.filter(row => `${row.day} ${row.month} ${row.year}` === uploadFilterValues[column]);
      } else if (column === 'completionValidity') {
        filteredData = filteredData.filter(row => `${row.day}/${row.month}/${row.year}` === uploadFilterValues[column]);
      } else {
        filteredData = filteredData.filter(row => String(row[column]) === uploadFilterValues[column]);
      }
    }
  });

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
  await loadUploadData(); // Перезагрузка данных с сервера
  clearUploadInputs();
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
    await loadUploadData(); // Перезагрузка
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
  await loadUploadData(); // Перезагрузка
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
    await loadUploadData(); // Перезагрузка после загрузки Excel
  };
  reader.readAsBinaryString(file);
}