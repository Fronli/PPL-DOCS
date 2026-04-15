document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchApplyAccounts();
    fetchEOAccounts();
    fetchUserAccounts();
    fetchEvents();
});

let applyPage = 1;
let eoPage = 1;
let userPage = 1;
let eventPage = 1;

/* ─── Fetch Apply Accounts ─── */
async function fetchApplyAccounts() {
    const tbody = document.getElementById("applyTableBody");
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>`;

        const res = await fetch(`/admin/dashboard/apply?page=${applyPage}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        renderApply(data.accounts || []);
        updatePaginationInfo('apply', data.page, data.totalPages, data.total, data.accounts.length, 4);
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">${e.message}</td></tr>`;
    }
}

function renderApply(accounts) {
    const tbody = document.getElementById("applyTableBody");
    const pendingAccounts = accounts.filter(acc => acc.status === 'PENDING');

    if (pendingAccounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No Pending Applications found.</td></tr>`;
        return;
    }

    tbody.innerHTML = pendingAccounts.map(acc => {
        const userName = acc.user?.name || 'Unknown User';
        const userEmail = acc.user?.email || 'Unknown Email';
        return `
        <tr>
            <td>
                <div class="cell-stack">
                    <span class="cell-title">${userName}</span>
                    <span class="cell-sub">${userEmail}</span>
                </div>
            </td>
            <td><span class="badge blue">${acc.organizationName}</span></td>
            <td class="note">${acc.description || 'No description provided.'}</td>
            <td style="text-align: right;">
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="approveApply(${acc.id})">Approve EO</button>
                    <button class="btn btn-outline" onclick="rejectApply(${acc.id})">Reject</button>
                </div>
            </td>
        </tr>
    `}).join('');
}

let pendingApproveId = null;
let pendingRejectId = null;

window.approveApply = function (id) {
    pendingApproveId = id;
    document.getElementById("approveModal").classList.add("active");
}

window.rejectApply = function (id) {
    pendingRejectId = id;
    document.getElementById("rejectModal").classList.add("active");
}

window.closeApproveModal = function () {
    pendingApproveId = null;
    document.getElementById("approveModal").classList.remove("active");
}

window.closeRejectModal = function () {
    pendingRejectId = null;
    document.getElementById("rejectModal").classList.remove("active");
}

window.showNotificationModal = function (title, message, isError = false) {
    const modal = document.getElementById("notificationModal");
    const mTitle = document.getElementById("notifModalTitle");
    const mMessage = document.getElementById("notifModalMessage");

    mTitle.textContent = title;
    mTitle.style.color = isError ? "#ef4444" : "#10b981";
    mMessage.textContent = message;

    modal.classList.add("active");
}

window.closeNotificationModal = function () {
    document.getElementById("notificationModal").classList.remove("active");
}

const confirmApproveBtn = document.getElementById("confirmApproveBtn");
if (confirmApproveBtn) {
    confirmApproveBtn.addEventListener("click", async () => {
        if (!pendingApproveId) return;
        const id = pendingApproveId;
        window.closeApproveModal();

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/admin/dashboard/apply/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to approve application');

            showNotificationModal("Approved", "Application approved successfully.");
            fetchApplyAccounts();
            fetchEOAccounts();
        } catch (e) {
            console.error(e);
            showNotificationModal("Error", e.message, true);
        }
    });
}

const confirmRejectBtn = document.getElementById("confirmRejectBtn");
if (confirmRejectBtn) {
    confirmRejectBtn.addEventListener("click", async () => {
        if (!pendingRejectId) return;
        const id = pendingRejectId;
        window.closeRejectModal();

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/admin/dashboard/apply/${id}/reject`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reject application');

            showNotificationModal("Rejected", "Application rejected.");
            fetchApplyAccounts();
        } catch (e) {
            console.error(e);
            showNotificationModal("Error", e.message, true);
        }
    });
}

/* ─── Fetch EO Accounts ─── */
async function fetchEOAccounts() {
    const tbody = document.getElementById("eoTableBody");
    const token = localStorage.getItem("token");
    if (!token) {
        tbody.innerHTML = ``;
        return;
    }
    try {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>`;

        const res = await fetch(`/admin/dashboard/accounts/eo?page=${eoPage}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        renderEO(data.accounts || []);
        updatePaginationInfo('eo', data.page, data.totalPages, data.total, data.accounts.length, 3);
    } catch (e) {
        console.error(e);
        document.getElementById("eoTableBody").innerHTML = `<tr><td colspan="4" style="text-align:center; color: red;">${e.message}</td></tr>`;
    }
}

