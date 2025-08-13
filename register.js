document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const res = await fetch('register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    const msg = document.getElementById('registerMessage');
    if (data.success) {
        msg.style.color = 'green';
        msg.textContent = 'Registration successful! You can now log in.';
    } else {
        msg.style.color = 'red';
        msg.textContent = data.message || 'Registration failed.';
    }
});