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

/* ─── Init ─── */
buildCarousel();
buildChips();
renderGrid();
