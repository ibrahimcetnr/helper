const { createApp, ref, reactive, computed, onMounted } = Vue;

const app = createApp({
    setup() {
        // --- SAYFA YÖNETİMİ ---
        const currentPage = ref('home'); 

        // --- FAQ (SORU-CEVAP) DEĞİŞKENLERİ ---
        const faqQuery = ref('');
        const faqResponse = ref('');
        const isAskingFaq = ref(false);

        // --- SS OLUŞTURUCU DEĞİŞKENLERİ ---
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

        const API_SECRET_TOKEN = 'RpChatlog_Gizli_Token_2024!@#';
        const textOnlyPreviewRef = ref(null);
        const workspaceRef = ref(null);

        // --- FAQ FONKSİYONU ---
        const askFaq = async () => {
            if (!faqQuery.value.trim()) return;
            isAskingFaq.value = true;
            faqResponse.value = '';
            try {
                const res = await axios.post('api.php', {
                    action: 'askFaq',
                    token: API_SECRET_TOKEN,
                    question: faqQuery.value
                });
                if (res.data.candidates && res.data.candidates[0]) {
                    let rawText = res.data.candidates[0].content.parts[0].text;
                    faqResponse.value = rawText
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                }
            } catch (e) {
                faqResponse.value = "Sunucu hatası oluştu.";
            } finally {
                isAskingFaq.value = false;
                faqQuery.value = '';
            }
        };

        // --- GÖRSEL İŞLEMLERİ ---
        const compressImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const MAX_WIDTH = 1920; 
                        let width = img.width;
                        let height = img.height;
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                        resolve(base64);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        const handleFileUpload = async (event) => {
            const files = event.target.files;
            for (let file of files) {
                const compressedBase64 = await compressImage(file);
                aiBase64Images.value.push(compressedBase64);
            }
            event.target.value = ''; 
        };

        const removeImage = (idx) => {
            aiBase64Images.value.splice(idx, 1);
            if (mergedScenes.value[idx]) mergedScenes.value.splice(idx, 1);
        };

        const openLightbox = (base64) => { lightboxImage.value = 'data:image/jpeg;base64,' + base64; lightboxVisible.value = true; };
        const closeLightbox = () => { lightboxVisible.value = false; };

        // --- FORMATLAMA VE ÖNİZLEME ---
        const formatChatlogTextLogic = (textArray, transparentMode = false, overrideColor = selectedColor.value) => {
            let formattedText = "";
            const smsRegex = /^(\[SMS\] [«»] \w+:)(.*)$/i;
            textArray.forEach((line) => {
                if (!line.trim()) return;
                let bgStyle = transparentMode ? "background-color: transparent !important;" : `background-color: ${overrideColor};`;
                formattedText += `<div class="wizard-generated-row" style="${bgStyle}">`;
                line = line.replace(/\[emote\](.*?)\[\/emote\]/g, (match, p1) => `<span style="color: #C2A2DA;">${p1}</span>`);
                if (line.startsWith("*")) formattedText += `<span style="color: #C2A2DA;">${line}</span><br>`;
                else if (line.includes("Megafonu)")) formattedText += `<span style="color: #FFA500;">${line}</span><br>`;
                else if (smsRegex.test(line)) {
                    const match = line.match(smsRegex);
                    formattedText += `<span style="color: #33CCFF;">${match[1]}</span><span style="color: #FFFFFF;">${match[2]}</span><br>`;
                }
                else formattedText += line + "<br>";
                formattedText += "</div>";
            });
            return formattedText;
        };

        const updatePreview = () => {
            const lines = chatlogText.value.split("\n");
            formattedPreview.value = formatChatlogTextLogic(lines, false, selectedColor.value);
            mergedScenes.value.forEach(scene => {
                scene.html = formatChatlogTextLogic(scene.rawLines, true, selectedColor.value);
            });
        };

        // --- ÜRETİM VE DAĞITIM ---
        const generateChatlog = async () => {
            if (aiBase64Images.value.length === 0) return alert("Fotoğraf yükleyin!");
            isGenerating.value = true;
            generateBtnText.value = "⏳ Üretiliyor...";
             const prompt = `SEN, RİNA ROLEPLAY STANDARTLARINDA, HARDCORE TEXT-BASED BİR GTA 5 ROLEPLAY CHATLOG (SOHBET GEÇMİŞİ) ÜRETİCİSİSİN.
Aşağıdaki kurallara MUTLAK SURETLE uyacaksın. Kuralların dışına çıkmak, sistemi bozmak anlamına gelir.

KURALLAR VE DİREKTİFLER:

1. SIFIR SİSTEM MESAJI: 
   - Sadece ve sadece raw (saf) roleplay logu üreteceksin. 
   - "İşte senaryonuz:", "Başlıyorum:" gibi hiçbir giriş/çıkış veya açıklama cümlesi KURMAYACAKSIN.

2. İSİM KULLANIMI (ÇOK KRİTİK):
   - Eylemi yapan, durumu belirten veya konuşan kişinin ismini DAİMA TAM AD VE SOYAD ile yaz (Örn: James Carter).
   - Karakterler diyalog içinde birbirlerine KESİNLİKLE SOYADI KULLANMAYACAK. Sadece ilk isimleriyle hitap edecekler.

3. CHATLOG FORMATI (/me, /do ve IC Chat):
   - KONUŞMA (IC CHAT): Tırnak işareti KESİNLİKLE KULLANILMAYACAK. Sadece İki nokta üst üste (:) kullanılacak.
   - EYLEM (/me): Karakterin fiziksel hareketleri AYRI SATIRDA yazılır. Yıldız (*) ile başlar. Geniş veya şimdiki zaman kipiyle biter.
   - DURUM/ÇEVRE (/do): Çevresel faktörler AYRI SATIRDA yazılır. Yıldız (*) ile başlar ve sonuna parantez içinde karakterin tam adı eklenir.

4. AMERİKAN KONSEPTİ VE YASAKLI KELİMELER:
   - TÜRK/ANADOLU JARGONU KESİNLİKLE YASAKTIR. (lan, valla, inşallah, abi, kanka vb.).
   - Bunun yerine Amerikan dublaj jargonu kullan: "Dostum, adamım, evlat, lanet olsun."

5. SATIR LİMİTİ VE UZUNLUK (DİKKAT!):
   - Kullanıcı bu işlem için toplam ${imageCount} adet görsel yükledi. 
   - Her görsel için en fazla 10 satır kuralına göre, üreteceğin toplam metin KESİNLİKLE ${maxLineCount} SATIRI GEÇMEMELİDİR!
   - Gerekli mikro rolleri yap ancak ${maxLineCount} satır sınırını aşmamak için olayları gereksiz yere uzatma, kısa ve öz tut.

KULLANILACAK KARAKTERLER: ${validChars.join(", ")}
İŞLENECEK SENARYO: ${aiPrompt.value}

Şimdi, yukarıdaki kurallara kusursuz bir şekilde uyarak chatlog'u yazmaya başla:`;
            try {
                const response = await axios.post('api.php', {
                    token: API_SECRET_TOKEN,
                    action: 'generateChatlog',
                    prompt: prompt,
                    images: aiBase64Images.value
                });
                if (response.data.success) {
                    chatlogText.value = response.data.data.candidates[0].content.parts[0].text.trim();
                    updatePreview();
                }
            } finally {
                isGenerating.value = false;
                generateBtnText.value = "✨ Diyalog Üret";
            }
        };

        const distributeToImages = () => {
            const lines = chatlogText.value.split('\n').filter(l => l.trim() !== '');
            if (lines.length === 0) return;
            const numImages = aiBase64Images.value.length;
            const linesPerImage = Math.ceil(lines.length / numImages);
            mergedScenes.value = [];
            for (let i = 0; i < numImages; i++) {
                const chunk = lines.slice(i * linesPerImage, (i + 1) * linesPerImage);
                mergedScenes.value.push({ rawLines: chunk, html: formatChatlogTextLogic(chunk, true, selectedColor.value), fontSize: 14, x: 20, y: 20 });
            }
        };

        // --- SÜRÜKLE BIRAK VE KONTROLLER ---
        const handleDragStart = (e, idx) => { draggingScene.value = idx; dragOffsetX.value = e.offsetX; dragOffsetY.value = e.offsetY; };
        const handleDragMove = (e) => {
            if (draggingScene.value === null) return;
            const idx = draggingScene.value;
            const containerBox = document.getElementById(`final-scene-${idx}`).getBoundingClientRect();
            mergedScenes.value[idx].x = e.clientX - containerBox.left - dragOffsetX.value;
            mergedScenes.value[idx].y = e.clientY - containerBox.top - dragOffsetY.value;
        };
        const handleDragEnd = () => { draggingScene.value = null; };

        const changeFontSize = (idx, step) => {
            let scene = mergedScenes.value[idx];
            scene.fontSize = Math.min(Math.max(scene.fontSize + step, 8), 40);
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

        // --- İNDİRME VE YÜKLEME ---
        const downloadIndividualScene = async (idx) => {
            isDownloadingScene.value = idx;
            await new Promise(r => setTimeout(r, 100));
            const node = document.getElementById(`final-scene-${idx}`);
            try {
                const canvas = await html2canvas(node, { useCORS: true, scale: 2 });
                canvas.toBlob(blob => window.saveAs(blob, `RP_Sahne_${idx + 1}.png`));
            } finally {
                isDownloadingScene.value = null;
            }
        };

        const uploadToImgur = async () => {
            isUploadingAll.value = true;
            bbcodeOutput.value = "";
            for (let idx = 0; idx < mergedScenes.value.length; idx++) {
                const node = document.getElementById(`final-scene-${idx}`);
                const canvas = await html2canvas(node, { useCORS: true, scale: 2 });
                const base64 = canvas.toDataURL("image/png").split(',')[1];
                const res = await axios.post('api.php', { token: API_SECRET_TOKEN, action: 'uploadImgur', image: base64 });
                if (res.data.success) bbcodeOutput.value += `[img]${res.data.data.link}[/img]\n`;
            }
            isUploadingAll.value = false;
        };

        const copyBbcode = () => {
            navigator.clipboard.writeText(bbcodeOutput.value).then(() => {
                copyBtnText.value = "✅ Kopyalandı!";
                setTimeout(() => { copyBtnText.value = "📋 Kopyala"; }, 2000);
            });
        };

        return {
            currentPage, faqQuery, faqResponse, isAskingFaq, askFaq,
            aiBase64Images, isAiMenuOpen, characters, aiPrompt, chatlogText, formattedPreview, selectedColor,
            isGenerating, generateBtnText, mergedScenes, isDownloadingScene, isUploadingAll, uploadBtnText,
            bbcodeOutput, copyBtnText, lightboxVisible, lightboxImage, openLightbox, closeLightbox,
            handleFileUpload, removeImage, updatePreview, generateChatlog, distributeToImages,
            handleDragStart, handleDragMove, handleDragEnd, changeFontSize, applyBlur,
            downloadIndividualScene, uploadToImgur, copyBbcode
        };
    }
});
app.mount('#app');