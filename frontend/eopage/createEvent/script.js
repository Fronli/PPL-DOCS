import { authFetch } from '../../ui_util/fetch/fetch_util.js';

/* ─── Check Auth State ─── */
function checkAuth() {
	const token = localStorage.getItem("token");
	const userStr = localStorage.getItem("username");
	const topActions = document.getElementById("topActions");

	if (token && userStr && topActions) {
		let userName = "EO";
		try {
			const parsed = JSON.parse(userStr);
			userName = typeof parsed === "string" ? parsed : (parsed.name || "EO");
		} catch (e) {
			userName = userStr;
		}

		topActions.innerHTML = `
			<div style="position: relative;" id="eoProfileWrap">
				<div class="user-profile-wrap" onclick="toggleDropdown(event)">
					<div class="user-text">
						<span class="company-name">${userName}</span>
						<span class="verified-badge">Verified Organizer</span>
					</div>
					<div class="user-avatar">
						${userName.charAt(0).toUpperCase()}
					</div>
				</div>
				
				<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 150px; z-index: 100; overflow: hidden;">
					<a href="/" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid var(--line); background: #fff;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">Marketplace</a>
					<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.85rem; font-weight: 700; background: #fff;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">Logout</a>
				</div>
			</div>
		`;
	} else {
		// Redireksi ke login jika tidak ada akses
		window.location.href = "/auth/login";
	}
}

window.toggleDropdown = function (e) {
	e.stopPropagation();
	const menu = document.getElementById("userDropdown");
	if (menu) {
		menu.style.display = menu.style.display === "none" ? "block" : "none";
	}
}

document.addEventListener("click", () => {
	const menu = document.getElementById("userDropdown");
	if (menu) menu.style.display = "none";
});

window.logout = function (e) {
	if (e) e.preventDefault();

	const overlay = document.createElement("div");
	overlay.id = "logout-confirm-overlay";
	Object.assign(overlay.style, {
		position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
		backgroundColor: "rgba(0, 0, 0, 0.4)", zIndex: "9999",
		display: "flex", alignItems: "center", justifyContent: "center",
		backdropFilter: "blur(3px)", opacity: "0", transition: "opacity 0.2s ease"
	});

	const modal = document.createElement("div");
	Object.assign(modal.style, {
		background: "#fff", padding: "32px 24px", borderRadius: "16px",
		boxShadow: "0 10px 25px rgba(0,0,0,0.15)", textAlign: "center",
		transform: "scale(0.95)", transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
		maxWidth: "340px", width: "90%", border: "1px solid var(--line)",
		fontFamily: "inherit"
	});

	modal.innerHTML = `
		<div style="margin-bottom: 20px; color: #ef4444;">
			<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto; display: block;">
				<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
				<polyline points="16 17 21 12 16 7"></polyline>
				<line x1="21" y1="12" x2="9" y2="12"></line>
			</svg>
		</div>
		<h3 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 700; color: var(--text-main);">Konfirmasi Logout</h3>
		<p style="margin: 0 0 28px; color: var(--text-muted); font-size: 0.95rem; line-height: 1.5;">Apakah Anda yakin ingin keluar dari sisi Event Organizer?</p>
		<div style="display: flex; gap: 12px; justify-content: center;">
			<button class="btn-cancel" style="padding: 12px 20px; border: 1px solid var(--line); background: white; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--text-main); flex: 1; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">Batal</button>
			<button class="btn-confirm" style="padding: 12px 20px; border: none; background: #ef4444; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: white; flex: 1; transition: background 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Ya, Keluar</button>
		</div>
	`;

	overlay.appendChild(modal);
	document.body.appendChild(overlay);

	requestAnimationFrame(() => {
		overlay.style.opacity = "1";
		modal.style.transform = "scale(1)";
	});

	const close = () => {
		overlay.style.opacity = "0";
		modal.style.transform = "scale(0.95)";
		setTimeout(() => overlay.remove(), 200);
	};

	modal.querySelector(".btn-cancel").addEventListener("click", close);
	modal.querySelector(".btn-confirm").addEventListener("click", () => {
		localStorage.removeItem("token");
		localStorage.removeItem("username");
		localStorage.removeItem("email");
		localStorage.removeItem("role");
		window.location.href = "/";
	});
}

