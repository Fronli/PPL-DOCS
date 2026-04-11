document.addEventListener('DOMContentLoaded', () => {
	// Parse URL params
	// URL expected: /checkout/:eventId/:ticketTypeId
	const pathParts = window.location.pathname.split('/').filter(p => p);
	// pathParts -> ["checkout", "1", "2"]
	const eventId = pathParts[1];
	const ticketTypeId = pathParts[2];
	
	// Default starting state
	let currentTicketType = null;
	let quantity = 1; 
	let pricePerTicket = 0;
	let maxQuota = 1;

	// DOM Elements
	const elEventTitle = document.getElementById('eventTitle');
	const elEventPoster = document.getElementById('eventPoster');
	const elEventDate = document.getElementById('eventDate');
	const elEventLocation = document.getElementById('eventLocation');
	
	const elTicketName = document.getElementById('ticketName');
	const elTicketPrice = document.getElementById('ticketPrice');
	const elAvailableSeats = document.getElementById('availableSeats');
	
	const btnMinus = document.getElementById('btnMinus');
	const btnPlus = document.getElementById('btnPlus');
	const qtyVal = document.getElementById('qtyVal');
	
	const summaryTicketType = document.getElementById('summaryTicketType');
	const summaryUnitPrice = document.getElementById('summaryUnitPrice');
	const summaryQty = document.getElementById('summaryQty');
	const summarySubtotal = document.getElementById('summarySubtotal');
	const btnContinue = document.getElementById('btnContinue');

	function formatIDR(amount) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount).replace("Rp", "IDR");
	}

	function formatDateStr(dateStr) {
		if (!dateStr) return "TBA";
		return new Intl.DateTimeFormat("en-US", {
			weekday: "long",
			month: "short",
			day: "2-digit",
			year: "numeric"
		}).format(new Date(dateStr));
	}

	function updateUI() {
		// Update Quantity Display
		qtyVal.textContent = quantity;
		summaryQty.textContent = quantity;
		
		// Button states
		btnMinus.disabled = quantity <= 1;
		if(quantity <= 1) {
			btnMinus.style.opacity = '0.5';
			btnMinus.style.cursor = 'not-allowed';
		} else {
			btnMinus.style.opacity = '1';
			btnMinus.style.cursor = 'pointer';
		}

		// Prevent buying more than available
		btnPlus.disabled = quantity >= maxQuota;
		if(quantity >= maxQuota) {
			btnPlus.style.opacity = '0.5';
			btnPlus.style.cursor = 'not-allowed';
		} else {
			btnPlus.style.opacity = '1';
			btnPlus.style.cursor = 'pointer';
		}

		// Update Pricing
		const subtotal = quantity * pricePerTicket;
		summarySubtotal.textContent = formatIDR(subtotal);
	}

	// Internal Actions
	btnMinus.addEventListener('click', () => {
		if (quantity > 1) {
			quantity--;
			updateUI();
		}
	});

	btnPlus.addEventListener('click', () => {
		if (quantity < maxQuota) {
			quantity++;
			updateUI();
		}
	});

	btnContinue.addEventListener('click', () => {
		const subtotal = quantity * pricePerTicket;
		alert(`Proceeding to checkout with ${quantity} x ${currentTicketType.name}.\nTotal: ${formatIDR(subtotal)}\n(Integration point for Next Step)`);
		// Usually we'd send a POST to a /orders endpoint next
	});

	async function loadEventData() {
		if (!eventId || !ticketTypeId) {
			alert("Mismatched URL parameters.");
			return;
		}

		try {
			const res = await fetch(`/event/getEventById/${eventId}`);
			if (!res.ok) throw new Error("Event dataloader failed");
			const event = await res.json();
			
			// Find the selected ticket type
			currentTicketType = event.ticketTypes.find(t => t.id === Number(ticketTypeId));
			if (!currentTicketType) {
				alert("Ticket type not found.");
				return;
			}
			
			// Set data configurations
			pricePerTicket = currentTicketType.price;
			maxQuota = currentTicketType.quota > 0 ? (currentTicketType.quota > 12 ? 12 : currentTicketType.quota) : 0; // Cap at 12 or available seats

			// Populate UI
			const imageUrl = event.posterUrl || 'https://images.unsplash.com/photo-1540039155732-d6749b93223e?auto=format&fit=crop&w=1920&q=80';
			elEventPoster.style.backgroundImage = `url('${imageUrl}')`;
			
			elEventTitle.textContent = event.title;
			elEventDate.textContent = formatDateStr(event.eventDate);
			elEventLocation.textContent = event.venue ? `${event.venue}, ${event.city}` : event.city;
			
			elTicketName.textContent = currentTicketType.name;
			const priceStr = formatIDR(pricePerTicket);
			elTicketPrice.textContent = priceStr;
			
			elAvailableSeats.textContent = currentTicketType.quota;
			
			summaryTicketType.textContent = currentTicketType.name;
			summaryUnitPrice.textContent = priceStr;
			
			updateUI();

		} catch(err) {
			console.error(err);
			elEventTitle.textContent = "Error loading event";
		}
	}

	// Initialize UI data load
	loadEventData();
	checkAuth();
});

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
						<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand-blue); color: white; display: grid; place-items: center; font-size: 1rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
					</div>
					
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 160px; z-index: 100; overflow: hidden;">
						<a href="#" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#fff'">My Tickets</a>
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
