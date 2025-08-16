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
const user = getLoggedInUser();
document.getElementById('userGreeting').textContent = 'Hello, ' + user.username + '!';
renderProfileCircle(user);

// --- Post Feed Logic ---
function getPosts() {
    return JSON.parse(localStorage.getItem('posts') || '[]');
}
function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}

function renderFeed() {
    const feed = document.getElementById('feed');
    const posts = getPosts().reverse(); // newest first
    feed.innerHTML = '';
    posts.forEach((post, idx) => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';

        // Header
        const header = document.createElement('div');
        header.className = 'post-header';
        // Profile circle
        const pfp = document.createElement('div');
        pfp.className = 'profile-circle';
        pfp.style.position = 'static';
        pfp.style.width = '36px';
        pfp.style.height = '36px';
        if (post.user.pfp) {
            const img = document.createElement('img');
            img.src = post.user.pfp;
            img.alt = "Profile";
            pfp.appendChild(img);
        } else {
            const span = document.createElement('span');
            span.className = "profile-initial";
            span.style.fontSize = "1.1em";
            span.textContent = post.user.username ? post.user.username[0].toUpperCase() : "?";
            pfp.appendChild(span);
        }
        header.appendChild(pfp);
        // Username
        const uname = document.createElement('span');
        uname.className = 'post-user';
        uname.textContent = post.user.username;
        header.appendChild(uname);
        postDiv.appendChild(header);

        // Text
        const text = document.createElement('div');
        text.textContent = post.text;
        postDiv.appendChild(text);

        // Image
        if (post.img) {
            const img = document.createElement('img');
            img.className = 'post-img';
            img.src = post.img;
            img.alt = "Post image";
            postDiv.appendChild(img);
        }

        // Comments
        const commentsDiv = document.createElement('div');
        commentsDiv.className = 'post-comments';
        (post.comments || []).forEach(comment => {
            const cdiv = document.createElement('div');
            cdiv.className = 'comment';
            cdiv.innerHTML = `<span class="comment-user">${comment.user.username}:</span> ${comment.text}`;
            commentsDiv.appendChild(cdiv);
        });

        // Comment form
        const commentForm = document.createElement('form');
        commentForm.className = 'comment-form';
        commentForm.onsubmit = function (e) {
            e.preventDefault();
            const input = this.querySelector('input');
            const commentText = input.value.trim();
            if (!commentText) return;
            post.comments = post.comments || [];
            post.comments.push({
                user: { username: user.username },
                text: commentText
            });
            const allPosts = getPosts();
            // Find the correct post by timestamp
            const postIdx = allPosts.findIndex(p => p.timestamp === post.timestamp);
            if (postIdx !== -1) {
                allPosts[postIdx] = post;
                savePosts(allPosts);
                renderFeed();
            }
        };
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.placeholder = 'Add a comment...';
        commentForm.appendChild(commentInput);
        const commentBtn = document.createElement('button');
        commentBtn.type = 'submit';
        commentBtn.textContent = 'Send';
        commentForm.appendChild(commentBtn);

        commentsDiv.appendChild(commentForm);
        postDiv.appendChild(commentsDiv);

        feed.appendChild(postDiv);
    });
}

// --- New Post Logic ---
document.getElementById('newPostForm').onsubmit = function (e) {
    e.preventDefault();
    const text = document.getElementById('postText').value.trim();
    const imgInput = document.getElementById('postImage');
    if (!text) return;
    const post = {
        user: { username: user.username, pfp: user.pfp || null },
        text,
        img: null,
        comments: [],
        timestamp: Date.now()
    };
    if (imgInput.files && imgInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            post.img = evt.target.result;
            addPost(post);
        };
        reader.readAsDataURL(imgInput.files[0]);
    } else {
        addPost(post);
    }
};
function addPost(post) {
    const posts = getPosts();
    posts.push(post);
    savePosts(posts);
    document.getElementById('newPostForm').reset();
    renderFeed();
}

// Initial render
renderFeed();