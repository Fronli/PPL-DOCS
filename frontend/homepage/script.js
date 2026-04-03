/* ─── State ─── */
let events = [];
let nextCursor = null;
let isLoading = false;
let activeCategory = "";
let activeCity = "";

// Cover images fallback
const coverImages = {
	"Music": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=400",
	"Business": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400",
	"Sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400",
	"Technology": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=400",
	"Education": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400",
	"Arts": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=400",
	"Food": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=400",
	"Health": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
	"Entertainment": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400",
	"Community": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=400",
	"Religious": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
	"Exhibition": "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=400",
	"default": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400"
};

/* ─── DOM Refs ─── */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const eventGrid = document.getElementById("eventGrid");
const emptyState = document.getElementById("emptyState");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const loadMoreWrap = document.getElementById("loadMoreWrap");
const filterCategory = document.getElementById("filterCategory");
const filterCity = document.getElementById("filterCity");

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
	if (ev.posterUrl) return ev.posterUrl;
	const cat = (ev.category || "").toLowerCase();
	const title = (ev.title || "").toLowerCase();
	if (cat.includes("music") || title.includes("music") || title.includes("concert")) return coverImages["Music"];
	if (cat.includes("business") || title.includes("business")) return coverImages["Business"];
	if (cat.includes("sport") || title.includes("sport")) return coverImages["Sports"];
	if (cat.includes("tech") || title.includes("tech")) return coverImages["Technology"];
	if (cat.includes("education") || cat.includes("workshop") || title.includes("workshop")) return coverImages["Education"];
	if (cat.includes("arts") || title.includes("art")) return coverImages["Arts"];
	if (cat.includes("food") || title.includes("food") || title.includes("culinary")) return coverImages["Food"];
	if (cat.includes("health") || title.includes("health") || title.includes("wellness")) return coverImages["Health"];
	if (cat.includes("entertainment")) return coverImages["Entertainment"];
	if (cat.includes("community") || title.includes("community")) return coverImages["Community"];
	if (cat.includes("religious")) return coverImages["Religious"];
	if (cat.includes("exhibition") || cat.includes("expo")) return coverImages["Exhibition"];
	return coverImages["default"];
}

/* ─── Fetch Events from API ─── */
async function fetchEvents(cursor = null) {
	if (isLoading) return;
	isLoading = true;
	loadMoreBtn.textContent = "Loading...";
	loadMoreBtn.disabled = true;

	try {
		const params = new URLSearchParams();
		if (cursor) params.set("cursor", cursor);
		if (activeCategory) params.set("category", activeCategory);
		if (activeCity) params.set("city", activeCity);

		const queryStr = params.toString();
		const url = "/event/getEvents" + (queryStr ? `?${queryStr}` : "");

		const response = await fetch(url);
		if (!response.ok) throw new Error(`HTTP ${response.status}`);

		const result = await response.json();
		const newEvents = result.data || [];
		nextCursor = result.nextCursor;

		// Append ke array existing
		events = [...events, ...newEvents];
		renderGrid();

		// Show/hide Load More
		if (nextCursor) {
			loadMoreWrap.style.display = "";
			loadMoreBtn.textContent = "Load More ↓";
			loadMoreBtn.disabled = false;
		} else {
			loadMoreWrap.style.display = "none";
		}
	} catch (error) {
		console.error("Gagal fetch events:", error);
		loadMoreBtn.textContent = "Retry";
		loadMoreBtn.disabled = false;
	} finally {
		isLoading = false;
	}
}

/* Reset dan fetch ulang dari awal (saat filter berubah) */
function resetAndFetch() {
	events = [];
	nextCursor = null;
	eventGrid.innerHTML = "";
	fetchEvents();
}

/* ─── Filter Event Listeners ─── */
filterCategory.addEventListener("change", () => {
	activeCategory = filterCategory.value;
	resetAndFetch();
});

filterCity.addEventListener("change", () => {
	activeCity = filterCity.value;
	resetAndFetch();
});

/* ─── Search (client-side dari events yang sudah di-load) ─── */
function getFilteredEvents() {
	const keyword = searchInput.value.trim().toLowerCase();
	if (!keyword) return events;

	return events.filter((ev) => {
		const haystack = `${ev.title} ${ev.description || ""} ${ev.city || ""} ${ev.venue || ""} ${ev.category || ""}`.toLowerCase();
		return haystack.includes(keyword);
	});
}

searchBtn.addEventListener("click", renderGrid);
searchInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") renderGrid();
});

/* ─── Load More ─── */
loadMoreBtn.addEventListener("click", () => {
	if (nextCursor) fetchEvents(nextCursor);
});

