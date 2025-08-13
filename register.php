<?php
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'root', '', 'devcircle');

$data = json_decode(file_get_contents('php://input'), true);
$username = $conn->real_escape_string($data['username']);
$email = $conn->real_escape_string($data['email']);
$password = password_hash($data['password'], PASSWORD_DEFAULT);

if (!$username || !$email || !$data['password']) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

$res = $conn->query("SELECT id FROM users WHERE email='$email'");
if ($res->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already registered.']);
    exit;
}

$conn->query("INSERT INTO users (username, email, password) VALUES ('$username', '$email', '$password')");
echo json_encode(['success' => true]);
?>