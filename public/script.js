const MONETAG_CONFIG = {
    rewards: {
        points: 3
    },
    zoneId: 10370101,
    domain: '5gvci.com',
    metaTag: '9b1690adc261addeb2398148c36954e4',
    testMode: false
};

let selectedStyle = "realistic";
let promptText = "";
let generatedImageUrl = "";
let currentPage = "page-home";
let userPoints = 0;
const POINTS_PER_IMAGE = 1;
const INITIAL_POINTS = 5;

let monetagAdsInitialized = false;
let adInProgress = false;
let adLoadAttempts = 0;
const MAX_AD_ATTEMPTS = 3;
let monetagSDKLoaded = false;

let history = JSON.parse(localStorage.getItem('asta-ai-history')) || [];
const MAX_HISTORY = 10;

let pages, styleOptions, generateBtn, resultImg, previewContainer, loadingDiv;
let historyGrid, fullHistoryGrid, emptyGallery, fullEmptyGallery, imageUrlDisplay;
let copyLinkBtn, copyIndicator, promptTextarea, pointsCountElement, currentPointsElement;
let resultPointsCountElement, historyPointsCountElement, watchAdBtn, adContainer;
let adStatusText, adTimerElement, adProgress, adProgressFill, adStatusElement;
let monetagOverlay, monetagAdContent, closeMonetagAd, navHomeBtn, navHistoryBtn;
let backToHomeBtn, newImageBtn;

function initApp() {
    getDOMElements();
    loadUserPoints();
    updatePointsDisplay();
    updateHistoryGallery();
    updateFullHistoryGallery();
    setupEventListeners();
    updatePromptText();
    setupLanguageWarning();
    initMonetagAds();
    setTimeout(checkMonetagSDK, 1000);
}

function getDOMElements() {
    pages = document.querySelectorAll('.page');
    styleOptions = document.querySelectorAll('.style-option');
    generateBtn = document.getElementById('generate');
    resultImg = document.getElementById('result');
    previewContainer = document.getElementById('preview-container');
    loadingDiv = document.getElementById('loading');
    historyGrid = document.getElementById('history-grid');
    fullHistoryGrid = document.getElementById('full-history-grid');
    emptyGallery = document.getElementById('empty-gallery');
    fullEmptyGallery = document.getElementById('full-empty-gallery');
    imageUrlDisplay = document.getElementById('image-url-display');
    copyLinkBtn = document.getElementById('copy-link-btn');
    copyIndicator = document.getElementById('copy-indicator');
    promptTextarea = document.getElementById('prompt');
    pointsCountElement = document.getElementById('points-count');
    currentPointsElement = document.getElementById('current-points');
    resultPointsCountElement = document.getElementById('result-points-count');
    historyPointsCountElement = document.getElementById('history-points-count');
    watchAdBtn = document.getElementById('watch-ad-btn');
    adContainer = document.getElementById('ad-container');
    adStatusText = document.getElementById('ad-status-text');
    adTimerElement = document.getElementById('ad-timer');
    adProgress = document.getElementById('ad-progress');
    adProgressFill = document.getElementById('ad-progress-fill');
    adStatusElement = document.getElementById('ad-status');
    monetagOverlay = document.getElementById('monetag-overlay');
    monetagAdContent = document.getElementById('monetag-ad-content');
    closeMonetagAd = document.getElementById('close-monetag-ad');
    navHomeBtn = document.getElementById('nav-home');
    navHistoryBtn = document.getElementById('nav-history');
    backToHomeBtn = document.getElementById('back-to-home');
    newImageBtn = document.getElementById('new-image');
}

function initMonetagAds() {
    if (!MONETAG_CONFIG.metaTag) {
        console.error('Monetag meta tag not found');
        showAdStatus('إعدادات الإعلانات غير مكتملة', 'error');
        return;
    }
}

