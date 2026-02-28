<?php
require 'db.php';

$sql = "SELECT * FROM reservations";
$result = $conn->query($sql);
$reservations = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }
}

echo json_encode($reservations);
$conn->close();
?>