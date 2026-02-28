<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->username) && isset($data->password) && isset($data->role)) {
    $username = $conn->real_escape_string($data->username);
    // Hash the password
    $password = password_hash($data->password, PASSWORD_DEFAULT);
    $role = $conn->real_escape_string($data->role);

    $stmt = $conn->prepare("INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, 'ACTIVE')");
    $stmt->bind_param("sss", $username, $password, $role);
    
    if($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "error" => "Invalid user data"]);
}

$conn->close();
?>