/* ─── Render Event Grid ─── */
function createCard(ev, delay = 0) {
	const card = document.createElement("article");
	card.className = "event-card";
	card.style.animationDelay = `${delay * 60}ms`;

	const coverUrl = getCoverImage(ev);
	const dateStr = ev.eventDate ? formatDate(ev.eventDate) : "TBA";
	const location = ev.venue ? `${ev.venue}, ${ev.city}` : (ev.city || "Online");

	let priceText = "Free";
	if (ev.ticketTypes && ev.ticketTypes.length > 0) {
		priceText = "Start from " + formatPrice(ev.ticketTypes[0].price);
	}

	card.innerHTML = `
		<div class="event-cover" style="background-image: url('${coverUrl}')"></div>
		<div class="event-body">
			<h3 class="event-title">${ev.title}</h3>
			${ev.category ? `<span class="event-category-tag">${ev.category}</span>` : ""}
			<div class="event-details">
				<div class="event-meta">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					<span>${dateStr}</span>
				</div>
				<div class="event-meta">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
						<circle cx="12" cy="10" r="3"></circle>
					</svg>
					<span>${location}</span>
				</div>
			</div>
			<div class="event-price">${priceText}</div>
			<button type="button" class="event-btn">View Event</button>
		</div>
	`;
	return card;
}

function renderGrid() {
	const filtered = getFilteredEvents();
	eventGrid.innerHTML = "";
	filtered.forEach((ev, i) => eventGrid.append(createCard(ev, i)));
	emptyState.hidden = filtered.length > 0;
}

/* ─── Smooth scroll for nav links ─── */
document.querySelectorAll('.main-nav a[href^="#"]').forEach((link) => {
	link.addEventListener("click", (e) => {
		const target = document.querySelector(link.getAttribute("href"));
		if (target) {
			e.preventDefault();
			target.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	});
});

/* ─── Check Auth State ─── */
function checkAuth() {
	const token = localStorage.getItem("token");
	const userStr = localStorage.getItem("username");
	const roleStr = localStorage.getItem("role");
	const topActions = document.querySelector(".top-actions");
	const organizerNavBtn = document.getElementById("organizerNavBtn");
	const bottomOrganizerBtn = document.getElementById("bottomOrganizerBtn");

	if (organizerNavBtn) {
		let role = "USER";
		if (roleStr) {
			try { role = JSON.parse(roleStr); } catch(e) { role = roleStr; }
		}

		if (!token || !userStr) {
			organizerNavBtn.href = "/auth/login";
			if(bottomOrganizerBtn) bottomOrganizerBtn.href = "/auth/login";
		} else if (role === "EO") {
			organizerNavBtn.textContent = "EO Dashboard";
			organizerNavBtn.href = "/eo/dashboard";
			organizerNavBtn.onclick = (e) => window.goToDashboard(e, '/eo/dashboard');
			if(bottomOrganizerBtn) {
				bottomOrganizerBtn.textContent = "Go to Dashboard";
				bottomOrganizerBtn.href = "/eo/dashboard";
				bottomOrganizerBtn.onclick = (e) => window.goToDashboard(e, '/eo/dashboard');
			}
		} else if (role === "ADMIN") {
			organizerNavBtn.textContent = "Admin Dashboard";
			organizerNavBtn.href = "/admin/dashboard";
			organizerNavBtn.onclick = (e) => window.goToDashboard(e, '/admin/dashboard');
			if(bottomOrganizerBtn) {
				bottomOrganizerBtn.textContent = "Go to Dashboard";
				bottomOrganizerBtn.href = "/admin/dashboard";
				bottomOrganizerBtn.onclick = (e) => window.goToDashboard(e, '/admin/dashboard');
			}
		} else {
			organizerNavBtn.href = "#";
			if(bottomOrganizerBtn) bottomOrganizerBtn.href = "#";
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
					<div style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 0.95rem;" onclick="toggleDropdown(event)">
						${userName}
						<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 1L5 5L9 1"/>
						</svg>
						<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white; display: grid; place-items: center; font-size: 1rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
					</div>
					
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 160px; z-index: 100; overflow: hidden;">
						<a href="#" style="display: block; padding: 12px 18px; color: var(--text); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">My Tickets</a>
						<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.9rem; font-weight: 600;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">Logout</a>
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

window.goToDashboard = function(e, url) {
	e.preventDefault();
	const token = localStorage.getItem('token');
	fetch(url, {
		method: 'GET',
		headers: { 'Authorization': `Bearer ${token}` }
	})
	.then(async response => {
		if (!response.ok) {
			window.location.href = `/ui_util/error_page/index.html?code=${response.status}`;
			return;
		}
		const htmlText = await response.text();
		document.open();
		document.write(htmlText);
		document.close();
		window.history.pushState({}, '', url);
	})
	.catch(error => {
		console.error('Error saat mengakses dashboard:', error);
		window.location.href = '/ui_util/error_page/index.html?code=500';
	});
};

window.logout = function(e) {
	if(e) e.preventDefault();
	localStorage.removeItem("token");
	localStorage.removeItem("username");
	localStorage.removeItem("email");
	localStorage.removeItem("role");
	window.location.reload();
}

/* ─── Init ─── */
checkAuth();
fetchEvents();
