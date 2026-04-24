<?php
header('Content-Type: application/json');

// Frontend'den gelen veriyi al
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

// Güvenlik: Kullanıcıdan gizlediğimiz API Anahtarları
$GEMINI_API_KEYS = [
    "AIzaSyC_VR50E_bFfy-WXgdss30_F1_KG6qwGKU",
    "AIzaSyCBPjYeJt5_Q1u_aaQXLsDH91M8c5E3XvA"
];
$IMGUR_CLIENT_ID = "774748683d831f8";

if ($action === 'generateChatlog') {
    // 1. GEMINI API İSTEĞİ (Veritabanı kayıtları bu aşamada işlenebilir)
    $keyIndex = $input['keyIndex'] ?? 0;
    $apiKey = $GEMINI_API_KEYS[$keyIndex % count($GEMINI_API_KEYS)];
    
    $prompt = $input['prompt'];
    $images = $input['images']; // Base64 array
    
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
    // 2. IMGUR API İSTEĞİ
    $base64Image = $input['image']; // Sadece data kısmı
    
    $ch = curl_init("https://api.imgur.com/3/image");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Client-ID " . $IMGUR_CLIENT_ID,
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