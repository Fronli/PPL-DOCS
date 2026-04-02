// Fungsi untuk menampilkan notification box
function showNotification(message, type = "error") {
	let box = document.getElementById("auth-notification");
	
	if (!box) {
		box = document.createElement("div");
		box.id = "auth-notification";
		box.className = "notification-box";
		document.body.appendChild(box);
	}
	
	// Reset classes
	box.className = `notification-box ${type}`;
	
	// Set icon base on type
	const iconSvg = type === "success" 
		? `<svg class="notif-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
		: `<svg class="notif-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

	box.innerHTML = `${iconSvg} <span>${message}</span>`;
	
	// Trigger animation
	requestAnimationFrame(() => {
		box.classList.add("show");
	});

	// Auto hide after 3.5s
	setTimeout(() => {
		box.classList.remove("show");
	}, 3500);
}

document.addEventListener("DOMContentLoaded", () => {
	const registerForm = document.querySelector(".auth-form");

	if (registerForm) {
		registerForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			
			const name = document.getElementById("name").value;
			const email = document.getElementById("email").value;
			const password = document.getElementById("password").value;
			const submitBtn = registerForm.querySelector("button[type='submit']");
			const originalText = submitBtn.textContent;
			
			submitBtn.disabled = true;
			submitBtn.textContent = "Loading...";

			try {
				const endpoint = "/auth/signup";

				const response = await fetch(endpoint, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ name, email, password })
				});

				const data = await response.json().catch(() => ({}));

				if (response.ok) {
					showNotification(data.message || "Berhasil membuat akun! Silakan login.", "success");
					setTimeout(() => {
						window.location.href = "/auth/login"; // Redirect ke halaman login
					}, 1500);
				} else {
					showNotification(data.message || "Invalid. Gagal mendaftar.", "error");
				}
			} catch (error) {
				console.error("Signup Error:", error);
				showNotification("Server Error. Silakan coba lagi nanti.", "error");
			} finally {
				submitBtn.disabled = false;
				submitBtn.textContent = originalText;
			}
		});
	}
});

// Respon handler akan di-trigger otomatis oleh komponen HTML Google
window.handleGoogleResponse = async function(response) {
	const idToken = response.credential;
	try {
		const res = await fetch("/auth/google", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ idToken })
		});
		const data = await res.json().catch(() => ({}));

		if (res.ok) {
			localStorage.setItem("token", data.token);
			localStorage.setItem("username", JSON.stringify(data.user.name));
			localStorage.setItem("email", JSON.stringify(data.user.email));
			localStorage.setItem("role", JSON.stringify(data.user.role));
			showNotification(data.message || "Berhasil mendaftar/login dengan Google!", "success");
			setTimeout(() => {
				window.location.href = "/";
			}, 1000);
		} else {
			showNotification(data.message || "Gagal login dengan Google", "error");
		}
	} catch (error) {
		console.error("Google Auth Error:", error);
		showNotification("Terjadi kesalahan sistem.", "error");
	}
}
