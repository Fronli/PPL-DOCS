/* ─── State ─── */
let events = [];
let nextCursor = null;
let isLoading = false;
let searchQuery = "";

// Default poster
const DEFAULT_POSTER = "/images/event/image_poster.jpg";

/* ─── DOM Refs ─── */
const searchInputPage = document.getElementById("searchInputPage");
const searchForm = document.getElementById("searchForm");
const eventGrid = document.getElementById("eventGrid");
const emptyState = document.getElementById("emptyState");
const emptyStateImg = document.getElementById("emptyStateImg");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const resultCountBadge = document.getElementById("resultCountBadge");

/* ─── Helpers ─── */
function formatDate(dateStr) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric"
	}).format(new Date(dateStr));
}

function formatPrice(price) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0
	}).format(price);
}

function getCoverImage(ev) {
	return ev.posterUrl || DEFAULT_POSTER;
}

/* ─── Fetch Events from API ─── */
async function fetchEvents(cursor = null, isFresh = false) {
	if (isLoading) return;
	isLoading = true;
	
	if (isFresh) {
		events = [];
		eventGrid.innerHTML = "";
		nextCursor = null;
	}

	loadMoreBtn.textContent = "Loading...";
	loadMoreBtn.disabled = true;

	try {
		const params = new URLSearchParams();
		if (cursor) params.set("cursor", cursor);
		if (searchQuery) params.set("search", searchQuery);

		const queryStr = params.toString();
		const url = "/event/getEvents" + (queryStr ? `?${queryStr}` : "");

		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const result = await response.json();
		const newEvents = result.data || [];
		
		events = [...events, ...newEvents];
		nextCursor = result.nextCursor;

		renderGrid();
		resultCountBadge.textContent = events.length;

		// Empty State vs Grid
		if (events.length === 0) {
			eventGrid.style.display = "none";
			emptyState.style.display = "block";
			// Provide our AI generated image!
			emptyStateImg.src = "/images/empty_state.png"; 
		} else {
			eventGrid.style.display = "grid";
			emptyState.style.display = "none";
		}

		// Show/hide Load More
		if (nextCursor && events.length > 0) {
			loadMoreWrap.style.display = "block";
			loadMoreBtn.textContent = "Load More ↓";
			loadMoreBtn.disabled = false;
		} else {
			loadMoreWrap.style.display = "none";
		}

	} catch (error) {
		console.error("Gagal fetch events:", error);
		if (events.length > 0) {
			loadMoreBtn.textContent = "Retry";
			loadMoreBtn.disabled = false;
		}
	} finally {
		isLoading = false;
	}
}

/* ─── Render Event Grid ─── */
function renderGrid() {
	eventGrid.innerHTML = "";
	
	events.forEach((ev, i) => {
		const card = document.createElement("article");
		card.className = "event-card";
		
		const coverUrl = getCoverImage(ev);
		const dateStr = ev.eventDate ? formatDate(ev.eventDate) : "TBA";
		const location = ev.venue ? `${ev.venue}, ${ev.city}` : (ev.city || "Online");

		let priceText = "Free";
		if (ev.ticketTypes && ev.ticketTypes.length > 0) {
			priceText = formatPrice(ev.ticketTypes[0].price);
		}

		card.innerHTML = `
			<div class="event-cover" style="background-image: url('${coverUrl}')"></div>
			<div class="event-body">
				<h3 class="event-title">${ev.title}</h3>
				${ev.category ? `<span class="event-category-tag" style="background:#e0e7ff; color:#3730a3; font-size:0.75rem; padding:4px 8px; border-radius:4px; display:inline-block; margin-bottom:12px; font-weight:600;">${ev.category}</span>` : ""}
				<div class="event-meta-line">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
					${dateStr}
				</div>
				<div class="event-meta-line">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
					${location}
				</div>
				${(ev.ticketTypes && ev.ticketTypes.length > 0) ? `<div class="event-meta-line" style="margin-top:auto; font-weight:700; color:var(--brand);">${priceText}</div>` : ''}
				<a href="/event-detail/${ev.id}" class="btn-details">View Details</a>
			</div>
		`;
		eventGrid.appendChild(card);
	});
}

/* ─── Search Form Override ─── */
searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const q = searchInputPage.value.trim();
	// Replace URL silently to keep shareable links stateful
	const newUrl = window.location.pathname + "?q=" + encodeURIComponent(q);
	window.history.pushState({path: newUrl}, '', newUrl);
	
	searchQuery = q;
	fetchEvents(null, true);
});

/* ─── Load More ─── */
loadMoreBtn.addEventListener("click", () => {
	if (nextCursor) fetchEvents(nextCursor, false);
});

/* ─── Auth Checking ─── */
function checkAuth() {
	const token = localStorage.getItem("token");
	const userStr = localStorage.getItem("username");
	const roleStr = localStorage.getItem("role");
	const topActions = document.getElementById("topActions");
	const organizerNavBtn = document.getElementById("organizerNavBtn");

	if (organizerNavBtn) {
		let role = "USER";
		if (roleStr) {
			try { role = JSON.parse(roleStr); } catch(e) { role = roleStr; }
		}
		if (!token || !userStr) {
			organizerNavBtn.href = "/auth/login";
		} else if (role === "EO") {
			organizerNavBtn.textContent = "EO Dashboard";
			organizerNavBtn.href = "/eo/dashboard";
		} else if (role === "ADMIN") {
			organizerNavBtn.textContent = "Admin Dashboard";
			organizerNavBtn.href = "/admin/dashboard";
		}
	}

	if (token && userStr && topActions) {
		let userName = "User";
		try {
			const parsed = JSON.parse(userStr);
			userName = typeof parsed === "string" ? parsed : (parsed.name || "User");
		} catch (e) {
			userName = userStr;
		}

		topActions.innerHTML = `
			<div style="display: flex; align-items: center; gap: 24px;">
				<div style="position: relative;" id="userProfileWrap">
					<div style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: 700; font-size: 0.95rem;" onclick="toggleDropdown(event)">
						${userName}
						<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1L5 5L9 1"/></svg>
						<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white; display: grid; place-items: center; font-size: 1rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
					</div>
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 160px; z-index: 100; overflow: hidden;">
						<a href="/my-tickets" style="display: block; padding: 12px 18px; color: var(--text-main); font-size: 0.9rem; font-weight: 600; text-decoration:none;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">My Tickets</a>
						<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; font-size: 0.9rem; font-weight: 600; text-decoration:none;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">Logout</a>
					</div>
				</div>
			</div>
		`;
	}
}

window.toggleDropdown = function(e) {
	e.stopPropagation();
	const menu = document.getElementById("userDropdown");
	if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}
document.addEventListener("click", () => {
	const menu = document.getElementById("userDropdown");
	if (menu) menu.style.display = "none";
});
window.logout = function(e) {
	if(e) e.preventDefault();
	localStorage.removeItem("token");
	localStorage.removeItem("username");
	localStorage.removeItem("email");
	localStorage.removeItem("role");
	window.location.reload();
}

/* ─── Initialization ─── */
document.addEventListener('DOMContentLoaded', () => {
	checkAuth();

	// Read initial query from URL
	const urlParams = new URLSearchParams(window.location.search);
	const initialQ = urlParams.get('q');
	
	if (initialQ) {
		searchQuery = initialQ;
		searchInputPage.value = initialQ;
	}
	
	fetchEvents(null, true);
});
