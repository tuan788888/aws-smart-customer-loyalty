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
// TÍNH ĐIỂM (xem trước trong form)
// =============================

function calculatePoints(amount) {
    return Math.floor(amount / 1000);
}

// =============================
// LẤY DANH SÁCH KHÁCH HÀNG (để đổ vào select)
// =============================

async function loadCustomers() {
    try {
        const response = await fetch(CUSTOMERS_API_URL);
        const data = await response.json();

        if (data.success) {
            customers = data.customers;

            const select = document.getElementById("transactionCustomer");
            select.innerHTML = '<option value="">-- Chọn khách hàng --</option>';

            customers.forEach(customer => {
                const option = document.createElement("option");
                option.value = customer.customerId;
                option.textContent =
                    customer.fullName + " - " +
                    (customer.points || 0).toLocaleString("vi-VN") + " điểm";
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Lỗi lấy danh sách khách hàng:", error);
        alert("Không thể tải danh sách khách hàng.");
    }
}

// =============================
// LẤY DANH SÁCH GIAO DỊCH TỪ AWS
// =============================

async function loadTransactions() {
    try {
        const response = await fetch(TRANSACTIONS_API_URL);
        const data = await response.json();

        console.log("Dữ liệu giao dịch từ AWS:", data);

        if (data.success) {
            transactions = data.transactions;
            displayTransactions();
        } else {
            alert("Không lấy được dữ liệu giao dịch.");
        }
    } catch (error) {
        console.error("Lỗi lấy giao dịch:", error);
        alert("Không thể kết nối tới AWS API.");
    }
}

// =============================
// HIỂN THỊ ĐIỂM DỰ KIẾN TRONG FORM
// =============================

document
    .getElementById("transactionAmount")
    .addEventListener("input", function () {
        const amount = Number(this.value);
        const points = calculatePoints(amount);

        document.getElementById("pointPreview").textContent =
            points.toLocaleString("vi-VN") + " điểm";
    });

// =============================
// HIỂN THỊ GIAO DỊCH
// =============================

function displayTransactions() {
    const table = document.getElementById("transactionTable");
    table.innerHTML = "";

    transactions.forEach(transaction => {
        const customer = customers.find(
            c => c.customerId === transaction.customerId
        );

        const date = new Date(transaction.createdAt);
        const dateStr = date.toLocaleDateString("vi-VN");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><span class="transaction-code">${transaction.transactionId}</span></td>
            <td>${customer ? customer.fullName : transaction.customerId}</td>
            <td><span class="amount">${transaction.amount.toLocaleString("vi-VN")}đ</span></td>
            <td class="point-plus">+${transaction.points.toLocaleString("vi-VN")}</td>
            <td>${dateStr}</td>
            <td><span class="status success">Thành công</span></td>
        `;

        table.appendChild(row);
    });

    updateStatistics();
}

// =============================
// CẬP NHẬT THỐNG KÊ
// =============================

function updateStatistics() {
    const totalTransactions = transactions.length;

    const totalAmount = transactions.reduce(
        (sum, t) => sum + t.amount, 0
    );

    const totalPoints = transactions.reduce(
        (sum, t) => sum + t.points, 0
    );

    document.getElementById("totalTransactions").textContent =
        totalTransactions.toLocaleString("vi-VN");

    document.getElementById("totalAmount").textContent =
        totalAmount.toLocaleString("vi-VN") + "đ";

    document.getElementById("totalPoints").textContent =
        totalPoints.toLocaleString("vi-VN");
}

// =============================
// MỞ / ĐÓNG MODAL
// =============================

function openTransactionModal() {
    document.getElementById("transactionModal").style.display = "flex";
}

function closeTransactionModal() {
    document.getElementById("transactionModal").style.display = "none";
    document.getElementById("transactionForm").reset();
    document.getElementById("pointPreview").textContent = "0 điểm";
}

// =============================
// TẠO GIAO DỊCH (GỬI LÊN AWS)
// =============================

async function createTransactionToAWS(transactionData) {
    try {
        const response = await fetch(TRANSACTIONS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(transactionData)
        });

        const data = await response.json();
        console.log("Kết quả tạo giao dịch:", data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể tạo giao dịch.");
        }

        alert(
            "Tạo giao dịch thành công!\n" +
            "Khách hàng được cộng " +
            data.transaction.points.toLocaleString("vi-VN") +
            " điểm."
        );

        closeTransactionModal();

        // Tải lại cả 2 danh sách vì điểm khách hàng đã đổi
        await loadCustomers();
        await loadTransactions();

        return true;
    } catch (error) {
        console.error("Lỗi tạo giao dịch:", error);
        alert("Không thể tạo giao dịch.\n\n" + error.message);
        return false;
    }
}

document
    .getElementById("transactionForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const customerId = document.getElementById("transactionCustomer").value;
        const amount = Number(document.getElementById("transactionAmount").value);
        const note = document.getElementById("transactionNote").value.trim();

        if (!customerId) {
            alert("Vui lòng chọn khách hàng!");
            return;
        }

        if (amount <= 0) {
            alert("Số tiền không hợp lệ!");
            return;
        }

        const transactionData = { customerId, amount, note };

        await createTransactionToAWS(transactionData);
    });

// =============================
// KHỞI ĐỘNG
// =============================

document.addEventListener("DOMContentLoaded", async function () {
    await loadCustomers();
    await loadTransactions();
});