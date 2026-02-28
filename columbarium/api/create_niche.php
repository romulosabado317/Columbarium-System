<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->section)) {
    $id = $conn->real_escape_string($data->id);
    $section = $conn->real_escape_string($data->section);
    $row = (int)$data->row;
    $col = (int)$data->col;
    $price = (float)$data->price;
    $capacity = isset($data->capacity) ? (int)$data->capacity : 6;

    $stmt = $conn->prepare("INSERT INTO niches (id, section, `row`, `col`, status, price, capacity) VALUES (?, ?, ?, ?, 'AVAILABLE', ?, ?)");
    $stmt->bind_param("ssiidi", $id, $section, $row, $col, $price, $capacity);
    
    if($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "error" => "Invalid niche data"]);
}

$conn->close();
?>