function checkMonetagSDK() {
    if (typeof window.Monetag !== 'undefined') {
        monetagSDKLoaded = true;
        monetagAdsInitialized = true;
        showAdStatus('الإعلانات جاهزة. اضغط لمشاهدة إعلان والحصول على نقاط', 'ready');
        updateAdButtonStatus();
        console.log('Monetag SDK loaded successfully');
    } else {
        setTimeout(() => {
            if (!monetagSDKLoaded) {
                adLoadAttempts++;
                if (adLoadAttempts < 5) {
                    checkMonetagSDK();
                } else {
                    showAdStatus('تعذر تحميل نظام الإعلانات', 'error');
                    updateAdButtonStatus();
                }
            }
        }, 1000);
    }
}

function showAdStatus(message, type = 'info') {
    if (adStatusText) adStatusText.textContent = message;
    
    if (adStatusElement) {
        if (type === 'ready') {
            adStatusElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            adStatusElement.className = 'ad-status ready';
        } else if (type === 'loading') {
            adStatusElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
            adStatusElement.className = 'ad-status loading';
        } else if (type === 'error') {
            adStatusElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            adStatusElement.className = 'ad-status error';
        }
    }
}

function updateAdButtonStatus() {
    if (!watchAdBtn) return;
    
    if (!monetagAdsInitialized || adInProgress) {
        watchAdBtn.disabled = true;
        watchAdBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري التحميل...`;
        return;
    }
    
    watchAdBtn.disabled = false;
    watchAdBtn.innerHTML = `<i class="fas fa-play-circle"></i> مشاهدة إعلان والحصول على ${MONETAG_CONFIG.rewards.points} نقاط`;
}

function showMonetagAd() {
    if (!monetagAdsInitialized || adInProgress) {
        showToast("الإعلانات غير متاحة حالياً. حاول مرة أخرى لاحقاً.", "error");
        return;
    }
    
    adInProgress = true;
    adLoadAttempts = 0;
    watchAdBtn.disabled = true;
    watchAdBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري تحميل الإعلان...`;
    showAdStatus('جاري تحميل الإعلان...', 'loading');
    
    attemptShowRealMonetagAd();
}

function attemptShowRealMonetagAd() {
    if (adLoadAttempts >= MAX_AD_ATTEMPTS) {
        resetAdState();
        showAdStatus('تعذر تحميل الإعلان. حاول مرة أخرى لاحقاً', 'error');
        showToast("تعذر تحميل الإعلان بعد عدة محاولات.", "error");
        return;
    }
    
    adLoadAttempts++;
    
    monetagOverlay.classList.add('active');
    
    if (typeof window.Monetag !== 'undefined') {
        showRealMonetagAd();
    } else {
        showSimulatedMonetagAd();
    }
}

function showRealMonetagAd() {
    try {
        monetagAdContent.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <h4 style="color: #333; margin-bottom: 1rem;">جاري تحميل إعلان Monetag...</h4>
                <div class="spinner" style="border-top-color: #FF6B6B;"></div>
                <p style="color: #666; margin-top: 1rem;">يرجى الانتظار</p>
            </div>
        `;
        
        window.Monetag.getAd({
            zoneid: MONETAG_CONFIG.zoneId,
            format: 'rewarded',
            onReady: function(ad) {
                monetagAdContent.innerHTML = `
                    <div style="text-align: center; padding: 1rem;">
                        <h4 style="color: #333; margin-bottom: 1rem;">إعلان Monetag جاهز</h4>
                        <p style="color: #666; margin-bottom: 1rem;">سيتم عرض الإعلان الآن</p>
                    </div>
                `;
                
                ad.display();
                startAdProgress();
            },
            onDisplay: function() {
                console.log('Monetag ad displayed');
                adProgress.style.display = 'block';
            },
            onClose: function() {
                console.log('Monetag ad closed');
                closeMonetagAdWindow();
                resetAdState();
            },
            onReward: function() {
                console.log('Monetag ad rewarded');
                const newPoints = addPoints(MONETAG_CONFIG.rewards.points);
                
                monetagAdContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981;"></i>
                        <h4 style="color: #333; margin: 1rem 0;">مبروك! 🎉</h4>
                        <p style="color: #333; margin-bottom: 0.5rem;">لقد أكملت مشاهدة الإعلان بنجاح</p>
                        <p style="color: #666; margin-bottom: 1.5rem;">تمت إضافة <strong>${MONETAG_CONFIG.rewards.points} نقاط</strong> إلى رصيدك</p>
                        <div style="background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 0.8rem; border-radius: 10px; margin-bottom: 1.5rem;">
                            <p style="margin: 0; font-size: 1.2rem; font-weight: bold;">النقاط الإجمالية: ${newPoints}</p>
                        </div>
                        <button id="close-ad-btn" style="background: #FF6B6B; color: white; border: none; padding: 0.8rem 2rem; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                            موافق
                        </button>
                    </div>
                `;
                
                document.getElementById('close-ad-btn').addEventListener('click', function() {
                    closeMonetagAdWindow();
                    showToast(`مبروك! لقد حصلت على ${MONETAG_CONFIG.rewards.points} نقاط. النقاط الإجمالية: ${newPoints}`, "success");
                });
            },
            onError: function(error) {
                console.error('Monetag Ad Error:', error);
                showSimulatedMonetagAd();
            }
        });
    } catch (error) {
        console.error('Error showing Monetag ad:', error);
        showSimulatedMonetagAd();
    }
}

