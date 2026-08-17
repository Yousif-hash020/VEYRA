

function switchTab(tab) {
  const loginPanel = document.getElementById('panel-login');
  const registerPanel = document.getElementById('panel-register');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const indicator = document.getElementById('tabIndicator');

  loginPanel.classList.toggle('active', tab === 'login');
  registerPanel.classList.toggle('active', tab === 'register');

  tabLogin.classList.toggle('active', tab === 'login');
  tabRegister.classList.toggle('active', tab === 'register');

  indicator.classList.toggle('right', tab === 'register');

  document.title = tab === 'login' ? 'VEYRA | Sign In' : 'VEYRA | Create Account';

  clearAlerts();
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD VISIBILITY TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';

  btn.innerHTML = isHidden
    ? `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
         <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`
    : `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH METER
// ─────────────────────────────────────────────────────────────────────────────
const passwordInput = document.getElementById('rg-password');
if (passwordInput) {
  passwordInput.addEventListener('input', updateStrength);
}

function updateStrength() {
  const val = document.getElementById('rg-password').value;
  const bars = ['s1', 's2', 's3', 's4'];
  const label = document.getElementById('strengthLabel');

  bars.forEach(id => { document.getElementById(id).className = 'strength-bar'; });

  if (!val) { label.textContent = 'Strength'; label.style.color = ''; return; }

  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { cls: 'weak', text: 'Weak', color: '#EF4444' },
    { cls: 'fair', text: 'Fair', color: '#F4B860' },
    { cls: 'good', text: 'Good', color: '#60A5FA' },
    { cls: 'strong', text: 'Strong', color: '#10B981' },
  ];
  const level = levels[score - 1] || levels[0];

  for (let i = 0; i < score; i++) {
    document.getElementById(bars[i]).classList.add(level.cls);
  }
  label.textContent = level.text;
  label.style.color = level.color;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function setError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error');
  if (error) error.textContent = message;
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error');
  if (error) error.textContent = '';
}

function clearAllErrors(ids) {
  ids.forEach(([inputId, errorId]) => clearError(inputId, errorId));
}

function clearAlerts() {
  ['lg-alert', 'rg-alert'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'auth-alert'; el.textContent = ''; }
  });
}

function showAlert(alertId, message, type = 'error') {
  const el = document.getElementById(alertId);
  if (!el) return;
  el.textContent = message;
  el.className = `auth-alert show ${type}`;
}

function isValidEmail(email) {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
}

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON LOADING STATE
// ─────────────────────────────────────────────────────────────────────────────
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN FORM — add your backend call here
// ─────────────────────────────────────────────────────────────────────────────
let login_form = document.getElementById('loginForm');

login_form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('lg-email').value.trim();
  const password = document.getElementById('lg-password').value;

  // Clear previous state
  clearAllErrors([['lg-email', 'lg-email-error'], ['lg-password', 'lg-password-error']]);
  clearAlerts();

  // Client-side validation
  let hasErrors = false;
  if (!email) {
    setError('lg-email', 'lg-email-error', 'Email is required');
    hasErrors = true;
  } else if (!isValidEmail(email)) {
    setError('lg-email', 'lg-email-error', 'Please enter a valid email address');
    hasErrors = true;
  }
  if (!password) {
    setError('lg-password', 'lg-password-error', 'Password is required');
    hasErrors = true;
  }
  if (hasErrors) return;


  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Login failed:", data);
    showAlert("lg-alert", data.message || "Invalid email or password", "error");
    return;
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  showAlert("lg-alert", "Login successful! Redirecting...", "success");

  login_form.reset();

  const token = localStorage.getItem("token");

  if (!token) {
    showAlert("lg-alert", "Please login first", "error");
    window.location.href = "/Frontend/auth.html";
    return;
  }

  const meResponse = await fetch(
    "http://localhost:5000/api/auth/me",
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    }
  );

  const userData = await meResponse.json();

  if (!meResponse.ok) {
    console.error("Could not verify user:", userData);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    showAlert("lg-alert", userData.message || "Authentication failed. Please login again", "error");

    window.location.href = "/Frontend/auth.html";
    return;
  }

  if (userData.user.role === "guest") {

    window.location.href = "/Frontend/Guest/guest-dashboard.html";

  } else if (userData.user.role === "host") {

    window.location.href = "/Frontend/Dashboard.html";

  } else {

    console.error("Invalid role:", userData.user.role);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    showAlert("lg-alert", "Invalid user role", "error");
  }

});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER FORM — TODO: add your backend call here
// ─────────────────────────────────────────────────────────────────────────────
let Register_form = document.getElementById('registerForm');

Register_form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('rg-name').value.trim();
  const email = document.getElementById('rg-email').value.trim();
  const password = document.getElementById('rg-password').value;
  const confirmPassword = document.getElementById('rg-confirm').value;
  const role = document.querySelector('input[name="role"]:checked')?.value;

  // Clear previous state
  clearAllErrors([
    ['rg-name', 'rg-name-error'],
    ['rg-email', 'rg-email-error'],
    ['rg-password', 'rg-password-error'],
    ['rg-confirm', 'rg-confirm-error'],
  ]);
  clearAlerts();

  // Client-side validation
  let hasErrors = false;
  if (!name || name.length < 2) {
    setError('rg-name', 'rg-name-error', 'Name must be at least 2 characters');
    hasErrors = true;
  }
  if (!email) {
    setError('rg-email', 'rg-email-error', 'Email is required');
    hasErrors = true;
  } else if (!isValidEmail(email)) {
    setError('rg-email', 'rg-email-error', 'Please enter a valid email address');
    hasErrors = true;
  }
  if (!password || password.length < 8) {
    setError('rg-password', 'rg-password-error', 'Password must be at least 8 characters');
    hasErrors = true;
  }
  if (password !== confirmPassword) {
    setError('rg-confirm', 'rg-confirm-error', 'Passwords do not match');
    hasErrors = true;
  }
  if (!role) {
    setError(null, 'rg-role-error', 'Please select a role');
    hasErrors = true;
  }
  if (hasErrors) return;

  let registerObj = {
    name: name,
    email: email,
    password: password,
    confirmPassword: confirmPassword,
    role: role
  };

  const response = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(registerObj)
  });

  const data = await response.json();

  if (!response.ok) {
    showAlert("rg-alert", data.message || "Registration failed", "error");
    return;
  }

  showAlert("rg-alert", data.message || "Registration successful! Please login to continue.", "success");
  Register_form.reset();

});