function renderEO(accounts) {
    const tbody = document.getElementById("eoTableBody");
    if (accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">No Event Organizers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map(acc => {
        const dateStr = new Date(acc.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        return `
        <tr>
            <td>
                <div class="cell-stack">
                    <span class="cell-title">${acc.name || 'Unnamed Organizer'}</span>
                    <span class="cell-sub">${acc.email}</span>
                </div>
            </td>
            <td class="note">${dateStr}</td>
            <td class="note">${acc._count ? acc._count.events : 0} Events</td>
            <td style="text-align: right;">
                <button class="btn btn-danger-tint" onclick="deleteAccount(${acc.id}, 'eo')">Terminate Account</button>
            </td>
        </tr>
    `}).join('');
}

/* ─── Fetch User Accounts ─── */
async function fetchUserAccounts() {
    const tbody = document.getElementById("userTableBody");
    const token = localStorage.getItem("token");
    if (!token) {
        tbody.innerHTML = ``;
        return;
    }
    try {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>`;

        const res = await fetch(`/admin/dashboard/accounts/user?page=${userPage}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        renderUsers(data.accounts || []);
        updatePaginationInfo('user', data.page, data.totalPages, data.total, data.accounts.length, 5);
    } catch (e) {
        console.error(e);
        document.getElementById("userTableBody").innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">${e.message}</td></tr>`;
    }
}

function renderUsers(accounts) {
    const tbody = document.getElementById("userTableBody");
    if (accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">No Users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map(acc => {
        return `
        <tr>
            <td class="cell-title">${acc.name || 'Unknown User'}</td>
            <td class="cell-sub">${acc.email}</td>
            <td class="note">${acc.totalTicketsPurchased || 0} Tickets</td>
            <td><span class="badge blue">Registered</span></td>
            <td style="text-align: right;"><button class="btn btn-danger-tint" onclick="deleteAccount(${acc.id}, 'user')">Delete User</button></td>
        </tr>
    `}).join('');
}

/* ─── Fetch Events ─── */
async function fetchEvents() {
    const tbody = document.getElementById("eventTableBody");
    if (!tbody) return;
    const token = localStorage.getItem("token");
    if (!token) {
        tbody.innerHTML = ``;
        return;
    }
    try {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>`;

        const res = await fetch(`/admin/dashboard/events?page=${eventPage}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch');

        renderEvents(data.events || []);
        updatePaginationInfo('event', data.page, data.totalPages, data.total, data.events.length, 4);
    } catch (e) {
        console.error(e);
        document.getElementById("eventTableBody").innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">${e.message}</td></tr>`;
    }
}

function renderEvents(events) {
    const tbody = document.getElementById("eventTableBody");
    if (events.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">No Events found.</td></tr>`;
        return;
    }

    tbody.innerHTML = events.map(evt => {
        // Calculate total available tickets by summing the quota of each ticketType returned by the backend
        const totalAvailable = (evt.ticketTypes || []).reduce((sum, ticket) => sum + (ticket.quota || 0), 0);

        return `
        <tr>
            <td>
                <div class="cell-stack">
                    <span class="cell-title">${evt.title || 'Untitled Event'}</span>
                    <span class="cell-sub">ID: ${evt.id}</span>
                </div>
            </td>
            <td class="note">${totalAvailable} Tickets Available</td>
            <td style="text-align: right;">
                <button class="btn btn-danger-outline" onclick="takeDownEvent(${evt.id})">Take Down</button>
            </td>
        </tr>
    `}).join('');
}

/* ─── Deactivate Event ─── */
let pendingDeactivateId = null;

window.takeDownEvent = function (id) {
    pendingDeactivateId = id;
    document.getElementById("deactivateModal").classList.add("active");
}

window.closeDeactivateModal = function () {
    pendingDeactivateId = null;
    document.getElementById("deactivateModal").classList.remove("active");
}

