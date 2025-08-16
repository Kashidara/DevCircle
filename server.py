from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import jwt
import datetime
from functools import wraps

app = Flask(__name__)chan
app.config['SECRET_KEY'] = 'devcircle_secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///devcircle.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    pfp = db.Column(db.Text, nullable=True)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    username = db.Column(db.String(100))
    user_pfp = db.Column(db.Text)
    text = db.Column(db.Text)
    img = db.Column(db.Text)
    timestamp = db.Column(db.Integer)
    comments = db.relationship('Comment', backref='post', cascade="all,delete", lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'))
    username = db.Column(db.String(100))
    text = db.Column(db.Text)

# Helpers
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['id'])
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired!'}), 401
        except Exception:
            return jsonify({'success': False, 'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'All fields required.'})
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Email already registered.'})
    hashed = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({'success': False, 'message': 'Invalid email or password.'})
    token = jwt.encode({'id': user.id, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)},
                       app.config['SECRET_KEY'], algorithm="HS256")
    # Ensure token is a string for JSON serialization
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return jsonify({'success': True, 'token': token, 'user': {
        'username': user.username, 'email': user.email, 'pfp': user.pfp
    }})

@app.route('/api/posts', methods=['GET'])
def get_posts():
    posts = Post.query.order_by(Post.timestamp.desc()).all()
    result = []
    for post in posts:
        result.append({
            '_id': post.id,
            'user': {'username': post.username, 'pfp': post.user_pfp},
            'text': post.text,
            'img': post.img,
            'timestamp': post.timestamp,
            'comments': [{'user': {'username': c.username}, 'text': c.text} for c in post.comments]
        })
    return jsonify(result)

@app.route('/api/posts', methods=['POST'])
@token_required
def new_post(current_user):
    data = request.json
    post = Post(
        user_id=current_user.id,
        username=current_user.username,
        user_pfp=current_user.pfp,
        text=data.get('text'),
        img=data.get('img'),
        timestamp=int(datetime.datetime.utcnow().timestamp())
    )
    db.session.add(post)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/posts/<int:post_id>/comment', methods=['POST'])
@token_required
def comment(current_user, post_id):
    data = request.json
    post = Post.query.get(post_id)
    if not post:
        return jsonify({'success': False, 'message': 'Post not found.'}), 404
    comment = Comment(post_id=post_id, username=current_user.username, text=data.get('text'))
    db.session.add(comment)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/profile', methods=['POST'])
@token_required
def update_profile(current_user):
    data = request.json
    if data.get('username'):
        current_user.username = data['username']
    if data.get('pfp'):
        current_user.pfp = data['pfp']
    db.session.commit()
    return jsonify({'success': True, 'user': {
        'username': current_user.username, 'email': current_user.email, 'pfp': current_user.pfp
    }})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(port=3000)