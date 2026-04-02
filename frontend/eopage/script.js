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
				<div style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 0.85rem;" onclick="toggleDropdown(event)">
					${userName}'s Profile
					<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 2px;">
						<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e0e0; margin-left: 6px;"></div>
				</div>
				
				<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 150px; z-index: 100; overflow: hidden;">
					<a href="/" style="display: block; padding: 12px 18px; color: var(--text); text-decoration: none; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid var(--line); background: #fff;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">Marketplace</a>
					<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.85rem; font-weight: 700; background: #fff;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">Logout</a>
				</div>
			</div>
		`;
	} else {
        // Redireksi ke login jika tidak ada akses
        window.location.href = "/loginpage/index.html"; // Sesuaikan rute di backend
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
		<h3 style="margin: 0 0 12px; font-size: 1.25rem; font-weight: 700; color: var(--text);">Konfirmasi Logout</h3>
		<p style="margin: 0 0 28px; color: var(--muted); font-size: 0.95rem; line-height: 1.5;">Apakah Anda yakin ingin keluar dari sisi Event Organizer?</p>
		<div style="display: flex; gap: 12px; justify-content: center;">
			<button class="btn-cancel" style="padding: 12px 20px; border: 1px solid var(--line); background: white; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--text); flex: 1; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">Batal</button>
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

/* ─── Event Data Dummy ─── */
const dummyEvents = [
    {
        date: "21/04/26",
        location: "Jakarta Convention Center",
        sales: "850 / 1000",
        status: "ACTIVE"
    },
    {
        date: "05/05/26",
        location: "Bandung, Braga",
        sales: "125 / 500",
        status: "ACTIVE"
    },
    {
        date: "14/08/26",
        location: "Bali, Garuda Wisnu",
        sales: "0 / 2500",
        status: "DRAFT"
    }
];

function renderEvents() {
    const tableBody = document.getElementById("eventsTableBody");
    const emptyState = document.getElementById("emptyState");

    tableBody.innerHTML = "";

    if (dummyEvents.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    dummyEvents.forEach(ev => {
        const row = document.createElement("tr");
        const statusClass = ev.status.toLowerCase();
        
        row.innerHTML = `
            <td>${ev.date}</td>
            <td style="color: var(--muted);">${ev.location}</td>
            <td style="font-family: 'Sora', sans-serif;">${ev.sales}</td>
            <td>
                <span class="status-badge ${statusClass}">${ev.status}</span>
            </td>
            <td class="actions-col">
                <a class="action-link" onclick="alert('Navigasi ke Edit')">Edit</a>
                <a class="action-link" onclick="alert('Navigasi ke View Sales')">View Sales</a>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Dummy Metrics update
    document.querySelectorAll(".metric-value")[0].textContent = "975";
    document.querySelectorAll(".metric-value")[1].textContent = "2";
    document.querySelectorAll(".metric-value")[2].textContent = "78%";
}

/* ─── Init ─── */
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    renderEvents();

    // Bind sidebar placeholders
    document.querySelectorAll('.nav-item.disabled, .side-nav .nav-item:not(.active)').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            alert("Fitur masih dalam tahap pengembangan.");
        });
    });

    document.querySelector('.btn-create-event').addEventListener('click', (e) => {
        e.preventDefault();
        alert("Navigasi ke form Create New Event.");
    });
});
