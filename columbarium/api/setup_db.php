<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$user = "root";
$pass = "";

// 1. Create Database
$conn = new mysqli($host, $user, $pass);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}
$conn->query("CREATE DATABASE IF NOT EXISTS columbarium_db");
$conn->close();

// 2. Connect to the new Database
$conn = new mysqli($host, $user, $pass, "columbarium_db");

// Clean reset
$conn->query("SET FOREIGN_KEY_CHECKS = 0");
$conn->query("DROP TABLE IF EXISTS records");
$conn->query("DROP TABLE IF EXISTS reservations");
$conn->query("DROP TABLE IF EXISTS niches");
$conn->query("DROP TABLE IF EXISTS users");
$conn->query("SET FOREIGN_KEY_CHECKS = 1");

// 3. Create Tables
$table1 = "CREATE TABLE IF NOT EXISTS niches (
    id VARCHAR(50) PRIMARY KEY,
    section VARCHAR(100),
    `row` INT,
    `col` INT,
    status VARCHAR(50),
    price DECIMAL(10, 2),
    capacity INT DEFAULT 6
)";
$conn->query($table1);

$table2 = "CREATE TABLE IF NOT EXISTS records (
    id VARCHAR(50) PRIMARY KEY,
    nicheId VARCHAR(50),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    dateOfBirth DATE,
    dateOfDeath DATE,
    intermentDate DATE,
    notes TEXT,
    slotNumber INT
)";
$conn->query($table2);

$table3 = "CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(50) PRIMARY KEY,
    nicheId VARCHAR(50),
    reservedBy VARCHAR(150),
    contactNumber VARCHAR(50),
    reservationDate DATE,
    status VARCHAR(50)
)";
$conn->query($table3);

$table4 = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    lastLogin DATETIME NULL
)";
$conn->query($table4);

// 4. Seed Default Admin with ENCRYPTED passwords
$adminPass = password_hash("admin123", PASSWORD_DEFAULT);
$staffPass = password_hash("staff123", PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, 'ACTIVE')");

$roleAdmin = 'ADMIN';
$stmt->bind_param("sss", $userAdmin, $adminPass, $roleAdmin);
$userAdmin = 'admin';
$stmt->execute();

$roleStaff = 'STAFF';
$stmt->bind_param("sss", $userStaff, $staffPass, $roleStaff);
$userStaff = 'staff';
$stmt->execute();
$stmt->close();

// 5. Seed A-Z Clusters
$clusters = range('A', 'Z');
$stmt = $conn->prepare("INSERT INTO niches (id, section, `row`, `col`, status, price, capacity) VALUES (?, ?, ?, ?, 'AVAILABLE', ?, 6)");

foreach($clusters as $cluster) {
    $sectionName = "Cluster " . $cluster;
    for($r=1; $r<=2; $r++) {
        for($c=1; $c<=5; $c++) {
            $id = "$cluster-$r-$c";
            $price = 220000;
            $stmt->bind_param("ssiid", $id, $sectionName, $r, $c, $price);
            $stmt->execute();
        }
    }
}
$stmt->close();

echo json_encode(["message" => "Database fully initialized with encrypted credentials and A-Z Clusters.", "success" => true]);
$conn->close();
?>