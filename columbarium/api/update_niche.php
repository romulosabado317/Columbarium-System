<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    $id = $conn->real_escape_string($data->id);
    
    // Determine what fields to update
    $updates = [];
    if (isset($data->status)) {
        $status = $conn->real_escape_string($data->status);
        $updates[] = "status='$status'";
    }
    if (isset($data->price)) {
        $price = (float)$data->price;
        $updates[] = "price=$price";
    }
    if (isset($data->capacity)) {
        $capacity = (int)$data->capacity;
        $updates[] = "capacity=$capacity";
    }

    if (empty($updates)) {
        echo json_encode(["success" => false, "error" => "Nothing to update"]);
        exit;
    }

    $sql = "UPDATE niches SET " . implode(", ", $updates) . " WHERE id='$id'";
    
    if($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid payload data"]);
}

$conn->close();
?>