<?php
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'root', '', 'devcircle');

$data = json_decode(file_get_contents('php://input'), true);
$email = $conn->real_escape_string($data['email']);
$password = $data['password'];

$res = $conn->query("SELECT * FROM users WHERE email='$email'");
if ($res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit;
}
$user = $res->fetch_assoc();
if (!password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit;
}
echo json_encode(['success' => true, 'username' => $user['username']]);
?>