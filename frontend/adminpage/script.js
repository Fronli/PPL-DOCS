document.addEventListener('DOMContentLoaded', () => {
    // Admin Dashboard interactions and data fetching will go here
    console.log('Admin Dashboard Loaded Successfully');

    checkAuth();

    // Example: Highlight rows on click
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            rows.forEach(r => r.style.backgroundColor = '');
            row.style.backgroundColor = '#f1f5f9';
        });
    });
});

function checkAuth() {
    const userStr = localStorage.getItem("username");
    const topActions = document.getElementById("topActions");

    if (userStr && topActions) {
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

window.logout = function(e) {
    if(e) e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    window.location.href = '/auth/login'; // assuming redirect to login
}
