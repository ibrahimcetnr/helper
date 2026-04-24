const { createApp, ref, reactive, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        const aiBase64Images = ref([]);
        const isAiMenuOpen = ref(false);
        const characters = ref([{ name: '' }, { name: '' }]);
        const aiPrompt = ref('');
        const chatlogText = ref('');
        const formattedPreview = ref(`
            <div style="color: var(--text-muted); font-style: italic; font-weight: normal; text-shadow: none;">
                Metniniz burada belirecek. "Metni Fotoğraflara Dağıt" butonuna bastığınızda ise metin fotoğrafların üzerine işlenecektir...
            </div>
        `);
        const selectedColor = ref('#000000');
        const keyIndex = ref(parseInt(localStorage.getItem('rp_last_key_index')) || 0);

        const isGenerating = ref(false);
        const generateBtnText = ref('✨ Diyalog Üret');

        const mergedScenes = ref([]);
        const isDownloadingScene = ref(null);
        
        const isUploadingAll = ref(false);
        const uploadBtnText = ref("☁️ Tüm Sahneleri Imgur'a Yükle & BBCode Al");
        const bbcodeOutput = ref("");
        const copyBtnText = ref("📋 Kopyala");

        const lightboxVisible = ref(false);
        const lightboxImage = ref('');

        const draggingScene = ref(null);
        const dragOffsetX = ref(0);
        const dragOffsetY = ref(0);

        // API Güvenlik Tokeni (config.php içindekiyle aynı olmalı)
        const API_SECRET_TOKEN = 'RpChatlog_Gizli_Token_2024!@#';

        // Vue DOM Refs
        const textOnlyPreviewRef = ref(null);
        const workspaceRef = ref(null);

        // Görsel Sıkıştırma Fonksiyonu (Client-Side Compression)
        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        const MAX_WIDTH = 1920; // Max genişlik
                        let width = img.width;
                        let height = img.height;

                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }

                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // %80 Kalitede JPEG olarak çıkart
                        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                        resolve(base64);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        const openLightbox = (base64) => {
            lightboxImage.value = 'data:image/jpeg;base64,' + base64;
            lightboxVisible.value = true;
        };

        const closeLightbox = () => {
            lightboxVisible.value = false;
            lightboxImage.value = '';
        };

        const handleFileUpload = async (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let file of files) {
                // Sıkıştırma fonksiyonunu bekle ve base64 al
                const compressedBase64 = await compressImage(file);
                aiBase64Images.value.push(compressedBase64);
            }
            event.target.value = ''; 
        };

        const removeImage = (idx) => {
            aiBase64Images.value.splice(idx, 1);
            if (mergedScenes.value[idx]) {
                mergedScenes.value.splice(idx, 1);
            }
        };

        const formatChatlogTextLogic = (textArray, transparentMode = false, overrideColor = selectedColor.value) => {
            let formattedText = "";
            const smsRegex = /^(\[SMS\] [«»] \w+:)(.*)$/i;

            textArray.forEach((line) => {
                if (!line.trim()) return;

                let bgStyle = transparentMode ? "background-color: transparent !important;" : `background-color: ${overrideColor};`;
                formattedText += `<div class="wizard-generated-row" style="${bgStyle}">`;

                line = line.replace(/\[emote\](.*?)\[\/emote\]/g, (match, p1) => `<span style="color: #C2A2DA;">${p1}</span>`);
                let lower = line.toLowerCase();

                if (line.startsWith("[color=")) {
                    let colorMatch = line.match(/\[color=#(\w+)]/i);
                    if (colorMatch) formattedText += `<span style="color: #${colorMatch[1]};">${line.replace(colorMatch[0], "")}</span><br>`;
                }
                else if (line.includes("Megafonu)")) { formattedText += `<span style="color: #FFA500;">${line}</span><br>`; }
                else if (line.startsWith("*")) { formattedText += `<span style="color: #C2A2DA;">${line}</span><br>`; }
                else if (line.includes("(Cam Kapalı)")) { formattedText += `<span style="color: #33CCFF;">${line}</span><br>`; }
                else if (line.startsWith("** (Radyo)") || line.startsWith("** (Radyo Operatörü)")) { formattedText += `<span style="color: #9189EF;">${line}</span><br>`; }
                else if (line.startsWith("[CH: ")) { formattedText += `<span style="color: #DAA520;">${line}</span><br>`; }
                else if (lower.includes("(telefon") || (!line.startsWith("*") && !line.includes(":") && /.*\s+sizi arıyor\.$/i.test(line)) || line.includes("Çağrı bağlandı.") || line.includes("Çağrı karşı taraf tarafından kapatıldı.")) {
                    formattedText += `<span style="color: #33CCFF;">${line}</span><br>`;
                }
                else if (smsRegex.test(line)) {
                    const match = line.match(smsRegex);
                    formattedText += `<span style="color: #33CCFF;">${match[1]}</span><span style="color: #FFFFFF;">${match[2]}</span><br>`;
                }
                else { formattedText += line + "<br>"; }

                formattedText += "</div>";
            });
            return formattedText;
        };

        const updatePreview = () => {
            const lines = chatlogText.value.split("\n");
            formattedPreview.value = formatChatlogTextLogic(lines, false, selectedColor.value);
            
            mergedScenes.value.forEach(scene => {
                const sceneLines = scene.rawLines;
                scene.html = formatChatlogTextLogic(sceneLines, true, selectedColor.value);
            });
        };

        const generateChatlog = async () => {
            if (aiBase64Images.value.length === 0) return alert("Lütfen en az bir fotoğraf yükleyin!");
            const validChars = characters.value.map(c => c.name.trim().replace(/_/g, " ")).filter(n => n);
            if (validChars.length === 0) return alert("En az bir karakter ismi girin!");
            if (!aiPrompt.value.trim()) return alert("Olay örgüsünü boş bırakmayın!");

            isGenerating.value = true;
            generateBtnText.value = "⏳ Üretiliyor...";

            const prompt = `SEN, RİNA ROLEPLAY STANDARTLARINDA, HARDCORE TEXT-BASED BİR GTA 5 ROLEPLAY CHATLOG (SOHBET GEÇMİŞİ) ÜRETİCİSİSİN... (promptun kalanı aynı)`; // Kendi kurallarınızı ekleyin

            try {
                const response = await axios.post('api.php', {
                    token: API_SECRET_TOKEN, // GÜVENLİK: İstekte token gönderiliyor
                    action: 'generateChatlog',
                    prompt: prompt,
                    images: aiBase64Images.value,
                    keyIndex: keyIndex.value
                });

                if (response.data.success) {
                    const generatedText = response.data.data.candidates[0].content.parts[0].text;
                    chatlogText.value = generatedText.trim();
                    updatePreview();
                    isAiMenuOpen.value = false;
                    generateBtnText.value = "✨ Üretim Başarılı!";
                } else {
                    console.error("API Error: ", response.data.message || response.data.httpCode);
                    generateBtnText.value = "⚠️ Hata Oluştu!";
                    keyIndex.value++;
                    localStorage.setItem('rp_last_key_index', keyIndex.value.toString());
                }
            } catch (error) {
                console.error("API Call error:", error);
                generateBtnText.value = "⚠️ Hata! Tekrar Dene.";
                keyIndex.value++;
                localStorage.setItem('rp_last_key_index', keyIndex.value.toString());
            } finally {
                setTimeout(() => {
                    isGenerating.value = false;
                    generateBtnText.value = "✨ Diyalog Üret";
                }, 2000);
            }
        };

        const downloadTextOnly = async (transparent) => {
            const node = textOnlyPreviewRef.value || document.getElementById("text-only-preview");
            const tempBg = node.style.backgroundColor;
            
            if (transparent) {
                Array.from(node.getElementsByClassName("wizard-generated-row")).forEach(el => el.style.backgroundColor = "transparent");
            }

            try {
                const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 });
                canvas.toBlob(blob => window.saveAs(blob, transparent ? "metin_saydam.png" : "metin_arkaplanli.png"));
            } catch (e) {
                console.error(e);
            } finally {
                if (transparent) {
                    Array.from(node.getElementsByClassName("wizard-generated-row")).forEach(el => el.style.backgroundColor = selectedColor.value);
                }
            }
        };

        const distributeToImages = () => {
            if (aiBase64Images.value.length === 0) return alert("Fotoğraf yükleyin!");
            const lines = chatlogText.value.split('\n').filter(l => l.trim() !== '');
            if (lines.length === 0) return alert("Dağıtılacak metin yok!");

            let textBlocks = [];
            let currentBlock = [];
            lines.forEach((line) => {
                if (!line.startsWith("*") && !line.startsWith("(") && currentBlock.length > 0) {
                    textBlocks.push(currentBlock);
                    currentBlock = [];
                }
                currentBlock.push(line);
            });
            if (currentBlock.length > 0) textBlocks.push(currentBlock);

            const numImages = aiBase64Images.value.length;
            const blocksPerImage = Math.ceil(textBlocks.length / numImages);

            mergedScenes.value = [];
            
            for (let i = 0; i < numImages; i++) {
                const chunkBlocks = textBlocks.slice(i * blocksPerImage, (i + 1) * blocksPerImage);
                if (chunkBlocks.length === 0 && i > 0) continue;

                const chunkLines = chunkBlocks.flat();
                mergedScenes.value.push({
                    rawLines: chunkLines,
                    html: formatChatlogTextLogic(chunkLines, true, selectedColor.value),
                    fontSize: 14,
                    x: 20,
                    y: 20
                });
            }

            setTimeout(() => {
                const container = document.getElementById('merged-scenes-container');
                if (container) window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
            }, 100);
        };

        const changeFontSize = (idx, step) => {
            let scene = mergedScenes.value[idx];
            if (step > 0 && scene.fontSize < 40) scene.fontSize++;
            else if (step < 0 && scene.fontSize > 8) scene.fontSize--;
        };

        const updateSceneHtml = (event, idx) => {
            const rawText = event.target.innerText;
            const lines = rawText.split('\n');
            mergedScenes.value[idx].rawLines = lines;
            mergedScenes.value[idx].html = formatChatlogTextLogic(lines, true, selectedColor.value);
        };

        const handleDragStart = (e, idx) => {
            draggingScene.value = idx;
            dragOffsetX.value = e.offsetX;
            dragOffsetY.value = e.offsetY;
        };

        const handleDragMove = (e) => {
            if (draggingScene.value === null) return;
            const idx = draggingScene.value;
            const containerNode = document.getElementById(`final-scene-${idx}`);
            if(!containerNode) return;
            const containerBox = containerNode.getBoundingClientRect();
            
            let newX = e.clientX - containerBox.left - dragOffsetX.value;
            let newY = e.clientY - containerBox.top - dragOffsetY.value;
            
            mergedScenes.value[idx].x = newX;
            mergedScenes.value[idx].y = newY;
        };

        const handleDragEnd = () => {
            draggingScene.value = null;
        };

        const applyBlur = (e, idx) => {
            const sel = window.getSelection();
            if (!sel.rangeCount || sel.isCollapsed) return alert("Lütfen sansürlemek istediğiniz yazıyı farenizle seçin!");
            
            const range = sel.getRangeAt(0);
            const editableLayer = e.target.closest('.draggable-wrapper').querySelector('.editable-layer');
            
            if (editableLayer.contains(sel.anchorNode)) {
                const clientRects = range.getClientRects();
                const layerRect = editableLayer.getBoundingClientRect();

                for (let i = 0; i < clientRects.length; i++) {
                    const rect = clientRects[i];
                    const blurDiv = document.createElement('div');
                    blurDiv.className = 'blur-overlay';
                    blurDiv.style.left = (rect.left - layerRect.left) + 'px';
                    blurDiv.style.top = (rect.top - layerRect.top) + 'px';
                    blurDiv.style.width = rect.width + 'px';
                    blurDiv.style.height = rect.height + 'px';
                    editableLayer.appendChild(blurDiv);
                }
                sel.removeAllRanges();
            }
        };

        const handleEditableFocus = (e) => {
            const blurs = e.target.querySelectorAll('.blur-overlay');
            blurs.forEach(b => b.style.opacity = '0.2');
        };

        const handleEditableBlur = (e) => {
            const blurs = e.target.querySelectorAll('.blur-overlay');
            blurs.forEach(b => b.style.opacity = '1');
        };

        const executeCanvasDownload = async (node) => {
            const img = node.querySelector('img');
            const exactWidth = Math.round(node.getBoundingClientRect().width);
            const exactHeight = Math.round(node.getBoundingClientRect().height);
            const scaleRatio = img.naturalWidth / exactWidth;

            node.style.width = exactWidth + 'px';
            node.style.height = exactHeight + 'px';

            const workspace = workspaceRef.value || document.querySelector('.workspace');
            const oldScrollTop = workspace ? workspace.scrollTop : 0;
            if (workspace) workspace.scrollTop = 0; 

            try {
                const canvas = await html2canvas(node, {
                    scale: scaleRatio,
                    useCORS: true,
                    backgroundColor: null,
                    width: exactWidth,
                    height: exactHeight
                });
                return canvas;
            } finally {
                if (workspace) workspace.scrollTop = oldScrollTop;
                node.style.width = '100%';
                node.style.height = '';
            }
        };

        const downloadIndividualScene = async (idx) => {
            isDownloadingScene.value = idx;
            await new Promise(r => setTimeout(r, 100)); // DOM update bekle
            
            const node = document.getElementById(`final-scene-${idx}`);
            try {
                const canvas = await executeCanvasDownload(node);
                canvas.toBlob(blob => {
                    window.saveAs(blob, `RP_Sahne_${idx + 1}.png`);
                });
            } catch (e) {
                console.error(e);
                alert("İndirme sırasında hata oluştu.");
            } finally {
                isDownloadingScene.value = null;
            }
        };

        const uploadToImgur = async () => {
            if (mergedScenes.value.length === 0) return;
            isUploadingAll.value = true;
            uploadBtnText.value = "☁️ İşleniyor ve Yüklenecek...";
            bbcodeOutput.value = "";

            await new Promise(r => setTimeout(r, 100)); 

            for (let idx = 0; idx < mergedScenes.value.length; idx++) {
                uploadBtnText.value = `☁️ Yükleniyor... (${idx + 1}/${mergedScenes.value.length})`;
                const node = document.getElementById(`final-scene-${idx}`);
                
                try {
                    const canvas = await executeCanvasDownload(node);
                    const base64Data = canvas.toDataURL("image/png").split(',')[1];
                    
                    const response = await axios.post('api.php', {
                        token: API_SECRET_TOKEN, // GÜVENLİK: İstekte token gönderiliyor
                        action: 'uploadImgur',
                        image: base64Data
                    });

                    if (response.data && response.data.success) {
                        bbcodeOutput.value += `[img]${response.data.data.link}[/img]\n`;
                    } else {
                        bbcodeOutput.value += `[Hata: ${idx + 1}. Sahne Yüklenemedi]\n`;
                    }
                } catch (e) {
                    console.error("Upload error:", e);
                    bbcodeOutput.value += `[Hata: ${idx + 1}. Sahne Çizilemedi/Yüklenemedi]\n`;
                }
            }

            isUploadingAll.value = false;
            uploadBtnText.value = "☁️ Tüm Sahneleri Imgur'a Yükle & BBCode Al";
        };

        const copyBbcode = () => {
            navigator.clipboard.writeText(bbcodeOutput.value).then(() => {
                copyBtnText.value = "✅ Kopyalandı!";
                setTimeout(() => { copyBtnText.value = "📋 Kopyala"; }, 2000);
            });
        };

        return {
            aiBase64Images,
            isAiMenuOpen,
            characters,
            aiPrompt,
            chatlogText,
            formattedPreview,
            selectedColor,
            isGenerating,
            generateBtnText,
            mergedScenes,
            isDownloadingScene,
            isUploadingAll,
            uploadBtnText,
            bbcodeOutput,
            copyBtnText,
            lightboxVisible,
            lightboxImage,
            textOnlyPreviewRef, // VUE REFS return edildi
            workspaceRef,       // VUE REFS return edildi
            openLightbox,
            closeLightbox,
            handleFileUpload,
            removeImage,
            updatePreview,
            generateChatlog,
            downloadTextOnly,
            distributeToImages,
            changeFontSize,
            updateSceneHtml,
            handleDragStart,
            handleDragMove,
            handleDragEnd,
            applyBlur,
            handleEditableFocus,
            handleEditableBlur,
            downloadIndividualScene,
            uploadToImgur,
            copyBbcode
        };
    }
});

app.mount('#app');