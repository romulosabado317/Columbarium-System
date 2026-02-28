<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->nicheId)) {
    $stmt = $conn->prepare("DELETE FROM reservations WHERE nicheId=?");
    $stmt->bind_param("s", $data->nicheId);
    
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