// Interaksi Upload File Placeholder
function initUploadInteractions() {
	const uploadBox = document.getElementById("uploadBox");
	const fileInput = document.getElementById("posterFile");

	if (!uploadBox || !fileInput) return;

	uploadBox.addEventListener("click", () => {
		fileInput.click();
	});

	uploadBox.addEventListener("dragover", (e) => {
		e.preventDefault();
		uploadBox.style.borderColor = "var(--primary-blue)";
		uploadBox.style.background = "#EFF6FF";
	});

	uploadBox.addEventListener("dragleave", (e) => {
		e.preventDefault();
		uploadBox.style.borderColor = "#CBD5E1";
		uploadBox.style.background = "#F8FAFC";
	});

	const handleFile = (files) => {
		if (files.length) {
			fileInput.files = files;
			const file = files[0];
			
			// Validasi tipe
			if (!file.type.startsWith('image/')) {
				alert('Mohon pilih file gambar (JPG/PNG).');
				return;
			}
			
			// Buat preview
			const reader = new FileReader();
			reader.onload = (e) => {
				uploadBox.innerHTML = `
					<img src="${e.target.result}" alt="Preview" style="max-height: 200px; max-width: 100%; border-radius: 8px; object-fit: contain; margin-bottom: 12px;"/>
					<div class="upload-title">${file.name}</div>
					<div class="upload-subtitle" style="text-decoration: underline;">Click to change image</div>
				`;
				// Kembalikan elemen input file agar tidak hilang dari DOM
				uploadBox.appendChild(fileInput);
				uploadBox.style.padding = "24px";
			};
			reader.readAsDataURL(file);
		}
	};

	uploadBox.addEventListener("drop", (e) => {
		e.preventDefault();
		uploadBox.style.borderColor = "#CBD5E1";
		uploadBox.style.background = "#F8FAFC";
		
		if (e.dataTransfer.files.length) {
			handleFile(e.dataTransfer.files);
		}
	});

	fileInput.addEventListener("change", () => {
		if (fileInput.files.length) {
			handleFile(fileInput.files);
		}
	});
}

// Dummy Publish / Save Draft
window.saveAsDraft = function () {
	alert("Saving event as draft... (Dummy action)");
};

/* ─── SPA Navigation Interceptor ─── */
function interceptSidebarNavigation() {
	const navLinks = document.querySelectorAll('.nav-item');
	navLinks.forEach(link => {
		link.addEventListener('click', async (e) => {
			const href = link.getAttribute('href');
			if (href && href.startsWith('/') && href !== '#') {
				e.preventDefault();

				if (window.location.pathname === href) {
					const mainContent = document.querySelector('.main-content');
					if (mainContent) {
						mainContent.scrollTo({ top: 0, behavior: 'smooth' });
					} else {
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}
					return;
				}

				try {
					const response = await fetch(href, { method: "GET" });
					if (response.ok) {
						const html = await response.text();
						document.open();
						document.write(html);
						document.close();
						window.history.pushState({}, "", href);
					} else {
						alert("Gagal memuat halaman: " + href);
					}
				} catch (error) {
					console.error("Error saat fetching halaman protected:", error);
				}
			}
		});
	});
}

/* ─── Init ─── */
document.addEventListener("DOMContentLoaded", () => {
	checkAuth();
	initUploadInteractions();
	interceptSidebarNavigation();

	// Penanganan Submit Form
	const form = document.getElementById("createEventForm");
	if(form) {
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			
			const title = document.getElementById("eventTitle").value;
			const description = document.getElementById("eventDescription").value;
			const category = document.getElementById("eventCategory").value;
			const eventDate = document.getElementById("eventDateTime").value;
			const location = document.getElementById("eventLocation").value;
			
			let totalSeats = 0;
			const ticketRows = document.querySelectorAll('.ticket-row');
			ticketRows.forEach(row => {
				const stockInput = row.querySelectorAll('.form-input')[1]; 
				if (stockInput && stockInput.value) {
					totalSeats += parseInt(stockInput.value) || 0;
				}
			});

			const fileInput = document.getElementById("posterFile");
			const file = fileInput.files[0];

			const formData = new FormData();
			formData.append("title", title);
			formData.append("description", description);
			formData.append("category", category);
			formData.append("eventDate", eventDate);
			formData.append("location", location);
			formData.append("totalSeats", totalSeats);

			if (file) {
				formData.append("poster", file);
			}

			// FormData tidak bisa di-console.log secara mentah, harus di-extract isinya:
			console.log("Payload yang dikirim:", Object.fromEntries(formData.entries()));

			const submitBtn = form.querySelector('button[type="submit"]');
			const originalText = submitBtn.textContent;
			submitBtn.textContent = 'Mempublish...';
			submitBtn.disabled = true;

			try {
				const response = await authFetch("/eo/createEvent", {
					method: "POST",
					body: formData
				});

				if (response.ok) {
					alert("Berhasil mempublish event: " + title);
					// Pindah ke dashboard agar event tampil
					window.location.href = "/eo/dashboard";
				} else {
					const err = await response.json();
					alert("Gagal mempublish event: " + (err.message || response.statusText));
					submitBtn.textContent = originalText;
					submitBtn.disabled = false;
				}
			} catch (error) {
				console.error("Error creating event:", error);
				alert("Terjadi kesalahan sistem saat menghubungi server.");
				submitBtn.textContent = originalText;
				submitBtn.disabled = false;
			}
		});
	}
});
