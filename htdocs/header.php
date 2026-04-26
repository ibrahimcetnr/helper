<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI RP Suite | Professional Toolset</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js"></script>
    
    <link rel="stylesheet" href="style.css?v=<?php echo time(); ?>">
</head>
<body>
    <div id="app">
        <header class="header">
            <div class="header-left" @click="currentPage = 'home'" style="cursor: pointer;">
                <h1>AI RP <span>Suite</span></h1>
            </div>
            
<nav class="header-nav">
    <a href="#" :class="{ active: currentPage === 'home' }" @click.prevent="currentPage = 'home'">🏠 Portal</a>
    <a href="#" :class="{ active: currentPage === 'generator' }" @click.prevent="currentPage = 'generator'">📸 SS Oluşturucu</a>
    <a href="#" :class="{ active: currentPage === 'faq' }" @click.prevent="currentPage = 'faq'">❓ Soru-Cevap</a>
</nav>

            <div class="header-right">
                <div class="status-badge">
                    <span class="status-dot"></span>
                    {{ currentPage === 'home' ? 'Portal Görünümü' : 'Düzenleme Modu' }}
                </div>
            </div>
        </header>