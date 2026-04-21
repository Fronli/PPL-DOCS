document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();
    setupForm();
});

// Reusing navbar logic from homepage
function updateNavbar() {
    const token = localStorage.getItem("token");
    const topActions = document.getElementById("topActions");

    if (token) {
        // Assume user info is in localStorage or we just show a placeholder
        const userStr = localStorage.getItem("user");
        let userData = { username: "User" };
        if (userStr) {
            try {
                userData = JSON.parse(userStr);
            } catch (e) {
                console.error("Failed parsing user data", e);
            }
        }

        const initial = userData.username ? userData.username.charAt(0).toUpperCase() : "U";

        topActions.innerHTML = `
            <div class="user-menu-wrap">
                <div class="user-menu-btn" id="userMenuBtn">
                    <div class="user-avatar">${initial}</div>
                    <span>${userData.username}</span>
                </div>
                <div class="user-dropdown" id="userDropdown">
                    <a href="/my-tickets">My Tickets</a>
                    <a href="#" class="logout" id="logoutBtn">Log Out</a>
                </div>
            </div>
        `;

        const menuBtn = document.getElementById("userMenuBtn");
        const dropdown = document.getElementById("userDropdown");
        menuBtn.addEventListener("click", () => {
            dropdown.classList.toggle("show");
        });

        document.getElementById("logoutBtn").addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/";
        });

    } else {
        topActions.innerHTML = `
            <a class="login-link" id="loginBtn" href="/auth/login">Log In</a>
            <a class="signup-btn" id="signupBtn" href="/auth/signup">Sign Up</a>
        `;
    }
}

function setupForm() {
    const form = document.getElementById("eoApplyForm");
    const submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        if (!token) {
            alert("You must be logged in to apply as an Event Organizer!");
            window.location.href = "/auth/login";
            return;
        }

        const formData = new FormData(form);
        const data = {
            organizationName: formData.get("organizationName"),
            description: formData.get("description"),
            contactInfo: formData.get("contactInfo"),
        };

        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        try {
            const res = await fetch("/eo/apply", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (res.ok) {
                showModal("Application Submitted", "Success! Your application has been submitted and is currently pending review.", true);
            } else {
                showModal("Error", result.message || "Failed to submit application.", false);
            }
        } catch (error) {
            console.error("Submission error:", error);
            showModal("Network Error", "A network error occurred while submitting. Please try again.", false);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

function showModal(title, message, isSuccess) {
    const modal = document.getElementById("notificationModal");
    const mTitle = document.getElementById("modalTitle");
    const mMessage = document.getElementById("modalMessage");

    mTitle.textContent = title;
    mTitle.style.color = isSuccess ? "#10b981" : "#ef4444";
    mMessage.textContent = message;

    // Store whether we should redirect on close
    modal.dataset.redirect = isSuccess ? "true" : "false";

    modal.classList.add("active");
}

window.closeModalAndRedirect = function () {
    const modal = document.getElementById("notificationModal");
    modal.classList.remove("active");
    if (modal.dataset.redirect === "true") {
        window.location.href = "/";
    }
}
