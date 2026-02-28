<?php
require 'db.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->id) && isset($data->status)) {
    $status = $conn->real_escape_string($data->status);
    $id = $conn->real_escape_string($data->id);

    $stmt = $conn->prepare("UPDATE reservations SET status=? WHERE id=?");
    $stmt->bind_param("ss", $status, $id);
    
    if($stmt->execute()) {
        // If approved, update the niche status to RESERVED
        if ($status === 'APPROVED') {
            $res = $conn->query("SELECT nicheId FROM reservations WHERE id='$id'");
            if ($row = $res->fetch_assoc()) {
                $nId = $row['nicheId'];
                $conn->query("UPDATE niches SET status='RESERVED' WHERE id='$nId'");
            }
        }
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