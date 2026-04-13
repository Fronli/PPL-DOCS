/* ─── Scanner Script ─── */

const API_BASE = 'http://localhost:3000';
let currentTicketQR = null;
let currentTicketStatus = null;

/* ─── Auth Helpers ─── */
function authFetch(url, options = {}) {
	const token = localStorage.getItem('token');
	return fetch(url, {
		...options,
		headers: {
			...options.headers,
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
	initAuth();
	initDropzone();
	initManualSearch();
	initCheckinButton();
	initClearPreview();
});

function initAuth() {
	const token = localStorage.getItem('token');
	const username = localStorage.getItem('username');
	if (!token) {
		window.location.href = '/';
		return;
	}
	let name = 'Organizer';
	try {
		const parsed = JSON.parse(username);
		name = typeof parsed === 'string' ? parsed : (parsed.name || 'Organizer');
	} catch {
		name = username || 'Organizer';
	}
	const companyEl = document.getElementById('userCompanyName');
	const avatarEl = document.getElementById('userAvatar');
	if (companyEl) companyEl.textContent = name;
	if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
}

/* ─── Dropzone ─── */
function initDropzone() {
	const dropzone = document.getElementById('dropzone');
	const fileInput = document.getElementById('fileInput');

	// Drag events
	['dragenter', 'dragover'].forEach(evt => {
		dropzone.addEventListener(evt, e => {
			e.preventDefault();
			dropzone.classList.add('drag-over');
		});
	});

	['dragleave', 'drop'].forEach(evt => {
		dropzone.addEventListener(evt, e => {
			e.preventDefault();
			dropzone.classList.remove('drag-over');
		});
	});

	dropzone.addEventListener('drop', e => {
		const files = e.dataTransfer.files;
		if (files.length > 0) handleFile(files[0]);
	});

	fileInput.addEventListener('change', e => {
		if (e.target.files.length > 0) handleFile(e.target.files[0]);
	});
}

function handleFile(file) {
	if (!file.type.startsWith('image/')) {
		showNotif('Invalid File', 'Please upload a valid image file (PNG, JPG).', true);
		return;
	}

	const reader = new FileReader();
	reader.onload = function(e) {
		const imgSrc = e.target.result;

		// Show preview
		const preview = document.getElementById('dropzonePreview');
		const previewImg = document.getElementById('previewImage');
		const content = document.querySelector('.dropzone-content');

		previewImg.src = imgSrc;
		content.style.display = 'none';
		preview.style.display = 'flex';

		// Process QR Code
		processQRFromImage(imgSrc);
	};
	reader.readAsDataURL(file);
}

function processQRFromImage(imgSrc) {
	const label = document.getElementById('processLabel');
	const sub = document.getElementById('processSub');
	label.textContent = 'Processing...';
	sub.textContent = 'Reading QR code from image...';

	const img = new Image();
	img.onload = function() {
		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

		// Use jsQR to decode
		if (typeof jsQR !== 'undefined') {
			const code = jsQR(imageData.data, imageData.width, imageData.height);
			if (code) {
				label.textContent = 'QR Code Detected!';
				sub.textContent = `Reference: ${code.data}`;
				lookupTicket(code.data);
			} else {
				label.textContent = 'No QR Code Found';
				sub.textContent = 'Could not detect a QR code in this image. Try manual entry below.';
			}
		} else {
			// jsQR not loaded, try treating file name or manual
			label.textContent = 'QR Library Not Available';
			sub.textContent = 'Try manual entry below.';
		}
	};
	img.src = imgSrc;
}

/* ─── Clear Preview ─── */
function initClearPreview() {
	document.getElementById('clearPreview').addEventListener('click', () => {
		document.querySelector('.dropzone-content').style.display = '';
		document.getElementById('dropzonePreview').style.display = 'none';
		document.getElementById('previewImage').src = '';
		document.getElementById('fileInput').value = '';

		document.getElementById('processLabel').textContent = 'Ready to Process';
		document.getElementById('processSub').textContent = "Upload the attendee's digital ticket or enter ID manually";

		// Reset right panel
		resetTicketPanel();
	});
}

/* ─── Manual Search ─── */
function initManualSearch() {
	const searchBtn = document.getElementById('searchBtn');
	const input = document.getElementById('manualInput');

	searchBtn.addEventListener('click', () => {
		const val = input.value.trim();
		if (!val) {
			showNotif('Empty Input', 'Please enter a ticket reference ID.', true);
			return;
		}
		lookupTicket(val);
	});

	input.addEventListener('keydown', e => {
		if (e.key === 'Enter') searchBtn.click();
	});
}

/* ─── Ticket Lookup ─── */
async function lookupTicket(qrCode) {
	const label = document.getElementById('processLabel');
	const sub = document.getElementById('processSub');

	label.textContent = 'Searching...';
	sub.textContent = `Looking up ticket: ${qrCode}`;

	try {
		const res = await authFetch(`${API_BASE}/eo/ticket/${encodeURIComponent(qrCode)}`);
		const data = await res.json();

		if (!res.ok) {
			label.textContent = 'Ticket Not Found';
			sub.textContent = data.message || 'Could not find this ticket.';
			resetTicketPanel();
			return;
		}

		// Populate right panel
		currentTicketQR = qrCode;
		currentTicketStatus = data.status;
		renderTicketDetails(data);

		label.textContent = 'Ticket Found';
		sub.textContent = `Reference: ${qrCode}`;

	} catch (err) {
		console.error(err);
		label.textContent = 'Error';
		sub.textContent = 'Failed to connect to the server.';
		resetTicketPanel();
	}
}

function renderTicketDetails(ticket) {
	// Hide placeholder, show content
	document.getElementById('detailPlaceholder').style.display = 'none';
	document.getElementById('detailContent').style.display = 'flex';

	document.getElementById('attendeeName').textContent = ticket.attendeeName || '—';
	document.getElementById('ticketId').textContent = ticket.qrCode || '—';
	document.getElementById('ticketType').textContent = ticket.typeName || '—';
	document.getElementById('ticketSeat').textContent = '—';

	const dot = document.getElementById('ticketDot');
	const badge = document.getElementById('statusBadge');
	const btn = document.getElementById('confirmCheckinBtn');

	// Reset classes
	dot.className = 'ticket-dot';
	badge.className = 'status-badge';

	if (ticket.status === 'VALID') {
		dot.classList.add('valid');
		badge.classList.add('ready');
		badge.textContent = 'READY FOR CHECK-IN';
		btn.disabled = false;
	} else if (ticket.status === 'USED') {
		dot.classList.add('used');
		badge.classList.add('used');
		badge.textContent = 'ALREADY USED';
		btn.disabled = true;
	} else {
		dot.classList.add('cancelled');
		badge.classList.add('cancelled');
		badge.textContent = ticket.status || 'INVALID';
		btn.disabled = true;
	}
}

function resetTicketPanel() {
	document.getElementById('detailPlaceholder').style.display = 'flex';
	document.getElementById('detailContent').style.display = 'none';
	document.getElementById('ticketDot').className = 'ticket-dot';
	document.getElementById('confirmCheckinBtn').disabled = true;
	currentTicketQR = null;
	currentTicketStatus = null;
}

/* ─── Check-In Confirm ─── */
function initCheckinButton() {
	document.getElementById('confirmCheckinBtn').addEventListener('click', async () => {
		if (!currentTicketQR || currentTicketStatus !== 'VALID') return;

		const btn = document.getElementById('confirmCheckinBtn');
		btn.disabled = true;
		btn.textContent = 'PROCESSING...';

		try {
			const res = await authFetch(`${API_BASE}/eo/ticket/${encodeURIComponent(currentTicketQR)}/checkin`, {
				method: 'PATCH'
			});
			const data = await res.json();

			if (!res.ok) {
				showNotif('Check-In Failed', data.message || 'Could not check in ticket.', true);
				btn.textContent = 'CONFIRM CHECK-IN';
				btn.disabled = false;
				return;
			}

			// Update UI to reflect USED
			currentTicketStatus = 'USED';
			const dot = document.getElementById('ticketDot');
			const badge = document.getElementById('statusBadge');

			dot.className = 'ticket-dot used';
			badge.className = 'status-badge used';
			badge.textContent = 'ALREADY USED';
			btn.textContent = 'CHECKED IN ✓';
			btn.disabled = true;

			showNotif('Check-In Successful', `Ticket ${currentTicketQR} has been checked in successfully.`, false);

		} catch (err) {
			console.error(err);
			showNotif('Error', 'Failed to connect to the server.', true);
			btn.textContent = 'CONFIRM CHECK-IN';
			btn.disabled = false;
		}
	});
}

/* ─── Notification Modal ─── */
window.showNotif = function(title, message, isError = false) {
	const modal = document.getElementById('notifModal');
	const mTitle = document.getElementById('notifTitle');
	const mMessage = document.getElementById('notifMessage');

	mTitle.textContent = title;
	mTitle.style.color = isError ? '#ef4444' : '#10b981';
	mMessage.textContent = message;
	modal.classList.add('active');
}

window.closeNotifModal = function() {
	document.getElementById('notifModal').classList.remove('active');
}