function showSimulatedMonetagAd() {
    monetagAdContent.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <h4 style="color: #333; margin-bottom: 1rem;">🎉 إعلان تجريبي 🎉</h4>
            <div style="background: linear-gradient(135deg, #FF6B6B, #FF8E53); padding: 2rem; border-radius: 10px; margin-bottom: 1rem;">
                <i class="fas fa-ad" style="font-size: 3rem; color: white;"></i>
            </div>
            <p style="color: #333; margin-bottom: 1rem;">هذا إعلان تجريبي من Monetag</p>
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1.5rem;">سيتم منحك ${MONETAG_CONFIG.rewards.points} نقاط عند اكتمال مشاهدة هذا الإعلان</p>
            <div style="background: #f0f0f0; padding: 0.5rem; border-radius: 5px; margin-bottom: 1.5rem;">
                <p style="color: #333; margin: 0; font-weight: bold;">مدة الإعلان: <span id="ad-countdown">30</span> ثانية</p>
            </div>
            <button id="skip-ad-btn" style="background: #FF6B6B; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: bold;">
                تخطي الإعلان
            </button>
        </div>
    `;
    
    startAdCountdown();
    
    document.getElementById('skip-ad-btn').addEventListener('click', function() {
        showToast("يجب مشاهدة الإعلان كاملاً للحصول على النقاط", "warning");
    });
}

function startAdProgress() {
    let seconds = 0;
    const maxSeconds = 30;
    
    const timer = setInterval(() => {
        seconds++;
        const progress = (seconds / maxSeconds) * 100;
        adProgressFill.style.width = `${Math.min(progress, 100)}%`;
        adTimerElement.textContent = `جاري عرض الإعلان (${seconds} ثانية)`;
        
        if (seconds >= maxSeconds) {
            clearInterval(timer);
        }
    }, 1000);
}

function startAdCountdown() {
    let seconds = 30;
    const countdownElement = document.getElementById('ad-countdown');
    
    const countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        
        const progress = ((30 - seconds) / 30) * 100;
        adProgressFill.style.width = `${progress}%`;
        adTimerElement.textContent = `جاري عرض الإعلان (${seconds} ثانية)`;
        
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            completeAdViewing();
        }
    }, 1000);
}

function completeAdViewing() {
    const newPoints = addPoints(MONETAG_CONFIG.rewards.points);
    
    monetagAdContent.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981;"></i>
            <h4 style="color: #333; margin: 1rem 0;">مبروك! 🎉</h4>
            <p style="color: #333; margin-bottom: 0.5rem;">لقد أكملت مشاهدة الإعلان بنجاح</p>
            <p style="color: #666; margin-bottom: 1.5rem;">تمت إضافة <strong>${MONETAG_CONFIG.rewards.points} نقاط</strong> إلى رصيدك</p>
            <div style="background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 0.8rem; border-radius: 10px; margin-bottom: 1.5rem;">
                <p style="margin: 0; font-size: 1.2rem; font-weight: bold;">النقاط الإجمالية: ${newPoints}</p>
            </div>
            <button id="close-ad-btn" style="background: #FF6B6B; color: white; border: none; padding: 0.8rem 2rem; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem;">
                موافق
            </button>
        </div>
    `;
    
    document.getElementById('close-ad-btn').addEventListener('click', function() {
        closeMonetagAdWindow();
        showToast(`مبروك! لقد حصلت على ${MONETAG_CONFIG.rewards.points} نقاط. النقاط الإجمالية: ${newPoints}`, "success");
    });
    
    setTimeout(() => {
        if (monetagOverlay.classList.contains('active')) {
            closeMonetagAdWindow();
            showToast(`مبروك! لقد حصلت على ${MONETAG_CONFIG.rewards.points} نقاط. النقاط الإجمالية: ${newPoints}`, "success");
        }
    }, 3000);
}

