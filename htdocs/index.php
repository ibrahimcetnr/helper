<?php include 'header.php'; ?>

    <div id="lightbox" class="lightbox-overlay" :style="{ display: lightboxVisible ? 'flex' : 'none' }" @click="closeLightbox">
        <span class="lightbox-close" @click="closeLightbox">&times;</span>
        <img id="lightbox-img" class="lightbox-img" :src="lightboxImage" @click.stop>
    </div>

    <!-- MAIN CONTAINER -->
    <div class="main-container">
        <aside class="sidebar">
            
            <div class="sidebar-section">
                <h2>1. Sahneleri Yükle (Ekle/Çıkar)</h2>
                <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" multiple title="Mevcutların yanına yenilerini ekler">
                <div id="imagePreviewContainer">
                    <div v-for="(img, idx) in aiBase64Images" :key="idx" class="preview-wrapper">
                        <img :src="'data:image/jpeg;base64,' + img" class="preview-thumb" title="Tam boyut için tıkla" @click="openLightbox(img)">
                        <button class="remove-thumb" title="Fotoğrafı Sil" @click="removeImage(idx)">✖</button>
                    </div>
                </div>
            </div>

            <div class="sidebar-section" style="padding-bottom: 10px; padding-top: 15px;">
                <button class="accordion-btn" :class="{ active: isAiMenuOpen }" @click="isAiMenuOpen = !isAiMenuOpen">
                    <span>🤖 Yapay Zeka ile Otomatik Üret <span style="font-size:0.7rem; font-weight:normal; opacity:0.8;">(Opsiyonel)</span></span>
                    <span class="icon">▼</span>
                </button>
                
                <div class="accordion-content" v-show="isAiMenuOpen" style="display: block;">
                    <h2 style="font-size: 0.85rem;">Karakterler (Tam İsim)</h2>
                    <div class="char-names-container">
                        <div v-for="(char, idx) in characters" :key="idx" class="char-name-row">
                            <input type="text" class="char-name" placeholder="Örn: Stefan Walther" v-model="char.name">
                            <button v-if="idx >= 2" class="remove-char" @click="characters.splice(idx, 1)">✖</button>
                        </div>
                    </div>
                    <button type="button" class="btn-outline" style="margin-bottom: 15px; padding: 8px; font-size: 0.8rem;" @click="characters.push({name: ''})">➕ Karakter Ekle</button>

                    <h2 style="font-size: 0.85rem;">Olay Örgüsü</h2>
                    <textarea placeholder="Olayı kısaca özetle..." style="min-height: 60px;" v-model="aiPrompt"></textarea>
                    
                    <button style="margin-top: 15px;" @click="generateChatlog" :disabled="isGenerating">{{ generateBtnText }}</button>
                </div>
            </div>

            <div class="sidebar-section">
                <h2>
                    2. Chatlog Metni 
                    <span style="font-size: 0.7rem; font-weight: normal; color: var(--success);">(Manuel de yazabilirsin)</span>
                </h2>
                <textarea style="min-height: 200px;" placeholder="Yapay zekanın ürettiği metin buraya düşer..." v-model="chatlogText" @input="updatePreview"></textarea>
                
                <button class="btn-success" style="margin-top: 15px; font-size: 1rem; padding: 15px;" @click="distributeToImages">📸 Metni Fotoğraflara Dağıt</button>
            </div>
            
        </aside>

        <main class="workspace">
            <div class="toolbar">
                <div class="toolbar-group">
                    <label style="margin: 0; font-size: 0.8rem;">Metin Arkaplanı:</label>
                    <input type="color" v-model="selectedColor" @input="updatePreview" style="width: 25px; height: 25px; border: none; background: transparent; cursor: pointer;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-outline" @click="downloadTextOnly(false)">Metni İndir (Arkaplanlı)</button>
                    <button class="btn-outline" style="border-color: rgba(255,255,255,0.15);" @click="downloadTextOnly(true)">Metni İndir (Saydam)</button>
                </div>
            </div>

            <div class="canvas-area">
                <div id="text-only-preview" class="chat-text-layer" v-html="formattedPreview"></div>
                
                <div id="merged-scenes-container" style="width: 100%; display: flex; flex-direction: column; gap: 40px; align-items: center;" @mousemove="handleDragMove" @mouseup="handleDragEnd" @mouseleave="handleDragEnd">
                    <div v-for="(scene, idx) in mergedScenes" :key="idx" class="merged-scene-wrapper">
                        <div class="merged-scene-container" :id="'final-scene-' + idx" :class="{'screenshot-mode': isDownloadingScene === idx || isUploadingAll}">
                            <img :src="'data:image/jpeg;base64,' + aiBase64Images[idx]" crossorigin="anonymous">
                            <div class="draggable-wrapper" :style="{ left: scene.x + 'px', top: scene.y + 'px' }">
                                <div class="scene-controls">
                                    <div class="drag-handle" @mousedown.prevent="handleDragStart($event, idx)">✋ Taşı</div>
                                    <div class="font-controls">
                                        <button class="font-btn" @click="changeFontSize(idx, -1)">-</button>
                                        <span class="font-indicator">{{ scene.fontSize }}px</span>
                                        <button class="font-btn" @click="changeFontSize(idx, 1)">+</button>
                                        <button class="font-btn blur-btn" title="Seçiliyken bulanıklaştır" @click="applyBlur($event, idx)" @mousedown.prevent>💧</button>
                                    </div>
                                </div>
                                <div class="chat-text-layer editable-layer" :ref="'editableLayer_' + idx" :contenteditable="(isDownloadingScene === idx || isUploadingAll) ? 'false' : 'true'" spellcheck="false" :style="{ fontSize: scene.fontSize + 'px' }" v-html="scene.html" @blur="updateSceneHtml($event, idx)" @focus="handleEditableFocus($event)" @focusout="handleEditableBlur($event)"></div>
                            </div>
                        </div>
                        <button class="download-scene-btn" style="width: 200px; align-self: flex-end; background-color: var(--input-bg); border: 1px solid var(--border-color);" @click="downloadIndividualScene(idx)" :disabled="isDownloadingScene === idx">
                            {{ isDownloadingScene === idx ? '⏳ İşleniyor...' : '⬇️ ' + (idx + 1) + '. Sahneyi İndir' }}
                        </button>
                    </div>
                </div>
                
                <div class="upload-section" v-show="mergedScenes.length > 0">
                    <button class="btn-imgur" style="font-size: 1.1rem; padding: 15px;" @click="uploadToImgur" :disabled="isUploadingAll">{{ uploadBtnText }}</button>
                    
                    <div v-show="bbcodeOutput" style="width: 100%;">
                        <div class="upload-header">
                            <label style="color: var(--imgur); font-weight: 600;">✅ Yükleme Başarılı! (Forum için kopyala)</label>
                            <button class="btn-outline" style="width: auto; padding: 6px 12px; font-size: 0.8rem;" @click="copyBbcode">{{ copyBtnText }}</button>
                        </div>
                        <textarea readonly v-model="bbcodeOutput" id="bbcode-output"></textarea>
                    </div>
                </div>

            </div>
        </main>
    </div>

<?php include 'footer.php'; ?>