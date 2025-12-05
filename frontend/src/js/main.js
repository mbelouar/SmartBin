// ==================== CONFIG ====================
const API_BASE = 'http://localhost';
const API_URLS = {
    auth: `${API_BASE}:8001/api/auth`,
    bins: `${API_BASE}:8002/api/bins`,
    detections: `${API_BASE}:8003/api/detections`,
    reclamations: `${API_BASE}:8004/api/reclamations`
};

// ==================== STATE ====================
let currentUser = null;
let authToken = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');

    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        showDashboard();
    } else {
        showAuthPage();
    }

    // Setup event listeners
    setupAuthListeners();
    setupNavigationListeners();
    setupModalListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 500);
}

// ==================== AUTH FUNCTIONS ====================
function setupAuthListeners() {
    // Switch between login and register
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    // Login
    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('login-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Register
    document.getElementById('register-submit').addEventListener('click', handleRegister);

    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

async function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URLS.auth}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showToast('Login successful!', 'success');
            showDashboard();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Connection error. Please try again.', 'error');
    }
}

async function handleRegister() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (!username || !email || !password || !passwordConfirm) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showToast('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URLS.auth}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                email,
                password,
                password_confirm: passwordConfirm
            })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showToast('Registration successful!', 'success');
            showDashboard();
        } else {
            const errorMsg = data.error || data.username?.[0] || data.email?.[0] || 'Registration failed';
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Connection error. Please try again.', 'error');
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    showAuthPage();
    showToast('Logged out successfully', 'success');
}

// ==================== NAVIGATION ====================
function setupNavigationListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateToPage(page);
        });
    });
}

