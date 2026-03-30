/* ─── Event Data ─── */
const events = [
	{
		title: "Java Jazz Night 2026",
		category: "Music",
		location: "Jakarta",
		date: "2026-03-21",
		price: "Mulai Rp150.000",
		accent: "#f59e0b",
		featured: 10,
		desc: "Malam penuh jazz terbaik dengan musisi internasional dan lokal."
	},
	{
		title: "Creative Brand Summit",
		category: "Business",
		location: "Bandung",
		date: "2026-03-25",
		price: "Mulai Rp325.000",
		accent: "#0f766e",
		featured: 9,
		desc: "Summit kreatif untuk brand builder dan digital marketer."
	},
	{
		title: "Workshop UI Motion",
		category: "Workshop",
		location: "Yogyakarta",
		date: "2026-03-28",
		price: "Mulai Rp120.000",
		accent: "#0ea5e9",
		featured: 7,
		desc: "Belajar micro-interaction dan motion design untuk UI modern."
	},
	{
		title: "Startup Funding Forum",
		category: "Business",
		location: "Surabaya",
		date: "2026-04-04",
		price: "Mulai Rp280.000",
		accent: "#2563eb",
		featured: 8,
		desc: "Forum pendanaan untuk startup tahap awal bertemu investor."
	},
	{
		title: "Sunset Beach Festival",
		category: "Music",
		location: "Bali",
		date: "2026-04-12",
		price: "Mulai Rp450.000",
		accent: "#f97316",
		featured: 6,
		desc: "Festival musik pantai dengan sunset view yang menakjubkan."
	},
	{
		title: "Foodpreneur Class",
		category: "Workshop",
		location: "Jakarta",
		date: "2026-04-18",
		price: "Mulai Rp95.000",
		accent: "#16a34a",
		featured: 5,
		desc: "Kelas wirausaha kuliner dari chef dan pengusaha sukses."
	},
	{
		title: "Future of AI Conference",
		category: "Business",
		location: "Jakarta",
		date: "2026-05-02",
		price: "Mulai Rp500.000",
		accent: "#0891b2",
		featured: 10,
		desc: "Konferensi AI terbesar, membahas tren dan peluang masa depan."
	},
	{
		title: "Indie Music Showcase",
		category: "Music",
		location: "Bandung",
		date: "2026-05-10",
		price: "Mulai Rp135.000",
		accent: "#dc2626",
		featured: 6,
		desc: "Panggung untuk musisi indie unjuk karya di depan ribuan penonton."
	},
	{
		title: "Photography Masterclass",
		category: "Workshop",
		location: "Surabaya",
		date: "2026-05-16",
		price: "Mulai Rp180.000",
		accent: "#7c3aed",
		featured: 7,
		desc: "Masterclass fotografi dengan fotografer profesional ternama."
	}
];

/* ─── DOM Refs ─── */
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const searchBtn = document.getElementById("searchBtn");
const carouselTrack = document.getElementById("carouselTrack");
const carouselPrev = document.getElementById("carouselPrev");
const carouselNext = document.getElementById("carouselNext");
const chipRow = document.getElementById("chipRow");
const eventGrid = document.getElementById("eventGrid");
const emptyState = document.getElementById("emptyState");
const tabs = document.querySelectorAll(".tab");

/* ─── State ─── */
let activeCategory = "all";
let activeTab = "top";

/* ─── Helpers ─── */
function formatDate(dateStr) {
	return new Intl.DateTimeFormat("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	}).format(new Date(dateStr));
}

/* ─── Populate Location Dropdown ─── */
const locations = [...new Set(events.map((e) => e.location))];
locations.forEach((loc) => {
	const opt = document.createElement("option");
	opt.value = loc;
	opt.textContent = loc;
	locationFilter.append(opt);
});

/* ─── Carousel (Event News) ─── */
function buildCarousel() {
	// Show top-featured events in the carousel
	const featured = [...events].sort((a, b) => b.featured - a.featured).slice(0, 6);
	carouselTrack.innerHTML = "";

	featured.forEach((ev) => {
		const card = document.createElement("div");
		card.className = "news-card";
		card.style.setProperty("--card-accent", ev.accent);
		card.innerHTML = `
			<div class="news-thumb"></div>
			<div class="news-body">
				<h3>${ev.title}</h3>
				<p>${ev.desc}</p>
				<a class="news-link" href="#">Lihat Detail</a>
			</div>
		`;
		carouselTrack.append(card);
	});
}

carouselPrev.addEventListener("click", () => {
	carouselTrack.scrollBy({ left: -320, behavior: "smooth" });
});

carouselNext.addEventListener("click", () => {
	carouselTrack.scrollBy({ left: 320, behavior: "smooth" });
});

/* ─── Category Chips ─── */
function buildChips() {
	const categories = [...new Set(events.map((e) => e.category))];
	chipRow.innerHTML = "";

	// "All Categories" chip
	const allChip = document.createElement("button");
	allChip.className = "chip active";
	allChip.type = "button";
	allChip.dataset.category = "all";
	allChip.textContent = "All Categories";
	chipRow.append(allChip);

	categories.forEach((cat) => {
		const chip = document.createElement("button");
		chip.className = "chip";
		chip.type = "button";
		chip.dataset.category = cat;
		chip.textContent = cat;
		chipRow.append(chip);
	});

	// Click handler
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
	const loc = locationFilter.value;

	return events.filter((ev) => {
		const haystack = `${ev.title} ${ev.category} ${ev.location}`.toLowerCase();
		const byKeyword = !keyword || haystack.includes(keyword);
		const byLocation = loc === "all" || ev.location === loc;
		const byCategory = activeCategory === "all" || ev.category === activeCategory;
		return byKeyword && byLocation && byCategory;
	});
}

searchBtn.addEventListener("click", renderGrid);
searchInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") renderGrid();
});