const confirmDeactivateBtn = document.getElementById("confirmDeactivateBtn");
if (confirmDeactivateBtn) {
    confirmDeactivateBtn.addEventListener("click", async () => {
        if (!pendingDeactivateId) return;
        const id = pendingDeactivateId;

        window.closeDeactivateModal();

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/admin/dashboard/events/${id}/deactivate`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to deactivate event');

            // Refresh the events table
            fetchEvents();

        } catch (e) {
            alert("Error: " + e.message);
        }
    });
}

/* ─── Pagination Handlers ─── */
function updatePaginationInfo(type, currentPage, totalPages, totalItems, itemLength, limit) {
    const totalPagesReal = totalPages < 1 ? 1 : totalPages;
    const startRange = totalItems === 0 ? 0 : ((currentPage - 1) * limit) + 1;
    const endRange = startRange + itemLength - (totalItems === 0 ? 0 : 1);

    let typeLabel = 'Users';
    if (type === 'eo') typeLabel = 'Organizers';
    if (type === 'event') typeLabel = 'Events';
    if (type === 'apply') typeLabel = 'Applications';

    document.getElementById(`${type}PagInfo`).textContent = `Showing ${startRange}-${endRange} of ${totalItems} ${typeLabel}`;

    const prevBtn = document.getElementById(`${type}PrevBtn`);
    const nextBtn = document.getElementById(`${type}NextBtn`);

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPagesReal;

    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';

    prevBtn.onclick = () => {
        if (currentPage > 1) {
            if (type === 'eo') { eoPage--; fetchEOAccounts(); }
            else if (type === 'user') { userPage--; fetchUserAccounts(); }
            else if (type === 'event') { eventPage--; fetchEvents(); }
            else if (type === 'apply') { applyPage--; fetchApplyAccounts(); }
        }
    };
    nextBtn.onclick = () => {
        if (currentPage < totalPagesReal) {
            if (type === 'eo') { eoPage++; fetchEOAccounts(); }
            else if (type === 'user') { userPage++; fetchUserAccounts(); }
            else if (type === 'event') { eventPage++; fetchEvents(); }
            else if (type === 'apply') { applyPage++; fetchApplyAccounts(); }
        }
    };
}

/* ─── Delete Account ─── */
let pendingDeleteId = null;
let pendingDeleteType = null;

window.deleteAccount = function (id, type) {
    pendingDeleteId = id;
    pendingDeleteType = type;
    document.getElementById("deleteModal").classList.add("active");
}

window.closeDeleteModal = function () {
    pendingDeleteId = null;
    pendingDeleteType = null;
    document.getElementById("deleteModal").classList.remove("active");
}

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
        if (!pendingDeleteId) return;
        const id = pendingDeleteId;
        const type = pendingDeleteType;

        window.closeDeleteModal();

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`admin/dashboard/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to delete');

            if (type === 'eo') fetchEOAccounts();
            else fetchUserAccounts();

        } catch (e) {
            alert("Error: " + e.message);
        }
    });
}

/* ─── Check Auth State ─── */
function checkAuth() {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("username");
    const topActions = document.getElementById("topActions");

    if (token && userStr && topActions) {
        let userName = "Admin";
        try {
            const parsed = JSON.parse(userStr);
            userName = typeof parsed === "string" ? parsed : (parsed.name || "Admin");
        } catch (e) {
            userName = userStr;
        }

        document.getElementById('greetingName').textContent = userName;
        document.getElementById('greetingInitial').textContent = userName.charAt(0).toUpperCase();

        topActions.innerHTML = `
        <div style="display: flex; align-items: center; gap: 24px;">
            <div style="position: relative;" id="userProfileWrap">
                <div style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); font-weight: 700; font-size: 0.95rem;" onclick="toggleDropdown(event)">
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span style="font-size:0.85rem; color:var(--text-main);">${userName}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">Super Admin</span>
                    </div>
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--brand-blue); color: white; display: grid; place-items: center; font-size: 0.9rem; margin-left: 4px;">${userName.charAt(0).toUpperCase()}</div>
                </div>

                <div id="userDropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow-sm); min-width: 160px; z-index: 100; overflow: hidden; text-align: left;">
                    <a href="/my-tickets" style="display: block; padding: 12px 18px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; border-bottom: 1px solid var(--line);">My Tickets</a>
                    <a href="#" onclick="logout(event)" style="display: block; padding: 12px 18px; color: #ef4444; text-decoration: none; font-size: 0.9rem; font-weight: 600;">&rarr; Logout</a>
                </div>
            </div>
        </div>
        `;
    }
}

window.toggleDropdown = function (e) {
    e.stopPropagation();
    const menu = document.getElementById("userDropdown");
    if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
}

document.addEventListener("click", () => {
    const menu = document.getElementById("userDropdown");
    if (menu) menu.style.display = "none";
});

window.logout = function (e) {
    if (e) e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    window.location.href = "/";
}
