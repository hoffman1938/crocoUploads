// main.js (updated with socket.io client)
function openTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");

  const links = document.querySelectorAll(".navbar a");
  links.forEach((link) => link.classList.remove("active"));
  const activeLink = document.querySelector(`.navbar a[href="#${tabId}"]`);
  if (activeLink) activeLink.classList.add("active");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const toggle = document.querySelector(".dark-mode-toggle");
  toggle.textContent = document.body.classList.contains("dark-mode")
    ? "☀️"
    : "🌙";
}

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
  // Load data for all tabs
  loadData();
  loadProgressData();
  loadUploadData();

  // Set default call date to today
  document.getElementById("callDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("callDate").min = new Date()
    .toISOString()
    .split("T")[0];

  // Set default date for progress
  document.getElementById("progressDate").value = new Date()
    .toISOString()
    .split("T")[0];

  // Search listeners
  document.getElementById("searchInput").addEventListener("input", () => {
    currentPage = 0;
    renderTable();
  });

  document.getElementById("progressSearchInput").addEventListener("input", () => {
    progressCurrentPage = 0;
    renderProgressTable();
  });

  document.getElementById("uploadSearchInput").addEventListener("input", () => {
    uploadCurrentPage = 0;
    renderUploadTable();
  });

  // Auto-set Verified on userId change
  document.getElementById("progressUserId").addEventListener("input", () => {
    const userId = document.getElementById("progressUserId").value;
    const found = data.find((r) => r.userId === userId && !r.deleted);
    document.getElementById("progressVerified").value = found
      ? found.contact
      : "არა";
  });

  // Table scroll indicators
  document.querySelectorAll(".table-wrapper").forEach((wrapper) => {
    wrapper.addEventListener("scroll", updateScrollIndicators);
    updateScrollIndicators({ target: wrapper });
  });

  // Закрытие модальных окон по клику вне
  window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
  }

  // Socket.io for real-time updates
  const socket = io();
  socket.on('data-updated', (msg) => {
    if (msg.type === 'data') {
      loadData();
    } else if (msg.type === 'progress') {
      loadProgressData();
    } else if (msg.type === 'upload') {
      loadUploadData();
    }
  });
});