<?php include 'header.php'; ?>

    <main class="spa-content">
        <transition name="page-fade" mode="out-in">
    <div v-if="currentPage === 'home'" key="home" class="view-container">
        <?php include 'home.php'; ?>
    </div>
    <div v-if="currentPage === 'generator'" key="generator" class="main-container">
        <?php include 'generator.php'; ?>
    </div>
    <div v-if="currentPage === 'faq'" key="faq" class="view-container">
        <?php include 'faq.php'; ?>
    </div>
</transition>
    </main>

    <div id="lightbox" class="lightbox-overlay" :style="{ display: lightboxVisible ? 'flex' : 'none' }" @click="closeLightbox">
        <span class="lightbox-close">&times;</span>
        <img class="lightbox-img" :src="lightboxImage" @click.stop>
    </div>

<?php include 'footer.php'; ?>