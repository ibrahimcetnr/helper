<div class="view-container">
    <div class="faq-container">
        <div class="faq-header">
            <h2>🤖 Rina Bilgi Asistanı</h2>
            <p>Rina Forum standartlarına göre sorularını yanıtlarım.</p>
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
                <div class="response-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="ai-badge">AI YANITI</span>
                    <button @click="faqResponse = ''" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 1.5rem;">×</button>
                </div>
                <div class="response-content" v-html="faqResponse" style="margin-top: 15px; line-height: 1.6;"></div>
                <div class="response-footer" style="margin-top: 15px; font-size: 0.7rem; opacity: 0.5; border-top: 1px solid var(--border); padding-top: 10px;">
                    *Yanıtlar forumdaki admin duyuruları baz alınarak üretilmiştir.
                </div>
            </div>
        </transition>
    </div>
</div>