<?php
// Veritabanı Bilgilerin
$host = "sql308.infinityfree.com";
$user = "if0_40733611";
$pass = "cakirim123123";
$db   = "if0_40733611_futurebet_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Bağlantı hatası: " . $conn->connect_error);
}

// setSql.sql dosyasının içeriğini oku
$sql_dosya_yolu = "setSql.sql";

if (file_exists($sql_dosya_yolu)) {
    $sql_sorgulari = file_get_contents($sql_dosya_yolu);
    
    // Eğer dosya boş değilse çalıştır
    if (!empty(trim($sql_sorgulari))) {
        if ($conn->multi_query($sql_sorgulari)) {
            echo "✅ Sorgular başarıyla çalıştırıldı!<br>";
            echo "Son çalıştırma: " . date("H:i:s");
        } else {
            echo "❌ SQL Hatası: " . $conn->error;
        }
    } else {
        echo "⚠️ setSql.sql dosyası boş.";
    }
} else {
    echo "❌ setSql.sql dosyası bulunamadı!";
}

$conn->close();
?>