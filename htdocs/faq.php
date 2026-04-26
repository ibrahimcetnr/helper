<div class="faq-container">
    <div class="faq-header">
        <h2>🤖 Rina Bilgi Asistanı</h2>
        <p>Rina Forum (Board 111, 17, 25) standartlarına göre sorularını yanıtlarım.</p>
    </div>

    <div class="faq-search-box">
        <input 
            type="text" 
            v-model="faqQuery" 
            @keyup.enter="askFaq"
            placeholder="Örn: Birlik kurma kuralları nelerdir?" 
            :disabled="isAskingFaq"
        >
        <button @click="askFaq" :disabled="isAskingFaq">
            <span v-if="!isAskingFaq">Soru Sor</span>
            <span v-else>🔍 Arıyor...</span>
        </button>
    </div>

    <transition name="page-fade">
        <div v-if="faqResponse" class="faq-response-card">
            <div class="response-header">
                <span class="ai-badge">AI YANITI</span>
                <button @click="faqResponse = ''" class="close-res">×</button>
            </div>
            <div class="response-content" v-html="faqResponse"></div>
            <div class="response-footer">
                *Yanıtlar forumdaki admin duyuruları ve kurallar baz alınarak üretilmiştir.
            </div>
        </div>
    </transition>
</div>