<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->nicheId)) {
    $stmt = $conn->prepare("INSERT INTO records (id, nicheId, firstName, lastName, dateOfBirth, dateOfDeath, intermentDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssssss", $data->id, $data->nicheId, $data->firstName, $data->lastName, $data->dateOfBirth, $data->dateOfDeath, $data->intermentDate, $data->notes);
    
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