function navigateToPage(pageName) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Show page
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    // Load page data
    switch (pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bins':
            loadBins();
            break;
        case 'reclamations':
            loadReclamations();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

function showAuthPage() {
    document.getElementById('navbar').classList.add('hidden');
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById('auth-page').classList.add('active');
}

function showDashboard() {
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('logout-btn').style.display = 'block';
    navigateToPage('dashboard');
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        // Load user profile
        const profileResponse = await fetch(`${API_URLS.auth}/profile/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profile = await profileResponse.json();
        currentUser = profile;

        // Update stats
        document.getElementById('user-points').textContent = profile.points || 0;
        document.getElementById('user-qr-code').textContent = profile.qr_code || 'No QR Code';

        // Generate QR Code
        const qrContainer = document.getElementById('qr-code-canvas');
        qrContainer.innerHTML = '';
        if (profile.qr_code) {
            new QRCode(qrContainer, {
                text: profile.qr_code,
                width: 200,
                height: 200
            });
        }

        // Load bins count
        const binsResponse = await fetch(`${API_URLS.bins}/list/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const bins = await binsResponse.json();
        document.getElementById('total-bins').textContent = bins.results?.length || bins.length || 0;

        // Load detections count
        try {
            const detectionsResponse = await fetch(`${API_URLS.detections}/list/`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const detections = await detectionsResponse.json();
            document.getElementById('total-detections').textContent = detections.results?.length || detections.length || 0;
        } catch (e) {
            document.getElementById('total-detections').textContent = '0';
        }

        // Load reclamations count
        const reclamationsResponse = await fetch(`${API_URLS.reclamations}/list/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const reclamations = await reclamationsResponse.json();
        document.getElementById('total-reclamations').textContent = reclamations.results?.length || reclamations.length || 0;

        // Load recent activity (points history)
        try {
            const activityResponse = await fetch(`${API_URLS.auth}/points/history/`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const activity = await activityResponse.json();
            displayRecentActivity(activity.results || activity);
        } catch (e) {
            document.getElementById('recent-activity').innerHTML = '<p class="text-muted">No recent activity</p>';
        }

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Error loading dashboard', 'error');
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent activity</p>';
        return;
    }

    container.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item" style="padding: 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between;">
                <span><i class="fas fa-coins" style="color: var(--warning-color);"></i> ${activity.reason || 'Points earned'}</span>
                <span style="color: var(--success-color); font-weight: bold;">+${activity.points_change} pts</span>
            </div>
            <small style="color: var(--text-muted);">${new Date(activity.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

// ==================== BINS ====================
async function loadBins() {
    try {
        const response = await fetch(`${API_URLS.bins}/list/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        const bins = data.results || data;
        displayBins(bins);
    } catch (error) {
        console.error('Bins load error:', error);
        showToast('Error loading bins', 'error');
    }
}

function displayBins(bins) {
    const container = document.getElementById('bins-list');
    
    if (!bins || bins.length === 0) {
        container.innerHTML = '<p class="text-muted">No bins found. Add your first bin!</p>';
        return;
    }

    container.innerHTML = bins.map(bin => `
        <div class="bin-card">
            <div class="bin-header">
                <h3><i class="fas fa-trash-alt"></i> ${bin.name}</h3>
                <span class="bin-status ${bin.status || 'active'}">${bin.status || 'active'}</span>
            </div>
            <div class="bin-info">
                <p><i class="fas fa-qrcode"></i> QR: ${bin.qr_code}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${bin.location || 'No location'}</p>
                <p><i class="fas fa-box"></i> Capacity: ${bin.capacity || 100}L (${bin.fill_level || 0}% full)</p>
            </div>
            <div class="bin-actions">
                <button class="btn btn-primary btn-small" onclick="openBin('${bin.id}')">
                    <i class="fas fa-door-open"></i> Open
                </button>
                <button class="btn btn-secondary btn-small" onclick="closeBin('${bin.id}')">
                    <i class="fas fa-door-closed"></i> Close
                </button>
            </div>
        </div>
    `).join('');
}

async function openBin(binId) {
    try {
        const response = await fetch(`${API_URLS.bins}/list/${binId}/open_bin/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_qr_code: currentUser.qr_code })
        });

        if (response.ok) {
            showToast('Bin opened successfully!', 'success');
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to open bin', 'error');
        }
    } catch (error) {
        console.error('Open bin error:', error);
        showToast('Error opening bin', 'error');
    }
}

async function closeBin(binId) {
    try {
        const response = await fetch(`${API_URLS.bins}/list/${binId}/close_bin/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showToast('Bin closed successfully!', 'success');
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to close bin', 'error');
        }
    } catch (error) {
        console.error('Close bin error:', error);
        showToast('Error closing bin', 'error');
    }
}

// ==================== RECLAMATIONS ====================
async function loadReclamations() {
    try {
        const response = await fetch(`${API_URLS.reclamations}/list/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        const reclamations = data.results || data;
        displayReclamations(reclamations);
    } catch (error) {
        console.error('Reclamations load error:', error);
        showToast('Error loading reclamations', 'error');
    }
}

function displayReclamations(reclamations) {
    const container = document.getElementById('reclamations-list');
    
    if (!reclamations || reclamations.length === 0) {
        container.innerHTML = '<p class="text-muted">No reclamations found.</p>';
        return;
    }

    container.innerHTML = reclamations.map(rec => `
        <div class="reclamation-card">
            <div class="reclamation-header">
                <div>
                    <h3>${rec.title}</h3>
                    <span class="reclamation-badge ${rec.status}">${rec.status}</span>
                </div>
            </div>
            <p>${rec.message}</p>
            <small class="text-muted">
                <i class="fas fa-clock"></i> ${new Date(rec.created_at).toLocaleString()}
                ${rec.location ? `<br><i class="fas fa-map-marker-alt"></i> ${rec.location}` : ''}
            </small>
        </div>
    `).join('');
}

// ==================== PROFILE ====================
async function loadProfile() {
    try {
        const response = await fetch(`${API_URLS.auth}/profile/`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const profile = await response.json();

        document.getElementById('profile-username').textContent = profile.username;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-points').textContent = profile.points || 0;
        document.getElementById('profile-qr').textContent = profile.qr_code || 'No QR Code';
    } catch (error) {
        console.error('Profile load error:', error);
        showToast('Error loading profile', 'error');
    }
}

// ==================== MODALS ====================
function setupModalListeners() {
    // Add Bin
    document.getElementById('add-bin-btn').addEventListener('click', () => {
        openModal('add-bin-modal');
    });

    document.getElementById('save-bin-btn').addEventListener('click', saveBin);

    // Add Reclamation
    document.getElementById('add-reclamation-btn').addEventListener('click', () => {
        openModal('add-reclamation-modal');
    });

    document.getElementById('save-reclamation-btn').addEventListener('click', saveReclamation);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function saveBin() {
    const name = document.getElementById('bin-name').value;
    const qrCode = document.getElementById('bin-qr').value;
    const location = document.getElementById('bin-location').value;
    const capacity = document.getElementById('bin-capacity').value;

    if (!name || !qrCode) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URLS.bins}/list/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, qr_code: qrCode, location, capacity: parseInt(capacity) || 100 })
        });

        if (response.ok) {
            showToast('Bin added successfully!', 'success');
            closeModal('add-bin-modal');
            loadBins();
            // Clear form
            document.getElementById('bin-name').value = '';
            document.getElementById('bin-qr').value = '';
            document.getElementById('bin-location').value = '';
            document.getElementById('bin-capacity').value = '100';
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to add bin', 'error');
        }
    } catch (error) {
        console.error('Save bin error:', error);
        showToast('Error saving bin', 'error');
    }
}

async function saveReclamation() {
    const type = document.getElementById('reclamation-type').value;
    const title = document.getElementById('reclamation-title').value;
    const message = document.getElementById('reclamation-message').value;
    const location = document.getElementById('reclamation-location').value;

    if (!title || !message) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URLS.reclamations}/list/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_qr_code: currentUser.qr_code,
                reclamation_type: type,
                title,
                message,
                location: location || null
            })
        });

        if (response.ok) {
            showToast('Reclamation submitted successfully!', 'success');
            closeModal('add-reclamation-modal');
            loadReclamations();
            // Clear form
            document.getElementById('reclamation-title').value = '';
            document.getElementById('reclamation-message').value = '';
            document.getElementById('reclamation-location').value = '';
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to submit reclamation', 'error');
        }
    } catch (error) {
        console.error('Save reclamation error:', error);
        showToast('Error submitting reclamation', 'error');
    }
}

// ==================== UTILITIES ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function copyQRCode() {
    const qrText = document.getElementById('user-qr-code').textContent;
    navigator.clipboard.writeText(qrText).then(() => {
        showToast('QR Code copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy QR Code', 'error');
    });
}

// Make functions globally accessible
window.openBin = openBin;
window.closeBin = closeBin;
window.closeModal = closeModal;
window.copyQRCode = copyQRCode;
