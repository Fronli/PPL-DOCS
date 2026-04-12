document.addEventListener('DOMContentLoaded', () => {
	// Parse URL params
	// URL expected: /payment/:eventId/:ticketTypeId?qty=N
	const pathParts = window.location.pathname.split('/').filter(p => p);
	// pathParts -> ["payment", "1", "2"]
	const eventId = pathParts[1];
	const ticketTypeId = pathParts[2];
	
	const params = new URLSearchParams(window.location.search);
	const quantityStr = params.get('qty');
	const quantity = quantityStr ? parseInt(quantityStr) : 1;

	// DOM Elements
	const elEventTitle = document.getElementById('eventTitle');
	const elEventPoster = document.getElementById('eventPoster');
	const elEventDate = document.getElementById('eventDate');
	
	const summaryTicketType = document.getElementById('summaryTicketType');
	const summaryQty = document.getElementById('summaryQty');
	const summaryTotal = document.getElementById('summaryTotal');
	const btnCompletePayment = document.getElementById('btnCompletePayment');

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
			weekday: "short",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}).format(new Date(dateStr));
	}

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
			const currentTicketType = event.ticketTypes.find(t => t.id === Number(ticketTypeId));
			if (!currentTicketType) {
				alert("Ticket type not found.");
				return;
			}
			
			// Populate UI
			const imageUrl = event.posterUrl || 'https://images.unsplash.com/photo-1540039155732-d6749b93223e?auto=format&fit=crop&w=1920&q=80';
			elEventPoster.style.backgroundImage = `url('${imageUrl}')`;
			
			elEventTitle.textContent = event.title;
			elEventDate.textContent = formatDateStr(event.eventDate);
			
			summaryTicketType.textContent = currentTicketType.name;
			summaryQty.textContent = quantity;
			
			const subtotal = quantity * currentTicketType.price;
			const totalStr = formatIDR(subtotal);
			
			summaryTotal.textContent = totalStr;
			btnCompletePayment.textContent = `Complete Payment • ${totalStr}`;

		} catch(err) {
			console.error(err);
			elEventTitle.textContent = "Error loading event";
		}
	}

	btnCompletePayment.addEventListener('click', async () => {
		const orderId = params.get('orderId');
		const qty = parseInt(params.get('qty'), 10) || 1;
		
		const pathParts = window.location.pathname.split('/').filter(p => p);
		const eventId = Number(pathParts[1]);
		const ticketTypeId = Number(pathParts[2]);

		if (!orderId) {
			alert("Missing Order ID");
			return;
		}

		// SIMULATION BEHAVIOR with real backend call
		const origText = btnCompletePayment.textContent;
		btnCompletePayment.textContent = "Processing...";
		btnCompletePayment.disabled = true;
		
		const token = localStorage.getItem("token");
		
		try {
			const res = await fetch(`/event/order/completePayment`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify({ 
					orderId: orderId, 
					eventId: eventId, 
					ticketTypeId: ticketTypeId, 
					quantity: qty 
				})
			});
			
			const data = await res.json();
			
			if (!res.ok) {
				throw new Error(data.message || "Failed to complete payment");
			}
			
			setTimeout(() => {
				window.location.href = "/view-ticket/" + orderId;
			}, 1000);
			
		} catch (err) {
			alert(err.message);
			btnCompletePayment.textContent = origText;
			btnCompletePayment.disabled = false;
		}
	});

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
			// If viewing payment page without token, redirect to login
			window.location.href = "/auth/login";
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
						<svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 1L5 5L9 1"/>
						</svg>
						<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand-blue); color: white; display: grid; place-items: center; font-size: 1rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
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
