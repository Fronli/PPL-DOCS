/* ─── DOM Elements ─── */
const userCompanyName = document.getElementById('userCompanyName');
const userAvatar = document.getElementById('userAvatar');

const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const eventsGrid = document.getElementById('eventsGrid');

/* ─── Helpers ─── */
function formatDate(dateStr) {
	if (!dateStr) return "TBA";
	const d = new Date(dateStr);
	const datePart = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric"
	}).format(d);
	
	const timePart = new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).format(d);

	return `${datePart} • ${timePart} WIB`;
}

async function authFetch(url, options = {}) {
	const token = localStorage.getItem("token");
	if (!token) {
		window.location.href = "/auth/login";
		throw new Error("No token found");
	}
	
	const headers = {
		...options.headers,
		"Authorization": `Bearer ${token}`
	};
	
	const res = await fetch(url, { ...options, headers });
	if (res.status === 401 || res.status === 403) {
		localStorage.removeItem("token");
		window.location.href = "/auth/login";
		throw new Error("Unauthorized");
	}
	return res;
}

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
					<div class="user-avatar" style="cursor: pointer;">
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
	if (menu && menu.style.display === "block") {
		menu.style.display = "none";
	}
});

/* ─── Fetch Events ─── */
async function loadEvents() {
	try {
        // Reuse getEOEvent from dashboard timeline
		const res = await authFetch(`/eo/getEOEvent`);
		const data = await res.json();
		populateUI(data);

	} catch (error) {
		console.error("Failed to load events", error);
		loading.textContent = "Error loading your events. Please refresh.";
	}
}

function populateUI(data) {
	loading.style.display = "none";
	
	if (!data || data.length === 0) {
		emptyState.style.display = "block";
		return;
	}

	eventsGrid.style.display = "grid";
	eventsGrid.innerHTML = "";

	data.forEach(ev => {
		const card = document.createElement("div");
		card.className = "event-card";
		
		const posterStyle = ev.posterUrl ? `background-image: url('${ev.posterUrl}');` : '';
		
		card.innerHTML = `
			<div class="card-poster" style="${posterStyle}"></div>
			<div class="card-body">
				<h3 class="card-title">${ev.title}</h3>
				<div class="card-info">
					<div class="info-row">
						<span>📍</span>
						<span>${ev.venue}, ${ev.city}</span>
					</div>
					<div class="info-row">
						<span>📅</span>
						<span>${formatDate(ev.eventDate)}</span>
					</div>
				</div>
                <!-- Redirects to detail manage page or scanner -->
				<div style="display: flex; gap: 10px; margin-top: 10px;">
					<a href="/eo/manageEvent?id=${ev.id}" class="btn-primary" style="flex: 1; text-align: center;">Manage Event</a>
					<a href="/eo/scanner?eventId=${ev.id}" class="btn-primary" style="flex: 1; text-align: center; background-color: var(--success-green, #10B981);">Check-In Ticket</a>
				</div>
			</div>
		`;
		
		eventsGrid.appendChild(card);
	});
}

window.logout = function(e) {
	if(e) e.preventDefault();
	localStorage.removeItem("token");
	localStorage.removeItem("username");
	localStorage.removeItem("role");
	window.location.href = '/auth/login';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
	checkAuth();
	loadEvents();
});
