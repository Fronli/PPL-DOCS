/* ─── Event Data ─── */
const events = [
	{
		title: "Djakarta Warehouse Project (DWP)",
		category: "Music & Concerts",
		location: "Jakarta",
		date: "2026-12-12",
		price: "Start from Rp1.500.000",
		featured: 10,
	},
	{
		title: "Prambanan Jazz Festival",
		category: "Music & Concerts",
		location: "Yogyakarta",
		date: "2026-11-05",
		price: "Start from Rp750.000",
		featured: 9,
	},
	{
		title: "Leadership Masterclass",
		category: "Business",
		location: "Online",
		date: "2026-11-10",
		price: "Start from Rp500.000",
		featured: 8,
	},
	{
		title: "BaliSpirit Festival",
		category: "Sports",
		location: "Bali",
		date: "2026-12-02",
		price: "Start from Rp1.200.000",
		featured: 7,
	},
	{
		title: "Indonesia AI & Tech Conference",
		category: "Technology",
		location: "Jakarta",
		date: "2026-12-10",
		price: "Start from Rp800.000",
		featured: 6,
	},
	{
		title: "Dieng Culture Festival",
		category: "Music & Concerts",
		location: "Wonosobo",
		date: "2026-10-15",
		price: "Start from Rp400.000",
		featured: 5,
	},
	{
		title: "Bandung Music Run Festival",
		category: "Sports",
		location: "Bandung",
		date: "2027-01-15",
		price: "Start from Rp300.000",
		featured: 4,
	},
	{
		title: "Indonesia Comic Con",
		category: "Technology",
		location: "Jakarta",
		date: "2027-01-22",
		price: "Start from Rp250.000",
		featured: 11,
	}
];

// Cover images placeholders based on category for better visual
const coverImages = {
	"Music & Concerts": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=400",
	"Business": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400",
	"Sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=400",
	"Technology": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=400",
	"Workshop": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400"
};

/* ─── DOM Refs ─── */
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const chipRow = document.getElementById("chipRow");
const eventGrid = document.getElementById("eventGrid");
const emptyState = document.getElementById("emptyState");
const tabs = document.querySelectorAll(".tab");

/* ─── State ─── */
let activeCategory = "all";
let activeTab = "top";

/* ─── Helpers ─── */
function formatDate(dateStr) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric"
	}).format(new Date(dateStr));
}

/* ─── Category Chips ─── */
function buildChips() {
	const predefinedCategories = ["Music & Concerts", "Technology", "Business", "Sports", "Workshop"];
	chipRow.innerHTML = "";

	const allChip = document.createElement("button");
	allChip.className = "chip active";
	allChip.type = "button";
	allChip.dataset.category = "all";
	allChip.textContent = "All Categories";
	chipRow.append(allChip);

	predefinedCategories.forEach((cat) => {
		const chip = document.createElement("button");
		chip.className = "chip";
		chip.type = "button";
		chip.dataset.category = cat;
		chip.textContent = cat;
		chipRow.append(chip);
	});

	chipRow.addEventListener("click", (e) => {
		const btn = e.target.closest(".chip");
		if (!btn) return;
		activeCategory = btn.dataset.category;
		chipRow.querySelectorAll(".chip").forEach((c) =>
			c.classList.toggle("active", c.dataset.category === activeCategory)
		);
		renderGrid();
	});
}

/* ─── Tab Switching ─── */
tabs.forEach((tab) => {
	tab.addEventListener("click", () => {
		activeTab = tab.dataset.tab;
		tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === activeTab));
		renderGrid();
	});
});

/* ─── Search ─── */
function getFilteredEvents() {
	const keyword = searchInput.value.trim().toLowerCase();

	return events.filter((ev) => {
		const haystack = `${ev.title} ${ev.category} ${ev.location}`.toLowerCase();
		const byKeyword = !keyword || haystack.includes(keyword);
		const byCategory = activeCategory === "all" || ev.category === activeCategory;
		return byKeyword && byCategory;
	});
}

searchBtn.addEventListener("click", renderGrid);
searchInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") renderGrid();
});

/* ─── Render Event Grid ─── */
function createCard(ev, delay = 0) {
	const card = document.createElement("article");
	card.className = "event-card";
	card.style.animationDelay = `${delay * 60}ms`;
	
	const coverUrl = coverImages[ev.category] || coverImages["Music & Concerts"];

	card.innerHTML = `
		<div class="event-cover" style="background-image: url('${coverUrl}')"></div>
		<div class="event-body">
			<h3 class="event-title">${ev.title}</h3>
			<div class="event-details">
				<div class="event-meta">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="16" y1="2" x2="16" y2="6"></line>
						<line x1="8" y1="2" x2="8" y2="6"></line>
						<line x1="3" y1="10" x2="21" y2="10"></line>
					</svg>
					<span>${formatDate(ev.date)}</span>
				</div>
				<div class="event-meta">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
						<circle cx="12" cy="10" r="3"></circle>
					</svg>
					<span>${ev.location}</span>
				</div>
			</div>
			<button type="button" class="event-btn">View Event</button>
		</div>
	`;
	return card;
}

function renderGrid() {
	const filtered = getFilteredEvents();
	eventGrid.innerHTML = "";

	if (activeTab === "top") {
		const sorted = [...filtered].sort((a, b) => b.featured - a.featured);
		sorted.forEach((ev, i) => eventGrid.append(createCard(ev, i)));
	} else {
		const grouped = {};
		filtered.forEach((ev) => {
			if (!grouped[ev.category]) grouped[ev.category] = [];
			grouped[ev.category].push(ev);
		});

		let idx = 0;
		Object.keys(grouped)
			.sort()
			.forEach((cat) => {
				const heading = document.createElement("h3");
				heading.className = "category-group-title";
				heading.textContent = cat;
				eventGrid.append(heading);

				grouped[cat].forEach((ev) => {
					eventGrid.append(createCard(ev, idx++));
				});
			});
	}

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
			alert('Akses ditolak atau token tidak valid.');
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
		alert('Gagal mengakses server.');
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
buildChips();
renderGrid();
checkAuth();
