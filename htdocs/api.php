<?php
header('Content-Type: application/json');

// Güvenli config dosyasını dahil et
$config = require 'config.php';

// Frontend'den gelen veriyi al
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$token = $input['token'] ?? ''; // Güvenlik tokenı

// GÜVENLİK: Gelen istekteki token, bizim config'deki token ile eşleşmiyor ise reddet!
if ($token !== $config['api_secret_token']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Yetkisiz API erişimi engellendi!']);
    exit;
}

if ($action === 'generateChatlog') {
    $keyIndex = $input['keyIndex'] ?? 0;
    // Config'den API keyleri al
    $apiKey = $config['gemini_api_keys'][$keyIndex % count($config['gemini_api_keys'])];
    
    $prompt = $input['prompt'];
    $images = $input['images'];
    
    $apiParts = [['text' => $prompt]];
    foreach ($images as $base64) {
        $apiParts[] = ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $base64]];
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['contents' => [['parts' => $apiParts]]]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo json_encode([
        'success' => $httpCode == 200,
        'data' => json_decode($response, true),
        'httpCode' => $httpCode
    ]);
    exit;
}

if ($action === 'uploadImgur') {
    $base64Image = $input['image']; 
    
    $ch = curl_init("https://api.imgur.com/3/image");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Client-ID " . $config['imgur_client_id'], // Config'den çekiliyor
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['image' => $base64Image]));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo $response;
    exit;
}

echo json_encode(['success' => false, 'message' => 'Geçersiz işlem (action)']);
?>