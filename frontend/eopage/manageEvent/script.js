/* ─── DOM Elements ─── */
const userCompanyName = document.getElementById('userCompanyName');
const userAvatar = document.getElementById('userAvatar');

const evTitle = document.getElementById('evTitle');
const evDateTime = document.getElementById('evDateTime');
const evLocation = document.getElementById('evLocation');
const evCapacity = document.getElementById('evCapacity');
const evSoldBadge = document.getElementById('evSoldBadge');
const evPoster = document.getElementById('evPoster');

const quotaList = document.getElementById('quotaList');

const salesRevenue = document.getElementById('salesRevenue');
const salesTicketsSold = document.getElementById('salesTicketsSold');
const salesTicketsTotal = document.getElementById('salesTicketsTotal');

const transactionsBody = document.getElementById('transactionsBody');

/* ─── Helpers ─── */
function formatPrice(price) {
	if (price === 0) return "IDR 0.00";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 2
	}).format(price);
}

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

function formatTimeOnly(dateStr) {
	const d = new Date(dateStr);
	return new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true
	}).format(d); // e.g. 10:45 AM
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

/* ─── Fetch Data ─── */
async function loadManageEventData() {
	try {
		const pathParts = window.location.pathname.split('/');
		let eventId = pathParts[pathParts.length - 1];
		
		if (!eventId || isNaN(eventId)) {
			// fallback check - maybe query param?
			const urlParams = new URLSearchParams(window.location.search);
			eventId = urlParams.get('id');
			if(!eventId || isNaN(eventId)){
				alert("Invalid Event ID");
				return;
			}
		}

		const res = await authFetch(`/eo/manageEventData/${eventId}`);
		const data = await res.json();
		populateUI(data);

	} catch (error) {
		console.error("Failed to load manage event data", error);
		if(transactionsBody) {
			transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Error loading data.</td></tr>`;
		}
	}
}

let currentEventId = null;
let quotaDrafts = [];
let originalDescription = "";

function populateUI(data) {
	currentEventId = data.id;
	originalDescription = data.description || "No description provided.";
	
	// Header Card
	evTitle.textContent = data.title;
	evDateTime.textContent = formatDate(data.eventDate);
	evLocation.textContent = data.location;
	evCapacity.textContent = `${new Intl.NumberFormat("id-ID").format(data.totalCapacity)} Seats`;
	
	document.getElementById("eventDescText").textContent = originalDescription;
	document.getElementById("eventDescEditor").value = originalDescription;

	if (data.posterUrl) {
		evPoster.style.backgroundImage = `url('${data.posterUrl}')`;
	}

	const soldPercent = data.totalCapacity > 0 ? (data.totalTicketsSold / data.totalCapacity) * 100 : 0;
	evSoldBadge.textContent = `${Math.round(soldPercent)}% Sold`;

	// Ticket Quota
	quotaList.innerHTML = "";
	quotaDrafts = [];
	if (data.ticketQuota && data.ticketQuota.length > 0) {
		data.ticketQuota.forEach((q, index) => {
			quotaDrafts.push({ id: q.id, left: q.left });
			
			const item = document.createElement("div");
			item.className = "quota-item";
			item.innerHTML = `
				<span class="quota-item-name">${q.name}</span>
				<div class="quota-controls">
					<button class="btn-quota" onclick="changeQuota(${index}, -1)" ${q.left <= 0 ? 'disabled' : ''}>-</button>
					<span class="quota-count" id="quotaVal_${index}">${q.left}</span>
					<button class="btn-quota" onclick="changeQuota(${index}, 1)">+</button>
				</div>
			`;
			quotaList.appendChild(item);
		});
	} else {
		quotaList.innerHTML = "<div class='quota-item'>No ticket types defined</div>";
	}

	// Sales Overview
	salesRevenue.textContent = formatPrice(data.estimatedRevenue);
	salesTicketsSold.textContent = new Intl.NumberFormat("id-ID").format(data.totalTicketsSold);
	salesTicketsTotal.textContent = `/ ${new Intl.NumberFormat("id-ID").format(data.totalCapacity)}`;

	// Transactions
	transactionsBody.innerHTML = "";
	if (data.transactions && data.transactions.length > 0) {
		data.transactions.forEach(tx => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td class="txt-brand">${tx.transaction}</td>
				<td>${tx.customer}</td>
				<td><b>${tx.type}</b></td>
				<td>${tx.qty}</td>
				<td style="font-weight: 800;">${formatPrice(tx.amount)}</td>
				<td><span class="status-badge">${tx.status}</span></td>
				<td style="text-align: right; color: var(--text-muted); font-weight: 500;">${formatTimeOnly(tx.timestamp)}</td>
			`;
			transactionsBody.appendChild(tr);
		});
	} else {
		transactionsBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No transactions found.</td></tr>`;
	}
}

window.changeQuota = function(index, delta) {
	let current = quotaDrafts[index].left;
	let next = current + delta;
	if (next < 0) return; // Prevent negative limits

	quotaDrafts[index].left = next;
	
	document.getElementById(`quotaVal_${index}`).textContent = next;
	const minusBtn = document.querySelectorAll('#quotaList .quota-controls')[index].querySelectorAll('button')[0];
	minusBtn.disabled = next <= 0;

	document.getElementById("saveQuotaFooter").style.display = "block";
};

window.saveEventQuotas = async function() {
	if(!currentEventId) return;
	const btn = document.querySelector("#saveQuotaFooter button");
	const origText = btn.textContent;
	btn.textContent = "Saving...";
	btn.disabled = true;

	try {
		const res = await authFetch(`/eo/updateEventQuota/${currentEventId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ quotas: quotaDrafts })
		});
		if (res.ok) {
			showToast("Quotas updated successfully!", "success");
			document.getElementById("saveQuotaFooter").style.display = "none";
			loadManageEventData(); // Refresh to recalculate
		} else {
			const err = await res.json();
			showToast("Error: " + err.message, "error");
		}
	} catch(e) {
		console.error(e);
		showToast("System error communicating with server", "error");
	} finally {
		btn.textContent = origText;
		btn.disabled = false;
	}
};

