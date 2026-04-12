document.addEventListener('DOMContentLoaded', () => {
	// Parse URL params -> /view-ticket/:orderId
	const pathParts = window.location.pathname.split('/').filter(p => p);
	const orderId = pathParts[1];

	const ticketsContainer = document.getElementById('ticketsContainer');
	const elTransId = document.getElementById('transId');
	const elTransDate = document.getElementById('transDate');

	function formatDateStr(dateStr) {
		if (!dateStr) return "TBA";
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		}).format(new Date(dateStr));
	}

	async function loadTicketData() {
		if (!orderId) {
			ticketsContainer.innerHTML = '<div style="color:var(--orange-accent); font-weight:700;">Invalid Order ID</div>';
			return;
		}

		const token = localStorage.getItem("token");
		if (!token) {
			window.location.href = "/auth/login";
			return;
		}

		try {
			const res = await fetch(`/event/order/${orderId}/tickets`, {
				headers: {
					"Authorization": `Bearer ${token}`
				}
			});
			if (!res.ok) throw new Error("Failed to load tickets");
			
			const data = await res.json();
			const order = data.order;

			// Populate top level data
			elTransId.textContent = `#INV-${order.id.toString().padStart(6, '0')}`;
			elTransDate.textContent = formatDateStr(order.createdAt);

			// Render individual tickets
			ticketsContainer.innerHTML = "";
			
			if (!order.tickets || order.tickets.length === 0) {
				ticketsContainer.innerHTML = "<p>No tickets found for this order.</p>";
				return;
			}

			// Render each ticket (if checkout has qty 2, it loops 2 times)
			order.tickets.forEach(ticket => {
				const event = ticket.event;
				const ticketType = ticket.ticketType;

				const ticketHTML = `
				<div class="ticket-card">
					<div class="ticket-left">
						<div class="qr-box">
							${ticket.qrCode && ticket.qrCode.startsWith('data:image') 
                                ? `<img src="${ticket.qrCode}" alt="Ticket QR Code" />`
                                : `<span style="font-size:0.7rem; color:#94a3b8; text-align:center;">${ticket.qrCode || 'Waiting QR Generation'}</span>`
                            }
						</div>
						<span class="pass-type">Entrance Pass</span>
						<span class="pass-id">ID: TKT-${new Date().getFullYear()}-${ticket.id.toString().padStart(5, '0')}</span>
					</div>
					
					<div class="ticket-right">
						<div class="valid-badge">
							<span class="dot"></span> Valid Ticket
						</div>
						
						<h2 class="event-name">${event.title}</h2>
						
						<div class="ticket-details-grid">
							<div class="td-item">
								<span class="td-label">Ticket Category</span>
								<span class="td-value">${ticketType.name}</span>
							</div>

							<div class="td-item">
								<span class="td-label">Schedule</span>
								<span class="td-value">${formatDateStr(event.eventDate)}</span>
							</div>
							<div class="td-item">
								<span class="td-label">Venue</span>
								<span class="td-value">${event.venue ? event.venue + ', ' + event.city : event.city}</span>
							</div>
						</div>
						
						<button class="btn-download" onclick="window.print()">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
							Download PDF
						</button>
					</div>
				</div>`;

				ticketsContainer.insertAdjacentHTML('beforeend', ticketHTML);
			});

		} catch(err) {
			console.error(err);
			ticketsContainer.innerHTML = `<div style="color:var(--orange-accent); font-weight:700;">Error: ${err.message}</div>`;
		}
	}

	loadTicketData();
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
        
        document.getElementById('greetingName').textContent = `Hi, ${userName.split(' ')[0]}`;
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
						<a href="#" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);">My Tickets</a>
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
