<?php
require 'db.php';

$sql = "SELECT * FROM records";
$result = $conn->query($sql);
$records = [];

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
}

echo json_encode($records);
$conn->close();
?>