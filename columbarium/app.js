/**
 * Maria Della Strada Columbarium - Comprehensive Management System
 */

const API_BASE_URL = './api';

// --- GLOBAL STATE ---
const state = {
  view: 'HOME', 
  role: 'PUBLIC', 
  niches: [],
  records: [],
  reservations: [],
  users: [],
  isConnecting: true,
  error: null,
  
  map: { section: 'Cluster A', zoom: 1, search: '' },
  recordsTable: { search: '' },
  modal: {
    isOpen: false,
    nicheId: null,
    isReserving: false,
    isInterring: false,
    isAddingUser: false,
    isExpanding: false
  },
  homeSearch: '',

  admin: {
    tab: 'USERS'
  }
};

// --- API LAYER ---
const api = {
  async safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      if (!text || text.trim() === "") {
         return { error: "Empty response from server. Check if PHP is working." };
      }
      try {
        const json = JSON.parse(text);
        if (json.needs_setup) return { needs_setup: true };
        return json;
      } catch (e) {
        console.error("API parse error at " + url, text);
        const preview = text.substring(0, 100).replace(/<[^>]*>?/gm, '');
        return { error: `Server returned non-JSON response: ${preview}...` };
      }
    } catch (err) {
      return { error: "Network Error: Server is unreachable." };
    }
  },

  async fetchAll() {
    const niches = await this.safeFetch(`${API_BASE_URL}/get_niches.php`);
    if (niches.needs_setup) return { needs_setup: true };
    if (niches.error) return niches;

    const records = await this.safeFetch(`${API_BASE_URL}/get_records.php`);
    const reservations = await this.safeFetch(`${API_BASE_URL}/get_reservations.php`);
    const users = await this.safeFetch(`${API_BASE_URL}/get_users.php`);

    return { niches, records, reservations, users };
  },

  async setupDB() {
    try {
      const res = await fetch(`${API_BASE_URL}/setup_db.php`);
      return await res.json();
    } catch(e) {
      return { error: "Setup script failed to run." };
    }
  },

  async login(username, password) {
    return await this.safeFetch(`${API_BASE_URL}/login.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async createUser(data) {
    return await this.safeFetch(`${API_BASE_URL}/create_user.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createNiche(data) {
    return await this.safeFetch(`${API_BASE_URL}/create_niche.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateNiche(data) {
    return await this.safeFetch(`${API_BASE_URL}/update_niche.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteNiche(id) {
    return await this.safeFetch(`${API_BASE_URL}/delete_niche.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  },

  async createRecord(data) {
    return await this.safeFetch(`${API_BASE_URL}/create_record.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async createReservation(data) {
    return await this.safeFetch(`${API_BASE_URL}/create_reservation.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateReservation(id, status) {
    return await this.safeFetch(`${API_BASE_URL}/update_reservation.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
  },

  async deleteReservation(nicheId) {
    return await this.safeFetch(`${API_BASE_URL}/delete_reservation.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nicheId })
    });
  },

  async deleteRecord(recordId) {
    return await this.safeFetch(`${API_BASE_URL}/delete_record.php`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId })
    });
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  renderAppShell();
  loadData();
});

async function loadData() {
  state.isConnecting = true;
  state.error = null;
  renderMainContent();

  try {
    let data = await api.fetchAll();
    
    if (data.needs_setup) {
      const setupRes = await api.setupDB();
      if (setupRes.error) {
        state.error = setupRes.error;
      } else {
        data = await api.fetchAll();
      }
    }

    if (data.error) {
       state.error = data.error;
    } else if (data.niches) {
      state.niches = Array.isArray(data.niches) ? data.niches.map(n => ({
        ...n,
        row: parseInt(n.row), col: parseInt(n.col), price: parseFloat(n.price), capacity: parseInt(n.capacity || 6)
      })) : [];
      state.records = data.records || [];
      state.reservations = data.reservations || [];
      state.users = data.users || [];
      
      const sections = Array.from(new Set(state.niches.map(n => n.section))).sort();
      if (sections.length > 0 && !sections.includes(state.map.section)) {
        state.map.section = sections[0];
      }
    }
  } catch (err) {
    state.error = 'Communication failure. Ensure MySQL and Apache are running in XAMPP.';
  } finally {
    state.isConnecting = false;
    updateUI();
  }
}

function updateUI() {
  renderSidebar();
  renderTopbar();
  renderMainContent();
}

function renderAppShell() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="flex h-screen bg-church-50 overflow-hidden font-sans">
      <div id="sidebar-container" class="w-64 bg-church-900 text-white flex flex-col h-full shadow-xl z-20"></div>
      <main class="flex-1 flex flex-col relative overflow-hidden">
        <header id="topbar-container" class="h-16 bg-white border-b border-church-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10"></header>
        <div class="flex-1 overflow-auto bg-church-50" id="content-viewport">
           <div id="main-content" class="h-full fade-in"></div>
        </div>
      </main>
      <div id="modal-container"></div>
    </div>
  `;
}

function renderSidebar() {
  const container = document.getElementById('sidebar-container');
  const isPublic = state.role === 'PUBLIC';
  
  let navItems = isPublic ? [
    { id: 'HOME', label: 'Home', icon: 'home' },
    { id: 'MAP', label: 'Cluster Map', icon: 'grid-3x3' },
    { id: 'ABOUT', label: 'About Us', icon: 'info' }
  ] : [
    { id: 'DASHBOARD', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'MAP', label: 'Cluster Map', icon: 'grid-3x3' },
    { id: 'APPOINTMENTS', label: 'Appointments', icon: 'calendar-check' },
    { id: 'RECORDS', label: 'Records', icon: 'users' },
    { id: 'ABOUT', label: 'About Us', icon: 'info' }
  ];

  if (state.role === 'ADMIN') {
    navItems.push({ id: 'ADMIN_PANEL', label: 'Admin Panel', icon: 'shield-alert' });
  }

  let navHTML = navItems.map(item => {
    const isActive = state.view === item.id;
    return `
      <button onclick="setView('${item.id}')" class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-church-800 text-church-goldLight border-l-4 border-church-gold' : 'text-church-300 hover:bg-church-800 hover:text-white'}">
        <i data-lucide="${item.icon}" class="${isActive ? 'text-church-gold' : ''} w-5 h-5"></i>
        <span class="font-medium">${item.label}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="p-6 border-b border-church-800 text-center">
      <div class="w-12 h-12 bg-church-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-church-700 shadow-inner">
        <i data-lucide="church" class="w-6 h-6 text-church-gold"></i>
      </div>
      <h1 class="text-[10px] font-bold uppercase tracking-[0.2em] text-church-400">Columbarium</h1>
      <h2 class="text-sm font-serif text-church-200">Maria Della Strada</h2>
    </div>
    <div class="flex-1 py-6 px-4 space-y-2 overflow-y-auto">${navHTML}</div>
    <div class="p-4 border-t border-church-800 bg-church-950/50">
      ${isPublic 
        ? `<button onclick="setView('LOGIN')" class="w-full flex items-center justify-center space-x-2 bg-church-800 hover:bg-church-700 text-white rounded p-3 text-sm transition-colors shadow-sm border border-church-700 active:scale-95"><i data-lucide="log-in" class="w-4 h-4"></i><span>Staff Portal</span></button>`
        : `<button onclick="logout()" class="w-full flex items-center justify-center space-x-2 bg-red-900/30 hover:bg-red-900/60 text-red-200 border border-red-900/50 rounded p-2 text-sm transition-colors active:scale-95"><i data-lucide="log-out" class="w-4 h-4"></i><span>Logout</span></button>`
      }
    </div>
  `;
  lucide.createIcons();
}

function renderTopbar() {
  const container = document.getElementById('topbar-container');
  const viewTitle = state.view.replace('_', ' ').toLowerCase();
  
  container.innerHTML = `
    <div class="flex items-center gap-3"><h2 class="text-lg font-medium text-church-800 capitalize">${viewTitle}</h2></div>
    <div class="flex items-center gap-4 text-sm">
      <span class="text-church-500 bg-church-100 px-3 py-1 rounded-full border border-church-200 text-[10px] font-bold uppercase tracking-widest">Access: ${state.role}</span>
    </div>
  `;
}

function renderMainContent() {
  const container = document.getElementById('main-content');
  container.className = state.view === 'HOME' ? 'h-full fade-in' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full h-full fade-in';

  if (state.isConnecting) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-church-400"><i data-lucide="refresh-cw" class="w-8 h-8 animate-spin mb-4 text-church-300"></i><p>Establishing Connection...</p></div>`;
    lucide.createIcons();
    return;
  }

  if (state.error && state.view !== 'LOGIN') {
    container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center p-10 max-w-lg mx-auto"><i data-lucide="alert-circle" class="w-16 h-16 text-red-500 mb-4"></i><h2 class="text-2xl font-bold mb-2">Connection Error</h2><p class="text-church-500 mb-6 text-sm">${state.error}</p><button onclick="loadData()" class="px-6 py-2 bg-church-800 text-white rounded-lg shadow-lg active:scale-95">Retry Connection</button></div>`;
    lucide.createIcons();
    return;
  }

  switch(state.view) {
    case 'HOME': renderHome(container); break;
    case 'LOGIN': renderLogin(container); break;
    case 'DASHBOARD': renderDashboard(container); break;
    case 'MAP': renderMap(container); break;
    case 'RECORDS': renderRecords(container); break;
    case 'APPOINTMENTS': renderAppointments(container); break;
    case 'ADMIN_PANEL': renderAdminPanel(container); break;
    case 'ABOUT': renderAbout(container); break;
  }
  lucide.createIcons();
}

function renderHome(container) {
  let searchResultsHTML = '';
  if (state.homeSearch.trim() !== '') {
    const term = state.homeSearch.toLowerCase().trim();
    const results = state.records.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) || r.nicheId.toLowerCase().includes(term));
    
    if (results.length > 0) {
      searchResultsHTML = `<div class="mt-4 text-left w-full space-y-3 max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-2xl border border-church-100 max-h-80 overflow-y-auto slide-in absolute top-full left-0 right-0 z-[100]">
        ${results.map(r => {
          const niche = state.niches.find(n => n.id === r.nicheId);
          return `<div onclick="goToMapLocation('${r.nicheId}', '${niche?.section}')" class="bg-white p-4 rounded-xl hover:bg-church-50 cursor-pointer transition-all border border-church-50 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-church-100 text-church-800 rounded-full flex items-center justify-center font-bold uppercase text-xs shadow-inner">${r.firstName[0]}${r.lastName[0]}</div>
              <div><h4 class="font-bold text-church-900">${r.firstName} ${r.lastName}</h4><p class="text-[10px] text-church-400 font-bold uppercase tracking-wider">${niche?.section || 'Section'} • ${r.nicheId}</p></div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-church-300"></i>
          </div>`;
        }).join('')}
      </div>`;
    }
  }

  container.innerHTML = `
    <div class="h-full flex flex-col items-center pt-12 animate-in fade-in px-4 pb-20 max-w-6xl mx-auto overflow-y-auto scrollbar-hide">
      
      <!-- Hero Logo Section -->
      <div class="text-center mb-10">
        <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-church-50 transition-transform hover:rotate-2">
          <i data-lucide="church" class="w-10 h-10 text-church-gold"></i>
        </div>
        <h1 class="text-5xl md:text-6xl font-serif text-church-900 mb-4 tracking-tight">Locate a Loved One</h1>
        <p class="text-church-500 max-w-2xl mx-auto text-lg leading-relaxed font-light">Search the digital registry of Maria Della Strada Columbarium to find exact niche locations and memorial details.</p>
      </div>

      <!-- Centered Search -->
      <div class="w-full max-w-2xl relative mb-16">
        <div class="relative group shadow-2xl rounded-[2rem] overflow-visible">
           <i data-lucide="search" class="absolute left-8 top-1/2 -translate-y-1/2 text-church-400 w-6 h-6 group-focus-within:text-church-gold transition-colors"></i>
           <input type="text" id="homeSearchInput" placeholder="Search by first name, last name, or niche ID..." value="${state.homeSearch}" class="w-full pl-20 pr-8 py-8 bg-white border-2 border-transparent rounded-[2rem] focus:border-church-gold outline-none text-xl transition-all shadow-sm" />
           ${searchResultsHTML}
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        <button onclick="setView('MAP')" class="group p-8 bg-white border border-church-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex items-center gap-8">
          <div class="w-16 h-16 bg-church-50 rounded-2xl flex items-center justify-center text-church-700 group-hover:bg-church-800 group-hover:text-white transition-all shadow-inner">
            <i data-lucide="map" class="w-8 h-8"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-church-900 mb-1">Browse Niche Map</h3>
            <p class="text-sm text-church-400 leading-relaxed">View the complete columbarium layout and visually explore availability.</p>
          </div>
        </button>
        <button onclick="setView('ABOUT')" class="group p-8 bg-white border border-church-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex items-center gap-8">
          <div class="w-16 h-16 bg-church-50 rounded-2xl flex items-center justify-center text-church-700 group-hover:bg-church-800 group-hover:text-white transition-all shadow-inner">
            <i data-lucide="info" class="w-8 h-8"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-church-900 mb-1">Visit & About</h3>
            <p class="text-sm text-church-400 leading-relaxed">Location, map, and contact information for the Maria Della Strada Columbarium.</p>
          </div>
        </button>
      </div>

    </div>
  `;

  document.getElementById('homeSearchInput').addEventListener('input', (e) => {
    state.homeSearch = e.target.value;
    renderHome(container);
    lucide.createIcons();
    const input = document.getElementById('homeSearchInput');
    input.focus();
    input.setSelectionRange(state.homeSearch.length, state.homeSearch.length);
  });
}

function renderAbout(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto py-10 fade-in h-full flex flex-col">
      <div class="mb-12 shrink-0">
        <h2 class="text-4xl font-serif text-church-900 mb-4">About Maria Della Strada Columbarium</h2>
        <p class="text-church-500 text-lg max-w-3xl">A sacred and peaceful resting place within the community of Santa Maria Della Strada Parish Church.</p>
      </div>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch min-h-0">
        <div class="space-y-10 overflow-y-auto pr-4 scrollbar-hide">
          <div class="bg-white p-10 rounded-[3rem] border border-church-100 shadow-sm">
            <h3 class="text-2xl font-bold mb-8 flex items-center gap-3"><i data-lucide="map-pin" class="text-church-gold"></i> Location Details</h3>
            
            <div class="space-y-6">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-church-50 flex items-center justify-center text-church-400 shrink-0"><i data-lucide="navigation" class="w-5 h-5"></i></div>
                <div><p class="text-[10px] font-bold uppercase text-church-400 tracking-widest mb-1">Address</p><p class="text-lg font-medium">Katipunan Ave., Pansol, Quezon City</p></div>
              </div>
              
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-church-50 flex items-center justify-center text-church-400 shrink-0"><i data-lucide="clock" class="w-5 h-5"></i></div>
                <div><p class="text-[10px] font-bold uppercase text-church-400 tracking-widest mb-1">Operating Hours</p><p class="text-lg font-medium">Open Daily: 8:00 AM - 5:00 PM</p></div>
              </div>

              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-church-50 flex items-center justify-center text-church-400 shrink-0"><i data-lucide="phone" class="w-5 h-5"></i></div>
                <div><p class="text-[10px] font-bold uppercase text-church-400 tracking-widest mb-1">Parish Office</p><p class="text-lg font-medium">(02) 8924-4733</p></div>
              </div>
            </div>

            <div class="mt-12 flex gap-4">
               <a href="https://www.google.com/maps/place/Santa+Maria+della+Strada+Parish+(Diocese+of+Cubao)/@14.647582,121.0725594,17z" target="_blank" class="px-8 py-4 bg-church-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-church-800 shadow-xl transition-all active:scale-95">
                 <i data-lucide="map" class="w-5 h-5"></i> Open in Google Maps
               </a>
            </div>
          </div>

          <div class="bg-church-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
             <div class="relative z-10">
                <h3 class="text-2xl font-bold mb-4 font-serif">Mission & Vision</h3>
                <p class="text-church-400 leading-relaxed mb-6">Providing a dignity-centered sanctuary for the faithful departed, fostering a space for prayer, remembrance, and community.</p>
             </div>
             <i data-lucide="church" class="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 opacity-50"></i>
          </div>
        </div>

        <div class="rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-church-200 relative">
           <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.141527581515!2d121.07255941164925!3d14.647581985786444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b77cc095356b%3A0xf41c4be4d14101!2sSanta%20Maria%20della%20Strada%20Parish%20(Diocese%20of%20Cubao)!5e0!3m2!1sen!2sph!4v1740000000000!5m2!1sen!2sph" 
            class="absolute inset-0 w-full h-full grayscale-[0.1]" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function renderDashboard(container) {
  const total = state.niches.length;
  const occ = state.records.length;
  const resApproved = state.reservations.filter(r => r.status === 'APPROVED').length;
  const available = total - occ - resApproved;
  
  const occPercent = total > 0 ? ((occ / total) * 100).toFixed(1) : 0;
  const availPercent = total > 0 ? ((available / total) * 100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="flex flex-col gap-10">
      <h2 class="text-3xl font-bold text-church-900 font-serif tracking-tight">Columbarium Overview</h2>
      
      <!-- Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-8 rounded-[2rem] border border-church-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all">
           <div><p class="text-[10px] uppercase font-bold text-church-400 mb-2 tracking-widest">Total Niches</p><h3 class="text-5xl font-bold text-church-900">${total}</h3></div>
           <div class="w-14 h-14 bg-church-50 rounded-2xl flex items-center justify-center text-church-400 group-hover:bg-church-800 group-hover:text-white transition-all"><i data-lucide="layout-grid" class="w-6 h-6"></i></div>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-church-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all">
           <div>
              <p class="text-[10px] uppercase font-bold text-church-400 mb-2 tracking-widest">Available</p>
              <h3 class="text-5xl font-bold text-church-900">${available}</h3>
              <p class="text-[10px] text-emerald-600 font-bold mt-2 uppercase">${availPercent}%</p>
           </div>
           <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all"><i data-lucide="check-circle-2" class="w-6 h-6"></i></div>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-church-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all">
           <div>
              <p class="text-[10px] uppercase font-bold text-church-400 mb-2 tracking-widest">Occupied</p>
              <h3 class="text-5xl font-bold text-church-900">${occ}</h3>
              <p class="text-[10px] text-blue-600 font-bold mt-2 uppercase">${occPercent}%</p>
           </div>
           <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><i data-lucide="users" class="w-6 h-6"></i></div>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-church-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all">
           <div>
              <p class="text-[10px] uppercase font-bold text-church-400 mb-2 tracking-widest">Reserved</p>
              <h3 class="text-5xl font-bold text-church-900">${resApproved}</h3>
              <p class="text-[10px] text-amber-600 font-bold mt-2 uppercase">Pending interment</p>
           </div>
           <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all"><i data-lucide="clock" class="w-6 h-6"></i></div>
        </div>
      </div>

      <!-- Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div class="lg:col-span-2 bg-white rounded-[2.5rem] border border-church-100 p-10 shadow-sm relative overflow-hidden">
          <h3 class="font-bold text-xl flex items-center gap-3 mb-10"><i data-lucide="trending-up" class="w-6 h-6 text-church-400"></i> Capacity</h3>
          <div class="h-80 w-full flex items-center justify-center">
            <canvas id="capacityChart"></canvas>
          </div>
        </div>
        <div class="bg-white rounded-[2.5rem] border border-church-100 p-10 shadow-sm">
           <h3 class="font-bold text-xl mb-8 flex items-center gap-3"><i data-lucide="settings" class="w-6 h-6 text-church-400"></i> System Status</h3>
           <div class="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl flex items-start gap-6 shadow-sm">
             <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><i data-lucide="check" class="w-6 h-6"></i></div>
             <div><h4 class="font-bold text-emerald-900 mb-1">System Healthy</h4><p class="text-xs text-emerald-600 leading-relaxed">All digital records are synced.</p></div>
           </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    initDashboardChart(available, occ, resApproved);
    lucide.createIcons();
  }, 50);
}

function initDashboardChart(available, occupied, reserved) {
  const ctx = document.getElementById('capacityChart')?.getContext('2d');
  if (!ctx) return;
  const existingChart = Chart.getChart("capacityChart");
  if (existingChart) existingChart.destroy();

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Available', 'Occupied', 'Reserved'],
      datasets: [{
        data: [available, occupied, reserved],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
        borderRadius: 10,
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 30, font: { size: 12, weight: 'bold' } } }
      }
    }
  });
}

function renderMap(container) {
  const sections = Array.from(new Set(state.niches.map(n => n.section))).sort();
  if (sections.length === 0) {
    container.innerHTML = `<div class="p-10 text-center"><p class="text-church-400">Database appears empty. Log in to Staff Portal to initialize.</p></div>`;
    return;
  }

  const tabGroups = [
    { label: 'A - E', range: sections.slice(0, 5) },
    { label: 'F - J', range: sections.slice(5, 10) },
    { label: 'K - O', range: sections.slice(10, 15) },
    { label: 'P - T', range: sections.slice(15, 20) },
    { label: 'U - Z', range: sections.slice(20) }
  ];

  let tabsHTML = tabGroups.filter(g => g.range.length > 0).map(group => `
    <div class="flex flex-col gap-1">
      <span class="text-[9px] font-bold text-church-400 uppercase text-center">${group.label}</span>
      <div class="flex gap-1">
        ${group.range.map(sec => `
          <button onclick="setMapSection('${sec}')" class="w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all ${state.map.section === sec ? 'bg-church-800 text-white shadow-md' : 'bg-white text-church-400 border border-church-200 hover:border-church-400'}">
            ${sec.includes(' ') ? sec.split(' ')[1] : sec}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('<div class="w-[1px] h-8 bg-church-200 self-end mx-2"></div>');

  container.innerHTML = `
    <div class="flex flex-col h-[calc(100vh-8rem)]">
      <div class="bg-white p-4 rounded-t-xl border border-church-200 shadow-sm mb-4 flex justify-between items-center overflow-x-auto gap-4 scrollbar-hide">
        <div class="flex items-center min-w-max">${tabsHTML}</div>
        <div class="relative w-48 shrink-0">
          <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-church-400 w-4 h-4"></i>
          <input type="text" id="mapSearchInput" placeholder="Niche ID..." value="${state.map.search}" class="w-full pl-10 pr-4 py-2 border border-church-200 rounded-lg text-sm outline-none focus:border-church-gold transition-colors" />
        </div>
      </div>
      <div class="flex-1 overflow-auto bg-church-100 rounded-xl border border-church-200 p-8 flex justify-center">
         <div id="map-grid-container" class="bg-church-300 p-6 rounded-xl shadow-2xl h-fit"></div>
      </div>
    </div>
  `;
  document.getElementById('mapSearchInput').addEventListener('input', (e) => { state.map.search = e.target.value; renderMapGridOnly(); });
  renderMapGridOnly();
}

function renderMapGridOnly() {
  const container = document.getElementById('map-grid-container');
  if (!container) return;
  const filtered = state.niches.filter(n => n.section === state.map.section);
  
  const rows = Math.max(2, ...filtered.map(n => n.row));
  const cols = Math.max(5, ...filtered.map(n => n.col));

  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  container.style.gap = '12px';

  let gridHTML = '';
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const niche = filtered.find(n => n.row === r && n.col === c);
      if (!niche) {
        gridHTML += `<div class="w-24 h-24 rounded-xl bg-black/5 border border-dashed border-black/10 flex items-center justify-center opacity-20"><i data-lucide="plus" class="w-4 h-4"></i></div>`;
        continue;
      }

      const residents = state.records.filter(rec => rec.nicheId === niche.id);
      const resCount = residents.length;
      const capacity = niche.capacity || 6;
      const isFull = resCount >= capacity;
      const isReserved = niche.status === 'RESERVED';
      const isMatch = state.map.search && niche.id.toLowerCase().includes(state.map.search.toLowerCase());

      let colorClass = 'bg-white border-church-200 text-church-700 hover:border-church-gold hover:shadow-lg';
      if (isFull) colorClass = 'bg-church-800 border-church-900 text-white';
      else if (isReserved) colorClass = 'bg-church-goldLight border-church-gold text-church-900';
      else if (resCount > 0) colorClass = 'bg-blue-50 border-blue-200 text-church-800';

      let slotsHTML = '<div class="grid grid-cols-3 gap-0.5 mt-2 w-10">';
      for(let s=0; s < Math.max(6, capacity); s++) {
        if (s >= capacity) break;
        const filled = s < resCount;
        slotsHTML += `<div class="w-2.5 h-2.5 rounded-full border border-black/5 ${filled ? 'bg-church-800' : 'bg-gray-200'}"></div>`;
      }
      slotsHTML += '</div>';

      gridHTML += `
        <button onclick="openModal('${niche.id}')" class="relative flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 transition-all shadow-sm ${colorClass} ${isMatch ? 'ring-4 ring-yellow-400' : ''} hover:-translate-y-1 active:scale-95">
           <span class="text-[9px] font-bold uppercase opacity-60">${niche.id}</span>
           <span class="text-xs font-bold font-mono">${isReserved ? 'R' : resCount + '/' + capacity}</span>
           ${slotsHTML}
        </button>
      `;
    }
  }
  container.innerHTML = gridHTML;
  lucide.createIcons();
}

function renderAppointments(container) {
  container.innerHTML = `
    <div class="bg-white rounded-[2rem] border border-church-200 overflow-hidden shadow-sm flex flex-col h-[calc(100vh-8rem)]">
      <div class="p-8 border-b border-church-50 bg-church-50/20 flex justify-between items-center">
        <div><h3 class="font-bold text-xl font-serif">Niche Appointments</h3><p class="text-[10px] text-church-400 font-bold uppercase tracking-widest mt-1">${state.reservations.filter(r => r.status === 'PENDING').length} Requests</p></div>
      </div>
      <div class="flex-1 overflow-auto scrollbar-hide">
        <table class="w-full text-left">
          <thead class="bg-church-50 text-[10px] font-bold uppercase text-church-400 sticky top-0 z-10">
            <tr><th class="p-6">Client Name</th><th class="p-6">Niche ID</th><th class="p-6">Contact Number</th><th class="p-6">Desired Date</th><th class="p-6">Status</th><th class="p-6 text-right">Action</th></tr>
          </thead>
          <tbody class="divide-y divide-church-50">
            ${state.reservations.length > 0 ? state.reservations.map(res => `
              <tr class="hover:bg-church-50 transition-colors">
                <td class="p-6 font-bold text-church-900">${res.reservedBy}</td>
                <td class="p-6 font-mono text-xs font-bold">${res.nicheId}</td>
                <td class="p-6 text-church-500 font-mono text-xs">${res.contactNumber}</td>
                <td class="p-6 text-church-800">${res.reservationDate}</td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-[9px] font-bold uppercase ${res.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : res.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}">${res.status}</span></td>
                <td class="p-6 text-right space-x-2 flex items-center justify-end">
                   <button onclick="openModal('${res.nicheId}')" class="bg-church-100 text-church-700 p-2.5 rounded-xl hover:bg-church-200 shadow-sm active:scale-90 transition-all" title="View Associated Niche">
                      <i data-lucide="eye" class="w-4 h-4"></i>
                   </button>
                   ${res.status === 'PENDING' ? `
                     <button onclick="handleApproveReservation('${res.id}')" class="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-lg active:scale-90 transition-all"><i data-lucide="check" class="w-4 h-4"></i></button>
                     <button onclick="handleDeclineReservation('${res.id}')" class="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 shadow-lg active:scale-90 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                   ` : ''}
                </td>
              </tr>
            `).join('') : '<tr><td colspan="6" class="p-20 text-center text-church-300 italic">No appointment requests found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
  lucide.createIcons();
}

function renderModal() {
  const container = document.getElementById('modal-container');
  if (!state.modal.isOpen) { container.innerHTML = ''; return; }

  let bodyHTML = '';
  let headerTitle = '';
  let headerSubtitle = '';

  if (state.modal.isReserving) {
    headerTitle = "Request Appointment";
    headerSubtitle = `Niche ${state.modal.nicheId}`;
    bodyHTML = `
      <form onsubmit="submitAppointmentRequest(event)" class="space-y-6">
        <input required id="appBy" placeholder="Client Full Name" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
        <input required id="appPhone" placeholder="Contact Number" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
        <div>
          <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Desired Date</label>
          <input required id="appDate" type="date" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
        </div>
        <div class="flex gap-4 pt-4">
          <button type="button" onclick="closeModal()" class="flex-1 py-5 bg-church-50 text-church-600 rounded-2xl font-bold">Cancel</button>
          <button type="submit" class="flex-1 py-5 bg-church-gold text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Submit Request</button>
        </div>
      </form>
    `;
  } else if (state.modal.isAddingUser) {
    headerTitle = "Register Personnel";
    bodyHTML = `
      <form onsubmit="submitNewUser(event)" class="space-y-6">
        <input required id="newStaffName" placeholder="Username" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none" />
        <input required id="newStaffPass" type="password" placeholder="Password" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none" />
        <select id="newStaffRole" class="w-full p-5 bg-church-50 border-2 border-transparent rounded-2xl outline-none">
          <option value="STAFF">Staff</option><option value="ADMIN">Admin</option>
        </select>
        <button type="submit" class="w-full py-5 bg-church-800 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Create Account</button>
      </form>
    `;
  } else if (state.modal.isExpanding) {
    headerTitle = "System Expansion";
    headerSubtitle = "Add New Niche to Catalog";
    const existingSections = Array.from(new Set(state.niches.map(n => n.section))).sort();
    
    bodyHTML = `
      <form onsubmit="submitNewNiche(event)" class="space-y-6">
        <div class="space-y-4">
          <div>
            <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Cluster / Section</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select id="nicSecSelect" onchange="toggleNewSectionInput(this.value); suggestNicheID();" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all">
                ${existingSections.map(s => `<option value="${s}">${s}</option>`).join('')}
                <option value="NEW_SECTION">+ Add New Cluster...</option>
              </select>
              <input id="nicSecNew" oninput="suggestNicheID()" placeholder="Cluster Name (e.g. Cluster Z)" class="hidden w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Niche ID</label>
              <input required id="nicId" placeholder="e.g. A-1-1" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Row</label>
                <input required id="nicRow" type="number" value="1" min="1" oninput="suggestNicheID()" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
              </div>
              <div>
                <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Col</label>
                <input required id="nicCol" type="number" value="1" min="1" oninput="suggestNicheID()" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
               <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Price (₱)</label>
               <input required id="nicPrice" type="number" value="220000" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
             </div>
             <div>
               <label class="text-[10px] uppercase font-bold text-church-400 px-1 mb-2 block tracking-widest">Capacity</label>
               <input required id="nicCap" type="number" value="6" min="1" class="w-full p-4 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all" />
             </div>
          </div>
        </div>

        <button type="submit" class="w-full py-6 bg-church-900 text-white rounded-[2rem] font-bold shadow-xl active:scale-95 transition-all mt-4">Integrate Into Catalog</button>
      </form>
    `;
    setTimeout(suggestNicheID, 100);
  } else {
    const niche = state.niches.find(n => n.id === state.modal.nicheId);
    if (!niche) { closeModal(); return; }
    headerTitle = `Niche ${niche.id}`;
    headerSubtitle = `${niche.section} • Status: ${niche.status}`;
    const residents = state.records.filter(r => r.nicheId === niche.id);
    const isAdminOrStaff = state.role === 'ADMIN' || state.role === 'STAFF';
    const isAdmin = state.role === 'ADMIN';
    const isPublic = state.role === 'PUBLIC';
    const isReserved = niche.status === 'RESERVED';
    const hasActiveReservation = state.reservations.some(r => r.nicheId === niche.id && r.status !== 'DECLINED');

    if (state.modal.isInterring) {
      bodyHTML = `
        <form onsubmit="submitInterment(event)" class="space-y-6">
          <div class="grid grid-cols-2 gap-4"><input required id="intFirst" placeholder="First Name" class="border-2 border-church-50 p-4 rounded-2xl" /><input required id="intLast" placeholder="Last Name" class="border-2 border-church-50 p-4 rounded-2xl" /></div>
          <div class="grid grid-cols-2 gap-4"><div><label class="text-[9px] uppercase font-bold">Born</label><input required id="intDob" type="date" class="w-full border-2 border-church-50 p-4 rounded-2xl" /></div><div><label class="text-[9px] uppercase font-bold">Rest</label><input required id="intDod" type="date" class="w-full border-2 border-church-50 p-4 rounded-2xl" /></div></div>
          <button type="submit" class="w-full py-4 bg-church-800 text-white rounded-2xl font-bold">Save Record</button>
        </form>
      `;
    } else {
      bodyHTML = `
        <div class="space-y-8">
          <div class="bg-white p-6 rounded-2xl border border-church-100 shadow-sm space-y-6">
             <div class="flex items-center justify-between px-1">
                <h4 class="text-[10px] uppercase font-bold text-church-400 tracking-widest">Niche Specifications</h4>
                ${isAdmin ? `<button onclick="handleDeleteNiche('${niche.id}')" class="text-[9px] font-bold text-red-500 uppercase hover:underline">Delete Niche</button>` : ''}
             </div>
             ${isAdmin ? `
               <form onsubmit="handleUpdateNiche(event, '${niche.id}')" class="space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                   <div class="space-y-1">
                     <label class="text-[9px] font-bold text-church-400 uppercase px-1">Capacity</label>
                     <input type="number" id="editCap" value="${niche.capacity}" class="w-full p-4 bg-church-50 rounded-2xl border-2 border-transparent focus:border-church-gold outline-none transition-all" />
                   </div>
                   <div class="space-y-1">
                     <label class="text-[9px] font-bold text-church-400 uppercase px-1">Price (₱)</label>
                     <input type="number" id="editPrice" value="${niche.price}" class="w-full p-4 bg-church-50 rounded-2xl border-2 border-transparent focus:border-church-gold outline-none transition-all" />
                   </div>
                 </div>
                 <button type="submit" class="w-full py-4 bg-church-900 text-white rounded-2xl font-bold shadow-lg hover:bg-church-800 active:scale-95 transition-all">Save Specifications</button>
               </form>
             ` : `
               <div class="grid grid-cols-2 gap-4 text-center">
                 <div class="p-4 bg-church-50 rounded-2xl border border-church-100 flex flex-col items-center">
                   <p class="text-[10px] text-church-400 uppercase font-bold mb-1">Total Capacity</p>
                   <p class="text-2xl font-serif text-church-900">${niche.capacity} Slots</p>
                 </div>
                 <div class="p-4 bg-church-50 rounded-2xl border border-church-100 flex flex-col items-center">
                   <p class="text-[10px] text-church-400 uppercase font-bold mb-1">Base Price</p>
                   <p class="text-2xl font-serif text-church-900">₱${niche.price.toLocaleString()}</p>
                 </div>
               </div>
             `}
          </div>

          <div class="bg-church-50 p-8 rounded-[2rem] border border-church-200">
             <div class="flex items-center justify-between mb-6">
                <h4 class="text-[10px] uppercase font-bold text-church-400 tracking-widest px-1">Current Residents (${residents.length}/${niche.capacity})</h4>
             </div>
             ${residents.length > 0 ? `
               <div class="space-y-4">
                 ${residents.map(r => `
                   <div class="flex justify-between items-center p-5 bg-white border border-church-100 rounded-2xl shadow-sm">
                     <div><p class="font-bold text-church-900 text-lg">${r.firstName} ${r.lastName}</p><p class="text-[10px] text-church-400 mt-1 uppercase font-bold">${r.dateOfBirth} — ${r.dateOfDeath}</p></div>
                     ${isAdminOrStaff ? `<button onclick="handleDeleteRecord('${r.id}')" class="text-church-200 hover:text-red-500 transition-colors p-2"><i data-lucide="trash-2" class="w-5 h-5"></i></button>` : ''}
                   </div>
                 `).join('')}
               </div>
             ` : '<div class="text-center py-10"><p class="text-xs text-church-400 font-medium">Empty Niche</p></div>'}
          </div>

          <div class="space-y-2">
            ${isAdminOrStaff ? `
              <div class="flex flex-col gap-2">
                ${residents.length < niche.capacity ? `<button onclick="startInterment()" class="w-full py-5 bg-church-800 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg">Inter a Loved One</button>` : ''}
                ${(isReserved || hasActiveReservation) ? `<button onclick="handleReleaseNiche('${niche.id}')" class="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all active:scale-95 border-2 border-red-100">Release / Cancel Reservation</button>` : ''}
              </div>
            ` : isPublic && niche.status === 'AVAILABLE' && residents.length === 0 ? `
              <button onclick="startAppointmentRequest()" class="w-full py-6 bg-church-gold text-white rounded-[2rem] font-bold shadow-2xl hover:shadow-gold/20 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"><i data-lucide="calendar" class="w-6 h-6"></i> Request Appointment</button>
            ` : ''}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="fixed inset-0 bg-church-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4" onclick="closeModal()">
      <div class="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden relative fade-in" onclick="event.stopPropagation()">
        <div class="p-10 border-b border-church-50 flex justify-between items-start bg-church-50/50">
           <div><h2 class="text-3xl font-bold text-church-800 font-serif tracking-tight">${headerTitle}</h2><p class="text-[10px] font-bold text-church-400 uppercase tracking-widest mt-1">${headerSubtitle}</p></div>
           <button onclick="closeModal()" class="p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>
        <div class="p-10 overflow-y-auto max-h-[75vh] scrollbar-hide">${bodyHTML}</div>
      </div>
    </div>
  `;
  lucide.createIcons();
}

// --- HANDLERS ---
window.toggleNewSectionInput = (val) => {
  const newSecInput = document.getElementById('nicSecNew');
  if (val === 'NEW_SECTION') {
    newSecInput.classList.remove('hidden');
    newSecInput.setAttribute('required', 'true');
    newSecInput.focus();
  } else {
    newSecInput.classList.add('hidden');
    newSecInput.removeAttribute('required');
  }
};

window.suggestNicheID = () => {
  const nicIdInput = document.getElementById('nicId');
  if (!nicIdInput) return;
  
  const selectVal = document.getElementById('nicSecSelect').value;
  const newSecVal = document.getElementById('nicSecNew').value;
  const row = document.getElementById('nicRow').value;
  const col = document.getElementById('nicCol').value;

  let clusterRaw = (selectVal === 'NEW_SECTION') ? newSecVal : selectVal;
  // Extract letter from "Cluster A" or "A"
  let clusterLetter = clusterRaw.replace(/Cluster\s+/i, "").trim().charAt(0).toUpperCase();

  if (clusterLetter && row && col) {
    nicIdInput.value = `${clusterLetter}-${row}-${col}`;
  }
};

window.handleUpdateNiche = async (e, id) => {
  e.preventDefault();
  const cap = document.getElementById('editCap').value;
  const price = document.getElementById('editPrice').value;
  
  const res = await api.updateNiche({ id, capacity: cap, price: price });
  if (res.success) {
    alert("Niche details updated successfully.");
    loadData();
    closeModal();
  } else {
    alert("Update failed: " + (res.error || "Unknown error"));
  }
};

window.handleDeleteNiche = async (id) => {
  const residents = state.records.filter(r => r.nicheId === id);
  const msg = residents.length > 0 
    ? `This niche contains ${residents.length} residents. Deleting this niche will also REMOVE these records permanently. Are you absolutely sure?`
    : `Are you sure you want to delete Niche ${id}? This cannot be undone.`;
    
  if (!confirm(msg)) return;
  if (!confirm("Final Confirmation: Delete Niche catalog entry?")) return;

  const res = await api.deleteNiche(id);
  if (res.success) {
    alert("Niche removed from catalog.");
    loadData();
    closeModal();
  } else {
    alert("Deletion failed: " + (res.error || "Unknown error"));
  }
};

window.handleReleaseNiche = async (nicheId) => {
  if(!confirm("Release this niche? This will clear any active reservations and mark it as AVAILABLE.")) return;
  
  // 1. Delete the reservation records
  const delRes = await api.deleteReservation(nicheId);
  if (!delRes.success) {
      console.warn("Minor issue clearing reservation records: " + (delRes.error || ""));
  }

  // 2. Update the niche status to AVAILABLE
  const updateRes = await api.updateNiche({ id: nicheId, status: 'AVAILABLE' });
  if (updateRes.success) {
      alert("Niche successfully released and marked as available.");
      await loadData(); // Force re-sync with server
      closeModal();
  } else {
      alert("Error: Failed to update niche status. " + (updateRes.error || ""));
  }
};

window.submitAppointmentRequest = async (e) => {
  e.preventDefault();
  const data = {
    id: `APP-${Date.now()}`,
    nicheId: state.modal.nicheId,
    reservedBy: document.getElementById('appBy').value,
    contactNumber: document.getElementById('appPhone').value,
    reservationDate: document.getElementById('appDate').value,
    status: 'PENDING'
  };
  
  try {
    const res = await api.createReservation(data);
    if(res.success) {
      alert("Appointment request submitted! We will contact you soon.");
      loadData();
      closeModal();
    } else {
      alert("Failed to submit request: " + (res.error || "Unknown error"));
    }
  } catch (err) {
    alert("Communication error. Please ensure the server is running.");
  }
};

window.submitNewNiche = async (e) => {
  e.preventDefault();
  const selectVal = document.getElementById('nicSecSelect').value;
  const section = selectVal === 'NEW_SECTION' ? document.getElementById('nicSecNew').value : selectVal;
  const id = document.getElementById('nicId').value.trim();

  // Client side duplicate check for better UX
  if (state.niches.some(n => n.id.toLowerCase() === id.toLowerCase())) {
      alert(`Error: Niche ID '${id}' already exists in the catalog.`);
      return;
  }
  
  const data = {
    id: id,
    section: section,
    row: document.getElementById('nicRow').value,
    col: document.getElementById('nicCol').value,
    price: document.getElementById('nicPrice').value,
    capacity: document.getElementById('nicCap').value
  };

  const res = await api.createNiche(data);
  if(res.success) { 
    alert("New Niche successfully integrated into " + section); 
    loadData(); 
    closeModal(); 
  } else {
    alert("Expansion failed: " + (res.error || "Ensure ID is unique"));
  }
};

window.handleLogin = async (e) => {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const errDiv = document.getElementById('login-error');
  errDiv.classList.add('hidden');
  
  const res = await api.login(u, p);
  if (res.success) { 
    state.role = res.role; 
    setView('DASHBOARD'); 
    loadData(); 
  } else { 
    errDiv.innerHTML = `${res.error || "Login Failed."}<br><button onclick="api.setupDB().then(()=>alert('Database Reset. Credentials are admin / admin123'))" class="mt-2 text-[10px] underline hover:text-church-900 transition-colors">Reset System Database</button>`; 
    errDiv.classList.remove('hidden'); 
  }
};

window.logout = () => { state.role = 'PUBLIC'; setView('HOME'); loadData(); };
window.setView = (view) => { state.view = view; updateUI(); const vp = document.getElementById('content-viewport'); if(vp) vp.scrollTo(0,0); };
window.setMapSection = (section) => { state.map.section = section; renderMapGridOnly(); renderMap(document.getElementById('main-content')); };
window.openModal = (nId) => { state.modal.nicheId = nId; state.modal.isOpen = true; state.modal.isInterring = false; state.modal.isReserving = false; state.modal.isAddingUser = false; state.modal.isExpanding = false; renderModal(); };
window.closeModal = () => { state.modal.isOpen = false; state.modal.isAddingUser = false; state.modal.isExpanding = false; state.modal.isReserving = false; renderModal(); };
window.goToMapLocation = (nId, sec) => { if (sec) state.map.section = sec; state.map.search = nId; setView('MAP'); };
window.startInterment = () => { state.modal.isInterring = true; renderModal(); };
window.startAppointmentRequest = () => { state.modal.isReserving = true; renderModal(); };
window.cancelForms = () => { state.modal.isInterring = false; renderModal(); };
window.openAddUserModal = () => { state.modal.isOpen = true; state.modal.isAddingUser = true; renderModal(); };
window.openExpansionModal = () => { state.modal.isOpen = true; state.modal.isExpanding = true; renderModal(); };

function renderRecords(container) {
  container.innerHTML = `
    <div class="bg-white rounded-[2rem] border border-church-200 overflow-hidden h-[calc(100vh-8rem)] flex flex-col shadow-sm">
       <div class="p-8 border-b border-church-50 bg-church-50/20 flex justify-between items-center"><div><h3 class="font-bold text-xl font-serif">Registry</h3></div><input id="recTableSearch" placeholder="Search..." class="w-64 pl-4 pr-4 py-2 border rounded-xl text-sm" value="${state.recordsTable.search}" /></div>
       <div class="flex-1 overflow-auto scrollbar-hide"><table class="w-full text-left text-sm"><thead class="bg-church-50 text-[10px] font-bold uppercase text-church-400 sticky top-0 z-10"><tr><th class="p-6">Resident Name</th><th class="p-6">Location</th><th class="p-6">Interment Date</th></tr></thead><tbody id="recTableBody" class="divide-y divide-church-50"></tbody></table></div>
    </div>
  `;
  document.getElementById('recTableSearch').addEventListener('input', (e) => { state.recordsTable.search = e.target.value; renderRecTable(); });
  renderRecTable();
}

function renderRecTable() {
  const tbody = document.getElementById('recTableBody');
  if(!tbody) return;
  const term = state.recordsTable.search.toLowerCase();
  const filtered = state.records.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) || r.nicheId.toLowerCase().includes(term));
  tbody.innerHTML = filtered.map(r => `<tr class="hover:bg-church-50 cursor-pointer group" onclick="goToMapLocation('${r.nicheId}')"><td class="p-6 font-bold text-church-900">${r.lastName}, ${r.firstName}</td><td class="p-6 font-mono text-xs">${r.nicheId}</td><td class="p-6 text-church-400">${r.intermentDate}</td></tr>`).join('') || '<tr><td colspan="3" class="p-10 text-center">No matches found.</td></tr>';
}

function renderAdminPanel(container) {
  container.innerHTML = `<div class="p-10 bg-white rounded-[2.5rem] border"><h3 class="text-2xl font-bold mb-8 font-serif">Management</h3><div class="space-y-4"><button onclick="openExpansionModal()" class="w-full py-5 bg-church-800 text-white rounded-2xl font-bold hover:bg-church-700 transition-colors">Add New Niche</button><button onclick="openAddUserModal()" class="w-full py-5 bg-church-100 text-church-800 rounded-2xl font-bold hover:bg-church-200 transition-colors">Register Staff</button></div></div>`;
}

function renderLogin(container) {
  container.innerHTML = `
    <div class="h-full flex items-center justify-center p-4">
      <div class="bg-white p-14 rounded-[3rem] shadow-2xl w-full max-w-md border border-church-50 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-church-gold"></div>
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-church-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-church-gold shadow-inner"><i data-lucide="lock" class="w-8 h-8"></i></div>
          <h2 class="text-4xl font-bold text-church-900 font-serif tracking-tight">Staff Portal</h2>
          <p class="text-church-400 mt-3 font-light">Access for authorized parish personnel.</p>
        </div>
        <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-6">
          <div id="login-error" class="hidden text-sm text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 text-center font-bold"></div>
          <div class="space-y-4">
            <input id="username" placeholder="Username" required class="w-full p-6 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all shadow-sm" />
            <input id="password" type="password" placeholder="Password" required class="w-full p-6 bg-church-50 border-2 border-transparent rounded-2xl outline-none focus:border-church-gold transition-all shadow-sm" />
          </div>
          <button type="submit" class="w-full py-6 bg-church-900 text-white rounded-[1.5rem] font-bold shadow-2xl hover:bg-church-800 transition-all active:scale-95">Authenticate</button>
        </form>
      </div>
    </div>
  `;
  lucide.createIcons();
}

window.submitInterment = async (e) => {
  e.preventDefault();
  const res = await api.createRecord({ id: `REC-${Date.now()}`, nicheId: state.modal.nicheId, firstName: document.getElementById('intFirst').value, lastName: document.getElementById('intLast').value, dateOfBirth: document.getElementById('intDob').value, dateOfDeath: document.getElementById('intDod').value, intermentDate: new Date().toISOString().split('T')[0], notes: '' });
  if(res.success) { loadData(); state.modal.isInterring = false; renderModal(); }
};

window.handleDeleteRecord = async (id) => {
  if(!confirm("Delete record permanently?")) return;
  if((await api.deleteRecord(id)).success) { loadData(); renderModal(); }
};

window.handleApproveReservation = async (id) => {
  if(!confirm("Approve this appointment? This will mark the niche as RESERVED.")) return;
  const res = await api.updateReservation(id, 'APPROVED');
  if(res.success) { loadData(); }
};

window.handleDeclineReservation = async (id) => {
  if(!confirm("Decline and delete this appointment request?")) return;
  const res = await api.updateReservation(id, 'DECLINED');
  if(res.success) { loadData(); }
};

window.submitNewUser = async (e) => {
  e.preventDefault();
  const res = await api.createUser({ username: document.getElementById('newStaffName').value, password: document.getElementById('newStaffPass').value, role: document.getElementById('newStaffRole').value });
  if(res.success) { alert("Staff account created."); loadData(); closeModal(); }
};