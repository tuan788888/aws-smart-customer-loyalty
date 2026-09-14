const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const errorMessage = document.getElementById("errorMessage");

    // Tài khoản demo
    const correctEmail = "admin@gmail.com";
    const correctPassword = "123456";

    if (email === correctEmail && password === correctPassword) {

        // Lưu trạng thái đăng nhập
        localStorage.setItem("isLoggedIn", "true");

        // Chuyển sang Dashboard
        window.location.href = "dashboard.html";

    } else {

        errorMessage.textContent =
            "Email hoặc mật khẩu không chính xác!";

    }

});