/* ─── Render Event Grid ─── */
function createCard(ev, delay) {
	const card = document.createElement("article");
	card.className = "event-card";
	card.style.setProperty("--card-accent", ev.accent);
	card.style.animationDelay = `${delay * 60}ms`;
	card.innerHTML = `
		<div class="event-cover">
			<span class="category-tag">${ev.category}</span>
		</div>
		<div class="event-body">
			<h3 class="event-title">${ev.title}</h3>
			<p class="event-meta">${formatDate(ev.date)}</p>
			<p class="event-location">${ev.location}</p>
			<div class="event-footer">
				<span class="price">${ev.price}</span>
				<button type="button" class="event-btn">View Event</button>
			</div>
		</div>
	`;
	return card;
}

function renderGrid() {
	const filtered = getFilteredEvents();
	eventGrid.innerHTML = "";

	if (activeTab === "top") {
		// Sort by featured score desc
		const sorted = [...filtered].sort((a, b) => b.featured - a.featured);
		sorted.forEach((ev, i) => eventGrid.append(createCard(ev, i)));
	} else {
		// Group by category
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
	const topActions = document.querySelector(".top-actions");

	if (token && userStr && topActions) {
		let userName = "User";
		try {
			const parsed = JSON.parse(userStr);
			// Karena di localstorage isinya langsung string nama ("Fronli"), kita tangkap string-nya
			userName = typeof parsed === "string" ? parsed : (parsed.name || "User");
		} catch (e) {
            // Jaga-jaga kalau stringnya tidak menggunakan JSON.stringify()
            userName = userStr;
        }

		// Gunakan inline styling menyesuaikan screenshot 
		topActions.innerHTML = `
			<div style="display: flex; align-items: center; gap: 24px;">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; color: var(--text);">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<div style="position: relative;" id="userProfileWrap">
					<div style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text); font-weight: 700; font-size: 0.85rem;" onclick="toggleDropdown(event)">
						${userName}'s Profile
						<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 2px;">
							<path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e0e0; margin-left: 6px;"></div>
					</div>
					
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 150px; z-index: 100; overflow: hidden;">
						<a href="#" style="display: block; padding: 12px 18px; color: var(--text); text-decoration: none; font-size: 0.85rem; font-weight: 700; border-bottom: 1px solid var(--line); background: #fff;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='#fff'">My Ticket</a>
						<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.85rem; font-weight: 700; background: #fff;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='#fff'">Logout</a>
					</div>
				</div>
			</div>
		`;
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
		<p style="margin: 0 0 28px; color: var(--muted); font-size: 0.95rem; line-height: 1.5;">Apakah Anda yakin ingin keluar dari sesi saat ini?</p>
		<div style="display: flex; gap: 12px; justify-content: center;">
			<button id="cancel-logout" style="padding: 12px 20px; border: 1px solid var(--line); background: white; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--text); flex: 1; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">Batal</button>
			<button id="confirm-logout" style="padding: 12px 20px; border: none; background: #ef4444; border-radius: 10px; cursor: pointer; font-family: inherit; font-size: 0.95rem; font-weight: 600; color: white; flex: 1; transition: background 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">Ya, Keluar</button>
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

	document.getElementById("cancel-logout").addEventListener("click", close);
	document.getElementById("confirm-logout").addEventListener("click", () => {
		localStorage.removeItem("token");
		localStorage.removeItem("username");
		localStorage.removeItem("email");
		localStorage.removeItem("role");
		window.location.reload();
	});
}

/* ─── Init ─── */
buildCarousel();
buildChips();
renderGrid();
checkAuth();