function closeMonetagAdWindow() {
    monetagOverlay.classList.remove('active');
    resetAdState();
}

function resetAdState() {
    adInProgress = false;
    if (adProgress) adProgress.style.display = 'none';
    if (adProgressFill) adProgressFill.style.width = '0%';
    if (adTimerElement) adTimerElement.textContent = '';
    if (adContainer) adContainer.style.background = 'rgba(0, 0, 0, 0.3)';
    
    updateAdButtonStatus();
    showAdStatus('شاهد إعلانًا واحصل على 3 نقاط مجانية', 'ready');
}

function loadUserPoints() {
    const savedPoints = localStorage.getItem('asta-ai-points');
    
    if (savedPoints === null) {
        userPoints = INITIAL_POINTS;
        saveUserPoints();
        
        setTimeout(() => {
            showToast(`مرحبًا بك! لقد حصلت على ${INITIAL_POINTS} نقاط ترحيبية`, "success");
        }, 1000);
    } else {
        userPoints = parseInt(savedPoints);
    }
}

function saveUserPoints() {
    localStorage.setItem('asta-ai-points', userPoints.toString());
}

function updatePointsDisplay() {
    if (pointsCountElement) pointsCountElement.textContent = userPoints;
    if (currentPointsElement) currentPointsElement.textContent = userPoints;
    if (resultPointsCountElement) resultPointsCountElement.textContent = userPoints;
    if (historyPointsCountElement) historyPointsCountElement.textContent = userPoints;
    
    if (generateBtn) {
        generateBtn.innerHTML = `<i class="fas fa-magic"></i> توليد الصورة الآن (تكلفة: ${POINTS_PER_IMAGE} نقطة)`;
    }
    
    const headerPoints = document.getElementById('header-points');
    if (headerPoints) {
        if (userPoints <= 1) {
            headerPoints.style.background = 'rgba(239, 68, 68, 0.2)';
        } else if (userPoints <= 3) {
            headerPoints.style.background = 'rgba(245, 158, 11, 0.2)';
        } else {
            headerPoints.style.background = 'var(--gradient-points)';
        }
    }
}

function hasEnoughPoints() {
    return userPoints >= POINTS_PER_IMAGE;
}

function deductPointsForImage() {
    if (userPoints >= POINTS_PER_IMAGE) {
        userPoints -= POINTS_PER_IMAGE;
        saveUserPoints();
        updatePointsDisplay();
        return true;
    }
    return false;
}

function addPoints(points) {
    userPoints += points;
    saveUserPoints();
    updatePointsDisplay();
    return userPoints;
}

