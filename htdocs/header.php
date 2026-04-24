<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Destekli RP Chatlog Üretici | Pro Sürüm</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Vue 3 & Axios -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    
    <!-- HTML2Canvas & FileSaver -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js"></script>

    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Sitenin tamamı Vue'nun kontrolünde olacak -->
    <div id="app">
        <header class="header">
            <h1>AI RP Chatlog Üretici <span>v15.1 Ultimate (Vue & PHP)</span></h1>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Gelişmiş Galeri, Bulanık Sansür ve Güvenli Entegrasyon</div>
        </header>