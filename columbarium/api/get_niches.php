<?php
require 'db.php';

$sql = "SELECT * FROM niches";
$result = $conn->query($sql);
$niches = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Cast types for frontend
        $row['row'] = (int)$row['row'];
        $row['col'] = (int)$row['col'];
        $row['price'] = (float)$row['price'];
        $niches[] = $row;
    }
}

echo json_encode($niches);
$conn->close();
?>