function setupEventListeners() {
    if (navHomeBtn) navHomeBtn.addEventListener('click', () => navigateTo('page-home'));
    if (navHistoryBtn) navHistoryBtn.addEventListener('click', () => navigateTo('page-history'));
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', () => navigateTo('page-home'));
    if (newImageBtn) newImageBtn.addEventListener('click', () => navigateTo('page-home'));
    
    if (styleOptions) {
        styleOptions.forEach(option => {
            option.addEventListener('click', () => {
                styleOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedStyle = option.dataset.style;
            });
        });
    }
    
    if (generateBtn) generateBtn.addEventListener('click', generateImage);
    if (watchAdBtn) watchAdBtn.addEventListener('click', showMonetagAd);
    if (closeMonetagAd) closeMonetagAd.addEventListener('click', closeMonetagAdWindow);
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', copyImageLink);
    
    if (document.getElementById('direct-download')) {
        document.getElementById('direct-download').addEventListener('click', directDownload);
    }
    
    if (document.getElementById('share-whatsapp')) {
        document.getElementById('share-whatsapp').addEventListener('click', () => shareOnWhatsApp());
    }
    
    if (document.getElementById('share-telegram')) {
        document.getElementById('share-telegram').addEventListener('click', () => shareOnTelegram());
    }
    
    if (document.getElementById('share-twitter')) {
        document.getElementById('share-twitter').addEventListener('click', () => shareOnTwitter());
    }
    
    if (document.getElementById('share-facebook')) {
        document.getElementById('share-facebook').addEventListener('click', () => shareOnFacebook());
    }
    
    if (promptTextarea) {
        promptTextarea.addEventListener('input', updatePromptText);
        promptTextarea.addEventListener('focus', showLanguageWarning);
    }
    
    if (copyIndicator) {
        copyIndicator.addEventListener('click', () => {
            copyIndicator.classList.remove('show');
        });
    }
    
    if (monetagOverlay) {
        monetagOverlay.addEventListener('click', function(e) {
            if (e.target === monetagOverlay) {
                closeMonetagAdWindow();
            }
        });
    }
}

function setupLanguageWarning() {
    if (promptTextarea) {
        promptTextarea.addEventListener('input', checkLanguage);
    }
}

function showLanguageWarning() {
    showToast("الرجاء كتابة الوصف باللغة الإنجليزية فقط", "info");
}

function checkLanguage() {
    const text = promptTextarea.value;
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(text)) {
        promptTextarea.style.borderColor = "var(--warning)";
        promptTextarea.style.boxShadow = "0 0 0 2px rgba(245, 158, 11, 0.2)";
    } else {
        promptTextarea.style.borderColor = "";
        promptTextarea.style.boxShadow = "";
    }
}

function navigateTo(pageId) {
    currentPage = pageId;
    
    if (pages) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }
    
    if (pageId === 'page-history') {
        updateFullHistoryGallery();
    }
    
    updatePointsDisplay();
}

function updatePromptText() {
    promptText = promptTextarea.value.trim();
}

