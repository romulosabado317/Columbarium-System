<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (isset($data->username) && isset($data->password)) {
    $user = $conn->real_escape_string($data->username);
    $pass = $data->password;

    $sql = "SELECT * FROM users WHERE username = '$user' AND status = 'ACTIVE'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $userData = $result->fetch_assoc();
        
        // Use password_verify for encrypted check
        if (password_verify($pass, $userData['password'])) {
            // Update last login
            $conn->query("UPDATE users SET lastLogin = NOW() WHERE id = " . $userData['id']);
            
            echo json_encode([
                "success" => true,
                "role" => $userData['role']
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "error" => "Invalid username or password."
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Invalid username or password."
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "error" => "Missing credentials."
    ]);
}
$conn->close();
?>