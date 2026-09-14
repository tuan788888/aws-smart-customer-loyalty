// =============================
// CẤU HÌNH API
// =============================

const CUSTOMERS_API_URL = "https://s3tls9atrb.execute-api.ap-southeast-1.amazonaws.com/customers";
const TRANSACTIONS_API_URL = "https://s3tls9atrb.execute-api.ap-southeast-1.amazonaws.com/transactions";

// =============================
// KIỂM TRA ĐĂNG NHẬP
// =============================

if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// =============================
// BIẾN DỮ LIỆU
// =============================

let customers = [];
let transactions = [];

// =============================
// LẤY DỮ LIỆU KHÁCH HÀNG
// =============================

async function loadCustomers() {
    try {
        const response = await fetch(CUSTOMERS_API_URL);
        const data = await response.json();

        if (data.success) {
            customers = data.customers;
        }
    } catch (error) {
        console.error("Lỗi lấy khách hàng:", error);
    }
}

// =============================
// LẤY DỮ LIỆU GIAO DỊCH
// =============================

async function loadTransactions() {
    try {
        const response = await fetch(TRANSACTIONS_API_URL);
        const data = await response.json();

        if (data.success) {
            transactions = data.transactions;
        }
    } catch (error) {
        console.error("Lỗi lấy giao dịch:", error);
    }
}

// =============================
// TÍNH TOÁN & HIỂN THỊ THỐNG KÊ
// =============================

function renderStatistics() {
    const totalCustomers = customers.length;
    const totalTransactions = transactions.length;

    const totalRevenue = transactions.reduce(
        (sum, t) => sum + (t.amount || 0), 0
    );

    const totalPoints = transactions.reduce(
        (sum, t) => sum + (t.points || 0), 0
    );

    document.getElementById("statTotalCustomers").textContent =
        totalCustomers.toLocaleString("vi-VN");

    document.getElementById("statTotalTransactions").textContent =
        totalTransactions.toLocaleString("vi-VN");

    document.getElementById("statTotalRevenue").textContent =
        formatCompactCurrency(totalRevenue);

    document.getElementById("statTotalPoints").textContent =
        formatCompactNumber(totalPoints);
}

// =============================
// ĐỊNH DẠNG SỐ RÚT GỌN (350M, 125K...)
// =============================

function formatCompactCurrency(amount) {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1).replace(".0", "") + "Tỷ";
    }
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1).replace(".0", "") + "M";
    }
    if (amount >= 1000) {
        return (amount / 1000).toFixed(1).replace(".0", "") + "K";
    }
    return amount.toLocaleString("vi-VN") + "đ";
}

function formatCompactNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1).replace(".0", "") + "M";
    }
    if (number >= 1000) {
        return (number / 1000).toFixed(1).replace(".0", "") + "K";
    }
    return number.toLocaleString("vi-VN");
}

// =============================
// HIỂN THỊ GIAO DỊCH GẦN ĐÂY (top 5)
// =============================

function renderRecentTransactions() {
    const tbody = document.getElementById("recentTransactionsTable");
    tbody.innerHTML = "";

    // Giao dịch mới nhất lên đầu, lấy tối đa 5
    const recent = [...transactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    recent.forEach(transaction => {
        const customer = customers.find(
            c => c.customerId === transaction.customerId
        );

        const date = new Date(transaction.createdAt);
        const dateStr = date.toLocaleDateString("vi-VN");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${customer ? customer.fullName : transaction.customerId}</td>
            <td>${transaction.amount.toLocaleString("vi-VN")}đ</td>
            <td class="point-plus">+${transaction.points.toLocaleString("vi-VN")}</td>
            <td>${dateStr}</td>
            <td><span class="status success">Thành công</span></td>
        `;

        tbody.appendChild(row);
    });
}

// =============================
// ĐĂNG XUẤT
// =============================

function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// =============================
// KHỞI ĐỘNG
// =============================

document.addEventListener("DOMContentLoaded", async function () {
    await loadCustomers();
    await loadTransactions();

    renderStatistics();
    renderRecentTransactions();
});