window.toggleEditDetails = function() {
	document.getElementById("eventDescText").style.display = "none";
	document.getElementById("btnEditDetails").style.display = "none";
	
	document.getElementById("editDetailsArea").style.display = "block";
	document.getElementById("btnSaveDetails").style.display = "block";
};

window.saveEventDetails = async function() {
	if(!currentEventId) return;

	const newVal = document.getElementById("eventDescEditor").value;
	const btn = document.getElementById("btnSaveDetails");
	const origText = btn.textContent;
	btn.textContent = "Saving...";
	btn.disabled = true;

	try {
		const res = await authFetch(`/eo/updateEventDetails/${currentEventId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ description: newVal })
		});
		if (res.ok) {
			showToast("Event details updated successfully!");
			document.getElementById("eventDescText").textContent = newVal;
			originalDescription = newVal;

			document.getElementById("eventDescText").style.display = "block";
			document.getElementById("btnEditDetails").style.display = "block";
			document.getElementById("editDetailsArea").style.display = "none";
			document.getElementById("btnSaveDetails").style.display = "none";
		} else {
			const err = await res.json();
			showToast("Error: " + err.message, "error");
		}
	} catch(e) {
		console.error(e);
		showToast("System error communicating with server", "error");
	} finally {
		btn.textContent = origText;
		btn.disabled = false;
	}
};

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
	loadManageEventData();
});

window.showToast = function(message, type = "success") {
	let container = document.getElementById("toast-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "toast-container";
		Object.assign(container.style, {
			position: "fixed", top: "24px", right: "24px", zIndex: "9999",
			display: "flex", flexDirection: "column", gap: "12px"
		});
		document.body.appendChild(container);
	}

	const toast = document.createElement("div");
	const bgColor = type === "success" ? "#10B981" : "#EF4444";
	Object.assign(toast.style, {
		background: bgColor, color: "white", padding: "16px 24px",
		borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
		display: "flex", alignItems: "center", gap: "12px",
		transform: "translateX(120%)", opacity: "0", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
		fontWeight: "600", fontSize: "0.9rem", fontFamily: "inherit"
	});
	
	let iconSvg = type === "success" 
		? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
		: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
	
	toast.innerHTML = `${iconSvg} <span>${message}</span>`;
	container.appendChild(toast);

	requestAnimationFrame(() => {
		toast.style.transform = "translateX(0)";
		toast.style.opacity = "1";
	});

	setTimeout(() => {
		toast.style.transform = "translateX(120%)";
		toast.style.opacity = "0";
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}
