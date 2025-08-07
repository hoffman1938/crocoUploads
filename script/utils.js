// utils.js

/**
 * Gets a comparable value for sorting.
 * @param {any} val - The value to sort.
 * @param {string} column - The column name.
 * @returns {number|string} - The sortable value.
 */
function getSortValue(val, column) {
  if (["callDate", "regDate"].includes(column)) {
    return new Date(val).getTime() || 0;
  } else if (!isNaN(parseFloat(val))) {
    return parseFloat(val);
  } else {
    return val.toString().toLowerCase();
  }
}

/**
 * Converts Excel serial date to ISO date string.
 * @param {number|string} serial - The Excel serial date.
 * @returns {string} - The ISO date string.
 */
function excelSerialToDate(serial) {
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    return date.toISOString().split("T")[0];
  }
  return serial.toString().trim();
}

/**
 * Converts Excel serial time to HH:MM string.
 * @param {number|string} serial - The Excel serial time.
 * @returns {string} - The time string.
 */
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

/**
 * Converts time string to fractional day.
 * @param {string} time - The time in HH:MM format.
 * @returns {number} - The fractional value.
 */
function timeToFraction(time) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (h + (m || 0) / 60) / 24;
}

/**
 * Converts fractional day to time string.
 * @param {number} fraction - The fractional day.
 * @returns {string} - The time in HH:MM format.
 */
function fractionToTime(fraction) {
  const hours = Math.floor(fraction * 24);
  const minutes = Math.floor((fraction * 24 - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Parses date and time into a Date object.
 * @param {object} row - The row with date and hour.
 * @returns {Date} - The parsed Date.
 */
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

/**
 * Clears input fields for the first tab.
 */
function clearInputs() {
  document.getElementById("callDate").value = "";
  document.getElementById("userId").value = "";
  document.getElementById("regDate").value = "";
  document.getElementById("operator").value = "";
  document.getElementById("contact").value = "";
  document.getElementById("comment").value = "";
  document.getElementById("otherNote").value = "";
}

/**
 * Clears input fields for the progress tab.
 */
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

/**
 * Clears input fields for the upload tab.
 */
function clearUploadInputs() {
  document.getElementById("uploadOperator").value = "";
  document.getElementById("uploadType").value = "";
  document.getElementById("uploadUserId").value = "";
  document.getElementById("uploadDay").value = "";
  document.getElementById("uploadMonth").value = "";
  document.getElementById("uploadYear").value = "";
  document.getElementById("uploadTime").value = "";
}