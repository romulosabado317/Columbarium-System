<?php
ob_start();

error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "columbarium_db";

$conn = @new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    ob_clean();
    echo json_encode(["error" => "MySQL Server is not running. Please start MySQL in XAMPP.", "success" => false]);
    exit();
}

if (!@$conn->select_db($dbname)) {
    ob_clean();
    echo json_encode([
        "error" => "Database not initialized.", 
        "needs_setup" => true,
        "success" => false
    ]);
    exit();
}

// Ensure no stray whitespace or characters before actual JSON content
if (ob_get_length()) ob_clean();
?>