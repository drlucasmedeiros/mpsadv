<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'mps_admin');
define('DB_PASS', 'SenhaSegura123@');
define('DB_NAME', 'mps_intranet');

// Application configuration
define('APP_NAME', 'MPS Intranet');
define('APP_ROOT', dirname(dirname(__FILE__)));
define('URL_ROOT', 'http://seuservidor.com');
define('SITE_URL', 'http://seuservidor.com/mps_intranet');

// Create database connection
try {
    $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("ERRO: Não foi possível conectar. " . $e->getMessage());
}
?>