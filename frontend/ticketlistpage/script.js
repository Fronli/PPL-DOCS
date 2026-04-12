document.addEventListener('DOMContentLoaded', () => {
	const ticketListContainer = document.getElementById('ticketListContainer');

	function formatDateStr(dateStr) {
		if (!dateStr) return "TBA";
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		}).format(new Date(dateStr));
	}

	function formatPosterDate(dateStr) {
		if (!dateStr) return "TBA";
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric"
		}).format(new Date(dateStr));
	}

	async function loadMyTickets() {
		const token = localStorage.getItem("token");
		if (!token) {
			window.location.href = "/auth/login";
			return;
		}

		try {
			const res = await fetch(`/event/myticket`, {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});

			console.log('masuk bang!');
			
			if (!res.ok) throw new Error("Failed to load tickets");
			
			const data = await res.json();
			const orders = data.orders;

			ticketListContainer.innerHTML = "";
			
			if (!orders || orders.length === 0) {
				ticketListContainer.innerHTML = `<p style="color: var(--text-muted); font-weight: 500;">You haven't purchased any tickets yet.</p>`;
				return;
			}

			orders.forEach(order => {
				// Base event & ticket info off the first ticket in the order
				if (!order.tickets || order.tickets.length === 0) return;
				
				const sampleTicket = order.tickets[0];
				const event = sampleTicket.event;
				const ticketType = sampleTicket.ticketType;

				const isFuture = sampleTicket.status === 'VALID';
				const badgeClass = isFuture ? 'active' : 'used';
				const badgeText = sampleTicket.status === 'VALID' ? 'VALID' : 'USED';

				const coverUrl = event.posterUrl || 'https://images.unsplash.com/photo-1540039155732-d6749b93223e?auto=format&fit=crop&w=1920&q=80';
				
				const cardHTML = `
				<div class="list-card">
					<div class="card-poster" style="background-image: url('${coverUrl}')">
						<div class="poster-date">${formatPosterDate(event.eventDate)}</div>
					</div>
					<div class="card-body">
						<div class="card-info">
							<h3 class="card-title">${event.title}</h3>
							<div class="info-grid">
								<div class="info-item"><span class="lbl">Date:</span> <span class="val">${formatDateStr(event.eventDate)}</span></div>
								<div class="info-item"><span class="lbl">Location:</span> <span class="val">${event.venue ? event.venue + ', ' + event.city : event.city || "Venue TBA"}</span></div>
								<div class="info-item"><span class="lbl">Type:</span> <span class="val">${ticketType.name}</span></div>
							</div>
							<div class="badge ${badgeClass}">${badgeText}</div>
						</div>
						<div class="card-actions">
							${isFuture 
								? `<a href="/view-ticket/${order.id}" class="btn-primary">View Ticket</a>
								   <a href="${sampleTicket.qrCode}" download="Ticketa-QR-${sampleTicket.id}.png" class="btn-secondary" style="text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;">Download QR</a>`
								: `<a href="/view-ticket/${order.id}" class="btn-secondary">View Receipt</a>`
							}
						</div>
					</div>
				</div>
				`;

				ticketListContainer.insertAdjacentHTML('beforeend', cardHTML);
			});

		} catch(err) {
			console.error(err);
			ticketListContainer.innerHTML = `<p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>`;
		}
	}

	loadMyTickets();
	checkAuth();
});

/* ─── Check Auth State ─── */
function checkAuth() {
	const token = localStorage.getItem("token");
	const userStr = localStorage.getItem("username");
	const topActions = document.getElementById("topActions");

	if (token && userStr && topActions) {
		let userName = "User";
		try {
			const parsed = JSON.parse(userStr);
			userName = typeof parsed === "string" ? parsed : (parsed.name || "User");
		} catch (e) {
			userName = userStr;
		}

		document.getElementById('greetingName').textContent = userName;
		document.getElementById('greetingInitial').textContent = userName.charAt(0).toUpperCase();

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
					
					<div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-md); min-width: 160px; z-index: 100; overflow: hidden; text-align: left;">
						<a href="/my-tickets" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);">My Tickets</a>
						<a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.9rem; font-weight: 600;">&rarr; Logout</a>
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
	window.location.href = "/";
}
