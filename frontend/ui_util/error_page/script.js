/**
 * Ticketa – Error Page Script
 * 
 * Cara pakai dari halaman lain:
 * 
 *   // Contoh 1: Redirect dengan code saja (pakai pesan default)
 *   window.location.href = '/ui_util/error_page/index.html?code=401';
 *
 *   // Contoh 2: Redirect dengan pesan kustom
 *   window.location.href = '/ui_util/error_page/index.html?code=403&title=Akses Ditolak&message=Anda tidak memiliki izin untuk halaman ini';
 *
 *   // Contoh 3: Dari fetch() yang gagal
 *   fetch(url, { headers: { Authorization: `Bearer ${token}` } })
 *     .then(res => {
 *       if (!res.ok) {
 *         window.location.href = `/ui_util/error_page/index.html?code=${res.status}&message=${encodeURIComponent(res.statusText)}`;
 *       }
 *     });
 */

/* ─── Default error configurations ─── */
const errorDefaults = {
    '401': {
        title: 'Unauthorized Access',
        message: "You don't have permission to view this page or your session has expired. Please log in again to continue.",
        icon: '🔒',
        status: 'Authentication Required',
        footer: 'If you believe this is a mistake, contact our support team.'
    },
    '403': {
        title: 'Access Forbidden',
        message: "You are not authorized to view this section using your current role.",
        icon: '🛡️',
        status: 'Role Verification Failed',
        footer: 'Make sure you are logged into the correct EO/Admin account.'
    },
    '404': {
        title: 'Page Not Found',
        message: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
        icon: '🔍',
        status: '404 - Not Found',
        footer: 'Check the URL to ensure it is correct.'
    },
    '500': {
        title: 'Server Error',
        message: "Something went wrong on our end. Our engineering team has been notified and is working on a fix.",
        icon: '⚠️',
        status: 'Internal Server Error',
        footer: 'Please try again in a few minutes.'
    }
};

/* ─── Read URL params ─── */
const params = new URLSearchParams(window.location.search);
const code    = params.get('code');
const title   = params.get('title');
const message = params.get('message');
const status  = params.get('status');
const footer  = params.get('footer');

/* ─── Resolve config: custom params override defaults ─── */
const defaults = (code && errorDefaults[code]) ? errorDefaults[code] : null;

function resolve(custom, field) {
    if (custom) return custom;
    if (defaults) return defaults[field];
    return null;
}

const finalTitle   = resolve(title, 'title');
const finalMessage = resolve(message, 'message');
const finalIcon    = defaults ? defaults.icon : null;
const finalStatus  = resolve(status, 'status');
const finalFooter  = resolve(footer, 'footer');

/* ─── Apply to DOM ─── */
if (finalTitle)   {
    document.getElementById('errorTitle').textContent = finalTitle;
    document.title = finalTitle + ' - Ticketa';
}
if (finalMessage) document.getElementById('errorSubtitle').textContent = finalMessage;
if (finalIcon)    document.getElementById('errorIcon').textContent = finalIcon;
if (finalStatus)  document.getElementById('statusText').textContent = finalStatus;
if (finalFooter)  document.getElementById('footerInfo').textContent = finalFooter;