async function generateImage() {
    if (!promptText) {
        promptText = promptTextarea.value.trim();
        if (!promptText) {
            showToast("الرجاء إدخال وصف للصورة", "error");
            return;
        }
    }
    
    if (!hasEnoughPoints()) {
        showToast(`ليس لديك نقاط كافية. تحتاج إلى ${POINTS_PER_IMAGE} نقطة لتوليد صورة. شاهد إعلانًا للحصول على نقاط مجانية.`, "error");
        return;
    }
    
    const arabicRegex = /[\u0600-\u06FF]/;
    if (arabicRegex.test(promptText)) {
        const confirmEnglish = confirm("يبدو أنك كتبت الوصف باللغة العربية. للحصول على أفضل النتائج، يجب كتابة الوصف باللغة الإنجليزية. هل تريد المتابعة على أي حال؟");
        if (!confirmEnglish) {
            promptTextarea.focus();
            return;
        }
    }
    
    if (!deductPointsForImage()) {
        showToast("حدث خطأ في خصم النقاط", "error");
        return;
    }
    
    navigateTo('page-result');
    
    if (loadingDiv) loadingDiv.style.display = "flex";
    if (resultImg) resultImg.style.display = "none";
    if (generateBtn) generateBtn.disabled = true;
    if (copyLinkBtn) copyLinkBtn.disabled = true;
    
    const stylePrompts = {
        'realistic': 'realistic, photorealistic, 8k, ultra detailed, professional photography, sharp focus',
        'cartoon': 'cartoon style, vibrant colors, animated, digital art, Pixar style, character design',
        'fantasy': 'fantasy art, magical, epic, dramatic lighting, concept art, detailed, mystical',
        'anime': 'anime style, japanese animation, vibrant, detailed, Makoto Shinkai style, studio ghibli'
    };
    
    const finalPrompt = `${promptText}, ${stylePrompts[selectedStyle]}, high quality, detailed, masterpiece`;
    
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=768&nologo=true&t=${Date.now()}`;
    
    if (resultImg) resultImg.crossOrigin = 'anonymous';
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
        if (resultImg) {
            resultImg.src = imageUrl;
            resultImg.onload = function() {
                if (loadingDiv) loadingDiv.style.display = "none";
                if (resultImg) resultImg.style.display = "block";
                if (previewContainer) previewContainer.classList.add("has-image");
                if (generateBtn) generateBtn.disabled = false;
                
                saveToHistory(promptText, selectedStyle, imageUrl);
                updateImageUrlDisplay(imageUrl);
                
                showToast(`تم إنشاء الصورة بنجاح! تم خصم ${POINTS_PER_IMAGE} نقطة. النقاط المتبقية: ${userPoints}`, "success");
            };
        }
    };
    
    img.onerror = function() {
        const fallbackImages = [
            'https://images.unsplash.com/photo-1541963463532-d68292c34b19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80',
            'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80',
            'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80'
        ];
        
        const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        if (resultImg) {
            resultImg.src = randomImage + '?t=' + Date.now();
            
            resultImg.onload = function() {
                if (loadingDiv) loadingDiv.style.display = "none";
                if (resultImg) resultImg.style.display = "block";
                if (previewContainer) previewContainer.classList.add("has-image");
                if (generateBtn) generateBtn.disabled = false;
                
                saveToHistory(promptText, selectedStyle, randomImage);
                updateImageUrlDisplay(randomImage);
                
                showToast("تم إنشاء صورة تجريبية للعرض", "info");
            };
        }
    };
    
    img.src = imageUrl;
}

function saveToHistory(prompt, style, imageUrl) {
    const historyItem = {
        id: Date.now(),
        prompt: prompt,
        style: style,
        imageUrl: imageUrl,
        date: new Date().toLocaleString('ar-SA'),
        timestamp: Date.now()
    };
    
    history.unshift(historyItem);
    
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    localStorage.setItem('asta-ai-history', JSON.stringify(history));
    
    updateHistoryGallery();
    updateFullHistoryGallery();
}

function updateHistoryGallery() {
    if (!historyGrid || !emptyGallery) return;
    
    if (history.length === 0) {
        emptyGallery.style.display = 'block';
        historyGrid.innerHTML = '';
        return;
    }
    
    emptyGallery.style.display = 'none';
    const recentHistory = history.slice(0, 4);
    historyGrid.innerHTML = '';
    
    recentHistory.forEach(item => {
        const galleryItem = createGalleryItem(item);
        historyGrid.appendChild(galleryItem);
    });
}

function updateFullHistoryGallery() {
    if (!fullHistoryGrid || !fullEmptyGallery) return;
    
    if (history.length === 0) {
        fullEmptyGallery.style.display = 'block';
        fullHistoryGrid.innerHTML = '';
        return;
    }
    
    fullEmptyGallery.style.display = 'none';
    fullHistoryGrid.innerHTML = '';
    
    history.forEach(item => {
        const galleryItem = createGalleryItem(item);
        fullHistoryGrid.appendChild(galleryItem);
    });
}

function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.dataset.id = item.id;
    
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.prompt;
    img.loading = 'lazy';
    
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    overlay.innerHTML = `<i class="fas fa-redo"></i>`;
    
    div.appendChild(img);
    div.appendChild(overlay);
    
    div.addEventListener('click', () => {
        reuseImageSettings(item);
    });
    
    return div;
}

function reuseImageSettings(item) {
    if (!hasEnoughPoints()) {
        showToast(`ليس لديك نقاط كافية. تحتاج إلى ${POINTS_PER_IMAGE} نقطة لتوليد صورة. شاهد إعلانًا للحصول على نقاط مجانية.`, "error");
        return;
    }
    
    if (promptTextarea) {
        promptTextarea.value = item.prompt;
        promptText = item.prompt;
    }
    
    if (styleOptions) {
        styleOptions.forEach(opt => opt.classList.remove('selected'));
        const selectedOption = document.querySelector(`.style-option[data-style="${item.style}"]`);
        if (selectedOption) selectedOption.classList.add('selected');
    }
    
    selectedStyle = item.style;
    
    navigateTo('page-home');
    if (promptTextarea) promptTextarea.focus();
    
    showToast(`تم تحميل إعدادات الصورة: "${item.prompt.substring(0, 30)}..."`, "success");
}

function updateImageUrlDisplay(imageUrl) {
    generatedImageUrl = imageUrl;
    
    if (!imageUrlDisplay) return;
    
    if (!imageUrl) {
        imageUrlDisplay.textContent = "لا يوجد رابط متاح";
        return;
    }
    
    if (imageUrl.length > 45) {
        const shortUrl = imageUrl.substring(0, 45) + "...";
        imageUrlDisplay.textContent = shortUrl;
        imageUrlDisplay.title = imageUrl;
    } else {
        imageUrlDisplay.textContent = imageUrl;
    }
    
    if (copyLinkBtn) copyLinkBtn.disabled = false;
}

async function copyImageLink() {
    if (!generatedImageUrl) {
        showToast("لا يوجد رابط للنسخ", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(generatedImageUrl);
        showCopySuccess();
    } catch (err) {
        copyUsingTextarea(generatedImageUrl);
    }
}

function copyUsingTextarea(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        showToast("تعذر نسخ الرابط", "error");
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    if (copyIndicator) copyIndicator.classList.add('show');
    
    setTimeout(() => {
        if (copyIndicator) copyIndicator.classList.remove('show');
    }, 1800);
    
    showToast("تم نسخ رابط الصورة", "success");
}

function directDownload() {
    if (!generatedImageUrl) {
        showToast("لا توجد صورة للتحميل", "error");
        return;
    }

    try {
        const a = document.createElement("a");
        a.href = generatedImageUrl;
        a.download = `asta-ai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast("بدأ تحميل الصورة", "success");
    } catch (error) {
        showToast("تعذر تحميل الصورة", "error");
    }
}

function shareOnWhatsApp() {
    if (!generatedImageUrl) return;
    const text = `تم إنشاؤها عبر Asta AI ✨\n${generatedImageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareOnTelegram() {
    if (!generatedImageUrl) return;
    const text = `تم إنشاؤها عبر Asta AI ✨\n${generatedImageUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(generatedImageUrl)}&text=${encodeURIComponent(text)}`, '_blank');
}

function shareOnTwitter() {
    if (!generatedImageUrl) return;
    const text = `تم إنشاؤها عبر Asta AI ✨ ${generatedImageUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
}

function shareOnFacebook() {
    if (!generatedImageUrl) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedImageUrl)}`, '_blank');
}

function showToast(message, type = "success") {
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', initApp);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    });
}