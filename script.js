// Utility: Get logged-in user or redirect to login
function getLoggedInUser(redirect = true) {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
    if (!user && redirect) window.location.href = 'login.html';
    return user;
}

// Utility: Update user in localStorage (users array and loggedInUser)
function updateUserInStorage(user) {
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => u.email === user.email ? user : u);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('loggedInUser', JSON.stringify(user));
}

// Profile Circle (for main.html)
function renderProfileCircle(user, profileCircleId = 'profileCircle') {
    const profileCircle = document.getElementById(profileCircleId);
    if (!profileCircle) return;
    profileCircle.innerHTML = '';
    if (user && user.pfp) {
        const img = document.createElement('img');
        img.src = user.pfp;
        img.alt = "Profile";
        profileCircle.appendChild(img);
    } else if (user) {
        const span = document.createElement('span');
        span.className = "profile-initial";
        span.textContent = user.username ? user.username[0].toUpperCase() : "?";
        profileCircle.appendChild(span);
    }
    profileCircle.onclick = function () {
        window.location.href = 'account.html';
    };
}

// Logout button (for main.html and account.html)
function setupLogoutButton(btnId = 'logoutBtn') {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.onclick = function () {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
        };
    }
}