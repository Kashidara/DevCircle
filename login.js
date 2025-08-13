document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const res = await fetch('login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    const msg = document.getElementById('loginMessage');
    if (data.success) {
        msg.style.color = 'green';
        msg.textContent = 'Login successful! Welcome.';
        // Redirect or show dashboard here
    } else {
        msg.style.color = 'red';
        msg.textContent = data.message || 'Login failed.';
    }
});

