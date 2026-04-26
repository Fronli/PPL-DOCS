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
				</div>
			</div>
		`;
	} else {
        // Redireksi ke login jika tidak ada akses
        window.location.href = "/auth/login"; 
    }
}

window.toggleDropdown = function(e) {
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

window.logout = function(e) {
	if(e) e.preventDefault();
	
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

	if(!uploadBox || !fileInput) return;

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

	uploadBox.addEventListener("drop", (e) => {
		e.preventDefault();
		uploadBox.style.borderColor = "#CBD5E1";
		uploadBox.style.background = "#F8FAFC";
		
		if (e.dataTransfer.files.length) {
			fileInput.files = e.dataTransfer.files;
			alert("File terdeteksi: " + e.dataTransfer.files[0].name + " (Mocks)");
		}
	});

	fileInput.addEventListener("change", () => {
		if(fileInput.files.length) {
			alert("File dipilih: " + fileInput.files[0].name + " (Mocks)");
		}
	});
}

// Dummy Publish / Save Draft
window.saveAsDraft = function() {
	alert("Saving event as draft... (Dummy action)");
};

/* ─── SPA Navigation Interceptor ─── */
function interceptSidebarNavigation() {
	const navLinks = document.querySelectorAll('.nav-item, .btn-primary'); // Intercept sidebar nav-items and specifically "Create Event" button that has class btn-primary
	navLinks.forEach(link => {
		link.addEventListener('click', async (e) => {
			const href = link.getAttribute('href');
			if (href && href.startsWith('/') && href !== '#') {
				e.preventDefault();
				
				// Jika pengguna sudah berada di halaman yang sama, cukup scroll ke atas
				if (window.location.pathname === href) {
					const mainContent = document.querySelector('.main-content');
					if (mainContent) {
						mainContent.scrollTo({ top: 0, behavior: 'smooth' });
					} else {
						window.scrollTo({ top: 0, behavior: 'smooth' });
					}
					return; // Hentikan fungsi agar tidak melakukan fetch ulang
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


async function fetchDashboardEvents() {
    const tbody = document.getElementById('eventsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Memuat data acara...</td></tr>';
    
    try {
        const response = await authFetch("/eo/getEOEvent", { method: "GET" });
        if (response.ok) {
            const events = await response.json();
            
            tbody.innerHTML = '';
            
            if (events.length === 0) {
                if (emptyState) emptyState.style.display = 'block';
                return;
            }
            
            if (emptyState) emptyState.style.display = 'none';
            
            events.forEach(event => {
                const badgeClass = event.isPublished ? 'live' : 'draft';
                const badgeText = event.isPublished ? 'LIVE' : 'Deactivated';
                
                const eventName = event.title || 'Untitled Event';
                const eventCategory = event.category || '-';
                
                const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
                const schedule = event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', dateOptions) : 'TBD';
                
                let location = 'TBD';
                if (event.venue && event.city) {
                    location = `${event.venue}, ${event.city}`;
                } else if (event.city) {
                    location = event.city;
                } else if (event.venue) {
                    location = event.venue;
                }
                
                const sold = 0; // default for now if sales logic isn't fully implemented
                const capacity = event.totalSeats || 0;
                const progressPct = capacity > 0 ? (sold / capacity) * 100 : 0;
                const ticketText = capacity > 0 ? `<strong>${sold}</strong> / ${capacity}` : `<strong>${sold}</strong>`;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="event-name">${eventName}</div>
                        <div class="event-category">${eventCategory}</div>
                    </td>
                    <td>${schedule}</td>
                    <td>${location}</td>
                    <td>
                        <div class="sales-text">${ticketText}</div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width: ${progressPct}%;"></div>
                        </div>
                    </td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                `;
                
                tbody.appendChild(tr);
            });
        } else {
            console.error("Gagal mengambil data event:", response.status);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Gagal memuat event.</td></tr>';
        }
    } catch (error) {
        console.error("Error fetching EO events:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Terjadi masalah saat memuat event.</td></tr>';
    }
}

/* ─── Init ─── */
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
	initUploadInteractions();
	interceptSidebarNavigation();
	fetchDashboardEvents();

	// Penanganan Submit Form
	const form = document.getElementById("createEventForm");
	if(form) {
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const title = document.getElementById("eventTitle").value;
			
			console.log('Sending authorized create event request for:', title);
			alert("Berhasil mempublish event: " + title + " (Token akan disertakan di request)");
		});
	}
});
