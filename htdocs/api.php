<?php
header('Content-Type: application/json');
$config = require 'config.php';
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';
$token = $input['token'] ?? '';

if ($token !== $config['api_secret_token']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Yetkisiz erişim!']);
    exit;
}

if ($action === 'generateChatlog') {
    $apiKey = $config['gemini_api_keys'][0];
    $apiParts = [['text' => $input['prompt']]];
    foreach ($input['images'] as $base64) {
        $apiParts[] = ['inline_data' => ['mime_type' => 'image/jpeg', 'data' => $base64]];
    }
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['contents' => [['parts' => $apiParts]]]));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    echo json_encode(['success' => $httpCode == 200, 'data' => json_decode($response, true)]);
    exit;
}

if ($action === 'askFaq') {
    $apiKey = $config['gemini_api_keys'][0];
    $userQuestion = $input['question'];
    $systemInstruction = "Sen Rina Roleplay Forum uzmanısın. Board 111, 17 ve 25 kurallarına (Sunucu ve Birlik kuralları) göre admin duyurularını baz alarak cevap ver.";
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;
    $postData = ["contents" => [["parts" => [["text" => $systemInstruction . "\n\nSoru: " . $userQuestion]]]]];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    $response = curl_exec($ch);
    curl_close($ch);
    echo $response;
    exit;
}

if ($action === 'uploadImgur') {
    $base64Image = $input['image']; 
    $ch = curl_init("https://api.imgur.com/3/image");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Client-ID 546c25a59c58ad7", "Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['image' => $base64Image]));
    $response = curl_exec($ch);
    curl_close($ch);
    echo $response;
    exit;
}
?>