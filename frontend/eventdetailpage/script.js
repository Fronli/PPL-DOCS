/* ─── DOM Elements ─── */
const heroBanner = document.getElementById('heroBanner');
const heroCategory = document.getElementById('heroCategory');
const heroTitle = document.getElementById('heroTitle');
const heroDate = document.getElementById('heroDate');
const heroLocation = document.getElementById('heroLocation');

const infoTime = document.getElementById('infoTime');
const infoLocationCard = document.getElementById('infoLocationCard');
const infoPricing = document.getElementById('infoPricing');

const organizerInitial = document.getElementById('organizerInitial');
const organizerName = document.getElementById('organizerName');

const aboutContent = document.getElementById('aboutContent');
const ticketList = document.getElementById('ticketList');

/* ─── Helpers ─── */
function formatDate(dateStr) {
	if (!dateStr) return "TBA";
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric"
	}).format(new Date(dateStr));
}

function formatTime(dateStr) {
	if (!dateStr) return "";
	return new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).format(new Date(dateStr)) + " WIB"; // Assume WIB for demo
}

function formatPrice(price) {
	if (price === 0) return "Free";
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0
	}).format(price);
}

function getCoverImage(ev) {
	return ev.posterUrl || "/images/event/image_poster.jpg";
}

/* ─── Fetch Event Details ─── */
async function fetchEventDetail() {
	// Extract ID from URL path (e.g. /event-detail/1)
	const pathParts = window.location.pathname.split('/');
	const eventId = pathParts[pathParts.length - 1];

	if (!eventId || isNaN(eventId)) {
		alert("Invalid Event ID");
		return;
	}

	try {
		const response = await fetch(`/event/getEventById/${eventId}`);
		if (!response.ok) {
			if (response.status === 404) {
				alert("Event not found");
			} else {
				throw new Error("Failed to fetch event details");
			}
			return;
		}

		const ev = await response.json();
		renderEventDetails(ev);
	} catch (error) {
		console.error(error);
		alert("An error occurred while loading the event");
	}
}

function renderEventDetails(ev) {
	// Hero
	heroBanner.style.backgroundImage = `url('${getCoverImage(ev)}')`;
	heroCategory.textContent = ev.category || "General";
	heroTitle.textContent = ev.title || "Untitled Event";
	
	const dateStr = formatDate(ev.eventDate);
	const timeStr = formatTime(ev.eventDate);
	const locationStr = ev.venue ? `${ev.venue}, ${ev.city}` : (ev.city || "Event Location TBA");

	heroDate.textContent = dateStr;
	heroLocation.textContent = locationStr;

	// Info Cards
	if (ev.eventDate) {
		infoTime.textContent = timeStr ? `${timeStr}` : dateStr;
	} else {
		infoTime.textContent = "TBA";
	}
	
	infoLocationCard.textContent = locationStr;

	// Calculate Pricing Range
	let minPrice = 0, maxPrice = 0;
	if (ev.ticketTypes && ev.ticketTypes.length > 0) {
		// they are ordered asc by backend
		const prices = ev.ticketTypes.map(t => t.price);
		minPrice = Math.min(...prices);
		maxPrice = Math.max(...prices);
	}
	
	if (minPrice === 0 && maxPrice === 0) {
		infoPricing.textContent = "Free";
	} else if (minPrice === maxPrice) {
		infoPricing.textContent = formatPrice(minPrice);
	} else {
		infoPricing.textContent = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
	}

	// Organizer
	const orgName = ev.organizer?.name || "Unknown Organizer";
	organizerName.textContent = orgName;
	organizerInitial.textContent = orgName.substring(0, 2).toUpperCase();

	// About
	if (ev.description) {
		// Split by newline and wrap in p tags safely
		aboutContent.innerHTML = ev.description
			.split('\n')
			.filter(p => p.trim() !== '')
			.map(p => {
				const pEl = document.createElement('p');
				pEl.textContent = p;
				return pEl.outerHTML;
			})
			.join('');
	} else {
		aboutContent.innerHTML = '<p>No description provided for this event.</p>';
	}

	// Tickets
	renderTickets(ev.ticketTypes, ev.id);
}

function renderTickets(tickets, eventId) {
	ticketList.innerHTML = "";

	if (!tickets || tickets.length === 0) {
		ticketList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No tickets available yet.</div>';
		return;
	}

	tickets.forEach(ticket => {
		const item = document.createElement('div');
		item.className = 'ticket-item';
		
		// Style highlight logic (e.g. VIP+ or highest ticket gets orange button)
		let nameLower = ticket.name.toLowerCase();
		if (nameLower.includes("platinum") || nameLower.includes("+")) {
			item.classList.add('highlight-btn');
		}

		let badgeHtml = "";
		if (ticket.quota <= 0) {
			badgeHtml = `<span class="ticket-badge danger">Sold Out</span>`;
		} else if (ticket.quota < 20) {
			badgeHtml = `<span class="ticket-badge warning">Only ${ticket.quota} seats left!</span>`;
		} else {
			badgeHtml = `<span class="ticket-badge success">Available</span>`;
		}

		item.innerHTML = `
			<div class="ticket-top">
				<div class="ticket-name">${ticket.name}</div>
				<div class="ticket-price">${formatPrice(ticket.price)}</div>
			</div>
			${badgeHtml}
			<button type="button" ${ticket.quota <= 0 ? 'disabled style="background: #cbd5e1; cursor: not-allowed;"' : ''}>
				${ticket.quota <= 0 ? 'Sold Out' : 'Buy Ticket'}
			</button>
		`;
		
		item.querySelector('button').addEventListener('click', () => {
			const token = localStorage.getItem("token");
			if (!token) {
				window.location.href = "/auth/login";
				return;
			}
			window.location.href = `/checkout/${eventId}/${ticket.id}`;
		});

		ticketList.appendChild(item);
	});
}

/* ─── Check Auth State ─── */
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
		} else {
			organizerNavBtn.href = "#";
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
						<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 1L5 5L9 1"/>
						</svg>
						<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white; display: grid; place-items: center; font-size: 1rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
					</div>
					
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 160px; z-index: 100; overflow: hidden;">
						<a href="/my-tickets" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">My Tickets</a>
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

window.logout = function(e) {
	if(e) e.preventDefault();
	localStorage.removeItem("token");
	localStorage.removeItem("username");
	localStorage.removeItem("email");
	localStorage.removeItem("role");
	window.location.reload();
}

/** Init */
document.addEventListener('DOMContentLoaded', () => {
	checkAuth();
	fetchEventDetail();
});
