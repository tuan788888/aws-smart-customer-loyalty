// ================================
// CẤU HÌNH API
// ================================

// THAY URL NÀY BẰNG INVOKE URL THẬT CỦA BẠN
const API_URL = "https://s3tls9atrb.execute-api.ap-southeast-1.amazonaws.com/customers";

// ================================
// BIẾN DỮ LIỆU
// ================================

let customers = [];
let editingId = null; // null = đang thêm mới, có giá trị = đang sửa

// ================================
// KIỂM TRA ĐĂNG NHẬP
// ================================

if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login.html";
}

// ================================
// LẤY KHÁCH HÀNG TỪ AWS
// ================================

async function loadCustomers() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API trả về lỗi: " + response.status);
        }

        const data = await response.json();
        console.log("Dữ liệu từ AWS:", data);

        if (data.success) {
            customers = data.customers;
            renderCustomers();
        } else {
            alert("Không lấy được dữ liệu khách hàng.");
        }
    } catch (error) {
        console.error("Lỗi API:", error);
        alert(
            "Không thể kết nối tới AWS API.\n\n" +
            "Kiểm tra lại API Gateway và Invoke URL."
        );
    }
}

// ================================
// HIỂN THỊ KHÁCH HÀNG
// ================================

function renderCustomers() {
    const tbody = document.getElementById("customerTableBody");

    if (!tbody) {
        console.error("Không tìm thấy customerTableBody");
        return;
    }

    tbody.innerHTML = "";

    customers.forEach((customer, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${customer.fullName || ""}</td>
            <td>${customer.email || ""}</td>
            <td>${customer.phone || ""}</td>
            <td>
                ${(customer.points || 0).toLocaleString("vi-VN")}
            </td>
            <td>
                <span class="badge ${getTierClass(customer.tier)}">
                    ${customer.tier || "BRONZE"}
                </span>
            </td>
            <td>
                <button
                    class="btn-edit"
                    onclick="editCustomer('${customer.customerId}')">
                    Sửa
                </button>
                <button
                    class="btn-delete"
                    onclick="deleteCustomer('${customer.customerId}')">
                    Xóa
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ================================
// XÁC ĐỊNH CLASS HẠNG
// ================================

function getTierClass(tier) {
    switch (tier) {
        case "GOLD":
            return "gold";
        case "SILVER":
            return "silver";
        default:
            return "bronze";
    }
}

// ================================
// TÌM KIẾM KHÁCH HÀNG
// ================================

function searchCustomers() {
    const keyword = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const rows = document.querySelectorAll("#customerTableBody tr");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(keyword)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// ================================
// QUẢN LÝ MODAL (ĐÓNG / MỞ)
// ================================

function openAddCustomer() {
    editingId = null;

    const modal = document.getElementById("customerModal");
    const form = document.getElementById("customerForm");
    const title = document.getElementById("modalTitle");

    if (form) form.reset();
    if (document.getElementById("customerId")) {
        document.getElementById("customerId").value = "";
    }
    if (title) title.textContent = "Thêm khách hàng";
    if (modal) modal.style.display = "flex";
}

function openEditCustomer(customer) {
    editingId = customer.customerId;

    const modal = document.getElementById("customerModal");
    const form = document.getElementById("customerForm");
    const title = document.getElementById("modalTitle");

    if (form) {
        form.reset();
        document.getElementById("customerId").value = customer.customerId;
        document.getElementById("customerName").value = customer.fullName || "";
        document.getElementById("customerEmail").value = customer.email || "";
        document.getElementById("customerPhone").value = customer.phone || "";
        document.getElementById("customerPoints").value = customer.points || 0;
    }

    if (title) title.textContent = "Sửa khách hàng";
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    editingId = null;
    const modal = document.getElementById("customerModal");
    if (modal) modal.style.display = "none";
}

// ================================
// SỬA KHÁCH HÀNG
// ================================

function editCustomer(customerId) {
    const customer = customers.find(c => c.customerId === customerId);
    if (!customer) return;

    openEditCustomer(customer);
}

async function updateCustomerToAWS(customerId, customerData) {
    try {
        const response = await fetch(`${API_URL}/${customerId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(customerData)
        });

        const data = await response.json();
        console.log("Kết quả cập nhật:", data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể cập nhật khách hàng.");
        }

        alert("Cập nhật khách hàng thành công!");

        closeModal();
        await loadCustomers();

        return true;
    } catch (error) {
        console.error("Lỗi cập nhật khách hàng:", error);
        alert("Không thể cập nhật khách hàng.\n\n" + error.message);
        return false;
    }
}

// ================================
// XÓA KHÁCH HÀNG
// ================================

function deleteCustomer(customerId) {
    const customer = customers.find(c => c.customerId === customerId);
    if (!customer) return;

    const confirmDelete = confirm(
        `Bạn có chắc muốn xóa khách hàng "${customer.fullName}"?`
    );

    if (!confirmDelete) return;

    deleteCustomerFromAWS(customerId);
}

async function deleteCustomerFromAWS(customerId) {
    try {
        const response = await fetch(`${API_URL}/${customerId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        console.log("Kết quả xóa:", data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể xóa khách hàng.");
        }

        alert("Xóa khách hàng thành công!");
        await loadCustomers();
    } catch (error) {
        console.error("Lỗi xóa khách hàng:", error);
        alert("Không thể xóa khách hàng.\n\n" + error.message);
    }
}

// ================================
// ĐĂNG XUẤT
// ================================

function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}

// ==========================================
// THÊM KHÁCH HÀNG
// ==========================================

async function addCustomerToAWS(customerData) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(customerData)
        });

        const data = await response.json();
        console.log("Kết quả thêm khách hàng:", data);

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Không thể thêm khách hàng.");
        }

        alert("Thêm khách hàng thành công!");

        const form = document.getElementById("customerForm");
        if (form) form.reset();

        closeModal();
        await loadCustomers();

        return true;
    } catch (error) {
        console.error("Lỗi thêm khách hàng:", error);
        alert("Không thể thêm khách hàng.\n\n" + error.message);
        return false;
    }
}

// ================================
// KHỞI ĐỘNG & LẮNG NGHE SỰ KIỆN
// ================================

document.addEventListener("DOMContentLoaded", function () {
    loadCustomers();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", searchCustomers);
    }

    const form = document.getElementById("customerForm");
    if (form) {
        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const fullName = document.getElementById("customerName").value.trim();
            const email = document.getElementById("customerEmail").value.trim();
            const phone = document.getElementById("customerPhone").value.trim();
            const points = Number(document.getElementById("customerPoints").value);

            const customerData = { fullName, email, phone, points };

            if (editingId) {
                await updateCustomerToAWS(editingId, customerData);
            } else {
                await addCustomerToAWS(customerData);
            }
        });
    }
});