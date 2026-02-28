<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->nicheId)) {
    $stmt = $conn->prepare("INSERT INTO reservations (id, nicheId, reservedBy, contactNumber, reservationDate, status) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $data->id, $data->nicheId, $data->reservedBy, $data->contactNumber, $data->reservationDate, $data->status);
    
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