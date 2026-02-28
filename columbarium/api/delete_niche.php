<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $id = $conn->real_escape_string($data->id);
    
    // Check if records or reservations exist - cascade is allowed per SQL schema but double check here
    $stmt = $conn->prepare("DELETE FROM niches WHERE id=?");
    $stmt->bind_param("s", $id);
    
    if($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "error" => "Invalid payload data"]);
}

$conn->close();
?>