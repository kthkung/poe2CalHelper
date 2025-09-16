// Global variables
let playerCount = 2;
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

// Currency data for POE2 (simplified to Divine and Exalted only)
const currencyData = {
    divine: { name: 'Divine Orbs', baseValue: 180 },
    exalted: { name: 'Exalted Orbs', baseValue: 25 }
};

// POE2Scout API configuration with fallback
const API_CONFIG = {
    baseUrl: 'https://poe2scout.com/api/items/',
    endpoints: {
        currency: 'currency/currency'
    },
    defaultLeague: 'Rise of the Abyssal',
    referenceCurrency: 'exalted'
};

// Fallback rates in case API is not available due to CORS
const FALLBACK_RATES = {
    divine: 205.84,  // 1 Divine = ~205.84 Exalted (last known rate)
    exalted: 1.00    // 1 Exalted = 1 Exalted (base currency)
};

// Currency mapping for API
const CURRENCY_API_MAP = {
    divine: 'divine',
    exalted: 'exalted'
};

// Store currency data from API
let currencyApiData = {
    divine: { price: 205.84, icon: null },
    exalted: { price: 1.0, icon: null }
};

// Flag to prevent manual marking during API updates
let isApiUpdating = false;

// DOM elements
const totalCurrencyInput = document.getElementById('totalCurrency');
const mapsCostInput = document.getElementById('mapsCost');
const mapsReimbursedCheckbox = document.getElementById('mapsReimbursed');
const divineRateInput = document.getElementById('divineRate');
const exaltedRateInput = document.getElementById('exaltedRate');
const totalValueInExalted = document.getElementById('totalValueInExalted');
const totalValueInDivine = document.getElementById('totalValueInDivine');
const lastUpdated = document.getElementById('lastUpdated');
const currentLeague = document.getElementById('currentLeague');
const apiStatus = document.getElementById('apiStatus');
const refreshRatesBtn = document.getElementById('refreshRates');
const playersContainer = document.getElementById('playersContainer');
const addPlayerBtn = document.getElementById('addPlayer');
const playerCountDisplay = document.getElementById('playerCount');
const displayTotal = document.getElementById('displayTotal');
const totalContributionDisplay = document.getElementById('totalContribution');
const resultsContainer = document.getElementById('resultsContainer');
const warningMessage = document.getElementById('warningMessage');
const equalSplitBtn = document.getElementById('equalSplit');
const clearAllBtn = document.getElementById('clearAll');
const copyResultsBtn = document.getElementById('copyResults');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Sync playerCount with actual player cards on page
    playerCount = document.querySelectorAll('.player-card').length;
    console.log(`Initial player count: ${playerCount}`);
    
    initializeEventListeners();
    updatePlayerCount();
    updateRemoveButtons(); // Make sure remove buttons are in correct state
    loadExchangeRatesFromAPI();
    calculateResults();
    
    // Initialize upload functionality for the active tab
    initializeUploadForTab('items'); // items tab might be clicked later
    initializeUploadForTab('evidence'); // evidence tab might be clicked later
    
    // Initialize player confirmations
    initializePlayerConfirmations();
    
    // Auto-load session
    autoLoadSession();
});

// Event listeners
function initializeEventListeners() {
    // Total currency input
    totalCurrencyInput.addEventListener('input', () => {
        calculateExchangeRates();
        calculateResults();
    });
    
    // Maps cost inputs
    mapsCostInput.addEventListener('input', calculateResults);
    mapsReimbursedCheckbox.addEventListener('change', calculateResults);
    
    // Exchange rate inputs (manual override)
    divineRateInput.addEventListener('input', () => {
        if (!isApiUpdating) {
            markRateAsManual('divine');
        }
        calculateExchangeRates();
        calculateResults();
    });
    exaltedRateInput.addEventListener('input', () => {
        if (!isApiUpdating) {
            markRateAsManual('exalted');
        }
        calculateExchangeRates();
        calculateResults();
    });
    
    // Refresh rates button
    refreshRatesBtn.addEventListener('click', loadExchangeRatesFromAPI);
    
    // Add player button
    addPlayerBtn.addEventListener('click', addPlayer);
    
    // Action buttons
    equalSplitBtn.addEventListener('click', equalSplit);
    clearAllBtn.addEventListener('click', clearAll);
    copyResultsBtn.addEventListener('click', copyResults);
    
    // Tab switching
    initializeTabSwitching();
    
    // Initialize existing players
    updatePlayerEventListeners();
}

// Tab Navigation Functions
function initializeTabSwitching() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            console.log('Tab clicked:', targetTab);
            
            // Remove active class from all tabs and contents
            navTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const targetElement = document.getElementById(`${targetTab}-tab`);
            if (targetElement) {
                targetElement.classList.add('active');
                console.log('Activated tab:', targetTab);
            } else {
                console.error('Tab element not found:', `${targetTab}-tab`);
            }
            
            // Initialize upload functionality for upload tabs
            if (targetTab === 'items' || targetTab === 'evidence') {
                initializeUploadForTab(targetTab);
            }
        });
    });
}

function initializeUploadForTab(tabType) {
    const uploadArea = document.getElementById(`${tabType}Upload`);
    const fileInput = document.getElementById(`${tabType}FileInput`);
    const gallery = document.getElementById(`${tabType}Gallery`);
    
    // Load existing images from localStorage
    loadImagesFromLocalStorage(tabType);
    
    // Click to upload (only add listener if not already added)
    if (!uploadArea.hasAttribute('data-initialized')) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files, gallery, tabType);
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files, gallery, tabType);
        });
        
        uploadArea.setAttribute('data-initialized', 'true');
    }
}

function handleFileUpload(files, gallery, tabType) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) { // 5MB limit
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    src: e.target.result,
                    filename: file.name,
                    timestamp: new Date().toISOString(),
                    size: file.size
                };
                addImageToGallery(imageData, gallery, tabType);
                saveImageToLocalStorage(imageData, tabType);
            };
            reader.readAsDataURL(file);
        } else {
            alert('กรุณาเลือกไฟล์รูปภาพที่มีขนาดไม่เกิน 5MB');
        }
    });
}

function addImageToGallery(imageData, gallery, tabType) {
    const imageCard = document.createElement('div');
    imageCard.className = 'image-card';
    imageCard.setAttribute('data-filename', imageData.filename);
    imageCard.setAttribute('data-timestamp', imageData.timestamp);
    
    const uploadDate = new Date(imageData.timestamp).toLocaleString('th-TH');
    const fileSize = (imageData.size / 1024).toFixed(1) + ' KB';
    
    imageCard.innerHTML = `
        <img src="${imageData.src}" alt="${imageData.filename}">
        <button class="remove-btn" onclick="removeImageFromGallery(this, '${tabType}')">×</button>
        <div class="image-info">
            <div class="filename">${imageData.filename}</div>
            <small class="file-meta">${fileSize} | ${uploadDate}</small>
        </div>
    `;
    
    gallery.appendChild(imageCard);
    
    // Update stats after adding image
    updateStatsDisplay(tabType);
}

function updateStatsDisplay(tabType) {
    const stats = getImageStats(tabType);
    const statsElement = document.getElementById(`${tabType}Stats`);
    
    if (statsElement) {
        statsElement.textContent = `รูปภาพ: ${stats.count} | ขนาด: ${stats.totalSizeMB} MB`;
    }
}

function saveImageToLocalStorage(imageData, tabType) {
    try {
        const storageKey = `poe2_${tabType}_images`;
        const existingImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Add new image
        existingImages.push(imageData);
        
        // Keep only last 50 images to prevent localStorage overflow
        if (existingImages.length > 50) {
            existingImages.splice(0, existingImages.length - 50);
        }
        
        localStorage.setItem(storageKey, JSON.stringify(existingImages));
        
        // Sync to localStorage if connected
        syncImageToLocalStorage(imageData, tabType, 'add');
        
        console.log(`Saved image to localStorage: ${tabType}`);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('ไม่สามารถบันทึกรูปภาพได้ (localStorage เต็ม)');
    }
}

function loadImagesFromLocalStorage(tabType) {
    try {
        const storageKey = `poe2_${tabType}_images`;
        const savedImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const gallery = document.getElementById(`${tabType}Gallery`);
        
        // Clear gallery first
        gallery.innerHTML = '';
        
        // Load saved images
        savedImages.forEach(imageData => {
            addImageToGallery(imageData, gallery, tabType);
        });
        
        // Update stats after loading all images
        updateStatsDisplay(tabType);
        
        console.log(`Loaded ${savedImages.length} images from localStorage: ${tabType}`);
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        // Still update stats even if loading fails
        updateStatsDisplay(tabType);
    }
}

function removeImageFromGallery(button, tabType) {
    const imageCard = button.closest('.image-card');
    const filename = imageCard.getAttribute('data-filename');
    const timestamp = imageCard.getAttribute('data-timestamp');
    
    // Remove from DOM
    imageCard.remove();
    
    // Remove from localStorage
    removeImageFromLocalStorage(filename, timestamp, tabType);
    
    // Update stats after removing image
    updateStatsDisplay(tabType);
}

function removeImageFromLocalStorage(filename, timestamp, tabType) {
    try {
        const storageKey = `poe2_${tabType}_images`;
        const existingImages = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Find the image to remove
        const imageToRemove = existingImages.find(img => 
            img.filename === filename && img.timestamp === timestamp
        );
        
        // Filter out the removed image
        const updatedImages = existingImages.filter(img => 
            !(img.filename === filename && img.timestamp === timestamp)
        );
        
        localStorage.setItem(storageKey, JSON.stringify(updatedImages));
        
        // Sync to localStorage if connected
        if (imageToRemove) {
            syncImageToLocalStorage(imageToRemove, tabType, 'remove');
        }
        
        console.log(`Removed image from localStorage: ${filename}`);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
}

function clearAllImages(tabType) {
    if (confirm(`ต้องการลบรูปภาพทั้งหมดใน ${tabType === 'items' ? 'ไอเท็มที่ขาย' : 'หลักฐานการแบ่ง'} หรือไม่?`)) {
        try {
            const storageKey = `poe2_${tabType}_images`;
            localStorage.removeItem(storageKey);
            
            // Clear gallery
            const gallery = document.getElementById(`${tabType}Gallery`);
            gallery.innerHTML = '';
            
            // Update stats
            updateStatsDisplay(tabType);
            
            // Sync to localStorage if connected
            syncImageToLocalStorage(null, tabType, 'clear');
            
            console.log(`Cleared all images for: ${tabType}`);
            alert('ลบรูปภาพทั้งหมดเรียบร้อยแล้ว');
        } catch (error) {
            console.error('Error clearing images:', error);
            alert('เกิดข้อผิดพลาดในการลบรูปภาพ');
        }
    }
}

function getImageStats(tabType) {
    try {
        const storageKey = `poe2_${tabType}_images`;
        const images = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
        
        return {
            count: images.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    } catch (error) {
        console.error('Error getting image stats:', error);
        return { count: 0, totalSize: 0, totalSizeMB: '0' };
    }
}

// GitHub Gist Integration for Data Sharing - REMOVED
// Using localStorage for local storage instead

let currentSessionData = {
    sessionInfo: {
        created: Date.now(),
        lastUpdated: Date.now(),
        createdBy: 'poe2-party-group',
        groupName: 'GIGOLO Party Group'
    },
    rounds: [
        {
            roundId: 1,
            roundName: 'Round 1',
            created: Date.now(),
            members: ['Player 1', 'Player 2'],
            items: [],
            evidence: [],
            playerConfirmations: {
                'Player 1': 'pending',
                'Player 2': 'pending'
            },
            isActive: true
        }
    ],
    currentRoundId: 1
};

// Round Management Functions
function getCurrentRound() {
    return currentSessionData.rounds.find(round => round.roundId === currentSessionData.currentRoundId) || currentSessionData.rounds[0];
}

function createNewRound(roundName, members) {
    const newRoundId = Math.max(...currentSessionData.rounds.map(r => r.roundId)) + 1;
    
    const newRound = {
        roundId: newRoundId,
        roundName: roundName || `Round ${newRoundId}`,
        created: Date.now(),
        members: members || ['Player 1', 'Player 2'],
        items: [],
        evidence: [],
        playerConfirmations: {},
        isActive: true
    };
    
    // Set confirmations for all members
    members.forEach(member => {
        newRound.playerConfirmations[member] = 'pending';
    });
    
    // Set previous round as inactive
    currentSessionData.rounds.forEach(round => {
        round.isActive = false;
    });
    
    // Add new round
    currentSessionData.rounds.push(newRound);
    currentSessionData.currentRoundId = newRoundId;
    
    // Update UI
    updateRoundUI();
    updatePlayerConfirmationUI();
    
    // Save to localStorage
    saveSessionToLocalStorage();
    
    showNotification(`สร้าง ${roundName} สำเร็จ!`, 'success');
    return newRound;
}

function switchToRound(roundId) {
    const round = currentSessionData.rounds.find(r => r.roundId === roundId);
    if (!round) {
        showNotification('ไม่พบรอบที่เลือก', 'error');
        return;
    }
    
    currentSessionData.currentRoundId = roundId;
    
    // Update UI with round data
    updateUIWithRoundData(round);
    updateRoundUI();
    
    showNotification(`เปลี่ยนเป็น ${round.roundName} แล้ว`, 'info');
}

function updateUIWithRoundData(round) {
    // Update items gallery
    const itemsGallery = document.getElementById('itemsGallery');
    itemsGallery.innerHTML = '';
    
    if (round.items && round.items.length > 0) {
        round.items.forEach(imageData => {
            addImageToGallery(imageData, itemsGallery, 'items');
        });
    }
    updateStatsDisplay('items');
    
    // Update evidence gallery
    const evidenceGallery = document.getElementById('evidenceGallery');
    evidenceGallery.innerHTML = '';
    
    if (round.evidence && round.evidence.length > 0) {
        round.evidence.forEach(imageData => {
            addImageToGallery(imageData, evidenceGallery, 'evidence');
        });
    }
    updateStatsDisplay('evidence');
    
    // Update player confirmations
    updatePlayerConfirmationUI();
}

function updateRoundUI() {
    const currentRound = getCurrentRound();
    const roundDisplay = document.getElementById('currentRoundDisplay') || createRoundDisplayElement();
    
    roundDisplay.innerHTML = `
        <div class="round-info">
            <h3>${currentRound.roundName}</h3>
            <div class="round-members">
                <strong>สมาชิก:</strong> ${currentRound.members.join(', ')}
            </div>
            <div class="round-actions">
                <button onclick="showCreateRoundDialog()" class="btn-primary">+ รอบใหม่</button>
                <button onclick="showRoundSelector()" class="btn-secondary">เลือกรอบ</button>
                <button onclick="showEditRoundDialog()" class="btn-secondary">แก้ไขรอบนี้</button>
            </div>
        </div>
    `;
}

// Dialog functions for round management
function showCreateRoundDialog() {
    const roundName = prompt('ใส่ชื่อรอบใหม่:', `Round ${currentSessionData.rounds.length + 1}`);
    if (!roundName) return;
    
    const membersInput = prompt('ใส่รายชื่อสมาชิก (คั่นด้วยจุลภาค):', 'Player 1, Player 2');
    if (!membersInput) return;
    
    const members = membersInput.split(',').map(name => name.trim()).filter(name => name.length > 0);
    if (members.length === 0) {
        showNotification('กรุณาใส่รายชื่อสมาชิก', 'warning');
        return;
    }
    
    createNewRound(roundName, members);
}

function showRoundSelector() {
    const rounds = currentSessionData.rounds;
    let options = 'เลือกรอบที่ต้องการ:\n\n';
    
    rounds.forEach((round, index) => {
        const status = round.isActive ? ' (กำลังใช้งาน)' : '';
        options += `${index + 1}. ${round.roundName} - ${round.members.join(', ')}${status}\n`;
    });
    
    const selection = prompt(options + '\nใส่หมายเลขรอบที่ต้องการ:');
    if (!selection) return;
    
    const roundIndex = parseInt(selection) - 1;
    if (roundIndex >= 0 && roundIndex < rounds.length) {
        switchToRound(rounds[roundIndex].roundId);
    } else {
        showNotification('หมายเลขรอบไม่ถูกต้อง', 'error');
    }
}

function showEditRoundDialog() {
    const currentRound = getCurrentRound();
    if (!currentRound) return;
    
    const newName = prompt('แก้ไขชื่อรอบ:', currentRound.roundName);
    if (!newName) return;
    
    const newMembersInput = prompt('แก้ไขรายชื่อสมาชิก (คั่นด้วยจุลภาค):', currentRound.members.join(', '));
    if (!newMembersInput) return;
    
    const newMembers = newMembersInput.split(',').map(name => name.trim()).filter(name => name.length > 0);
    if (newMembers.length === 0) {
        showNotification('กรุณาใส่รายชื่อสมาชิก', 'warning');
        return;
    }
    
    // Update round data
    currentRound.roundName = newName;
    currentRound.members = newMembers;
    
    // Update confirmations for new/removed members
    const oldConfirmations = {...currentRound.playerConfirmations};
    currentRound.playerConfirmations = {};
    
    newMembers.forEach(member => {
        // Keep old status if member was already in round, otherwise set to pending
        currentRound.playerConfirmations[member] = oldConfirmations[member] || 'pending';
    });
    
    // Update UI and save
    updateRoundUI();
    updatePlayerConfirmationUI();
    saveSessionToLocalStorage();
    
    showNotification(`แก้ไข ${newName} สำเร็จ!`, 'success');
}

function createRoundDisplayElement() {
    const roundDisplay = document.createElement('div');
    roundDisplay.id = 'currentRoundDisplay';
    roundDisplay.className = 'round-display';
    
    // Insert after session status
    const sessionStatus = document.querySelector('.session-status');
    sessionStatus.parentNode.insertBefore(roundDisplay, sessionStatus.nextSibling);
    
    return roundDisplay;
}

// localStorage functions for data persistence
function saveSessionToLocalStorage() {
    try {
        currentSessionData.sessionInfo.lastUpdated = Date.now();
        localStorage.setItem('poe2_session_data', JSON.stringify(currentSessionData));
        console.log('Session data saved to localStorage');
    } catch (error) {
        console.error('Error saving session to localStorage:', error);
    }
}

function loadSessionFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('poe2_session_data');
        if (savedData) {
            currentSessionData = JSON.parse(savedData);
            console.log('Session data loaded from localStorage');
            return true;
        }
    } catch (error) {
        console.error('Error loading session from localStorage:', error);
    }
    return false;
}

async function updateUIWithSessionData() {
    const currentRound = getCurrentRound();
    
    // Update items gallery
    if (currentRound && currentRound.items && currentRound.items.length > 0) {
        const itemsGallery = document.getElementById('itemsGallery');
        itemsGallery.innerHTML = '';
        
        currentRound.items.forEach(imageData => {
            addImageToGallery(imageData, itemsGallery, 'items');
        });
        updateStatsDisplay('items');
    }
    
    // Update evidence gallery
    if (currentRound && currentRound.evidence && currentRound.evidence.length > 0) {
        const evidenceGallery = document.getElementById('evidenceGallery');
        evidenceGallery.innerHTML = '';
        
        currentRound.evidence.forEach(imageData => {
            addImageToGallery(imageData, evidenceGallery, 'evidence');
        });
        updateStatsDisplay('evidence');
    }
    
    // Update player confirmations and round UI
    updatePlayerConfirmationUI();
    updateRoundUI();
}

function updatePlayerConfirmationUI() {
    const confirmationList = document.getElementById('playerConfirmationList');
    if (!confirmationList) return;
    
    confirmationList.innerHTML = '';
    
    const currentRound = getCurrentRound();
    if (!currentRound) return;
    
    // Get players from current round
    const players = currentRound.members || ['Player 1', 'Player 2'];
    
    players.forEach(playerName => {
        const status = currentRound.playerConfirmations[playerName] || 'pending';
        addPlayerConfirmationElement(playerName, status);
    });
}

function addPlayerConfirmationElement(playerName, status = 'pending') {
    const confirmationList = document.getElementById('playerConfirmationList');
    
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player-confirmation';
    playerDiv.setAttribute('data-player', playerName);
    
    playerDiv.innerHTML = `
        <div class="player-info">
            <span class="player-name">${playerName}</span>
        </div>
        <div class="confirmation-status">
            <button class="status-btn ${status}" onclick="togglePlayerConfirmation('${playerName}')">
                ${status === 'confirmed' ? '✅ รับแล้ว' : '⏳ รอรับ'}
            </button>
            <button class="remove-player-btn" onclick="removePlayerConfirmation('${playerName}')" title="ลบสมาชิก">
                ❌
            </button>
        </div>
    `;
    
    confirmationList.appendChild(playerDiv);
}

function togglePlayerConfirmation(playerName) {
    const currentRound = getCurrentRound();
    if (!currentRound) return;
    
    const currentStatus = currentRound.playerConfirmations[playerName] || 'pending';
    const newStatus = currentStatus === 'confirmed' ? 'pending' : 'confirmed';
    
    currentRound.playerConfirmations[playerName] = newStatus;
    
    // Update UI
    const playerElement = document.querySelector(`[data-player="${playerName}"]`);
    const statusBtn = playerElement.querySelector('.status-btn');
    
    statusBtn.className = `status-btn ${newStatus}`;
    statusBtn.textContent = newStatus === 'confirmed' ? '✅ รับแล้ว' : '⏳ รอรับ';
    
    // Save to localStorage
    saveSessionToLocalStorage();
    
    console.log(`${playerName} confirmation status: ${newStatus} (${currentRound.roundName})`);
}

function removePlayerConfirmation(playerName) {
    if (confirm(`ต้องการลบ ${playerName} ออกจากรายการหรือไม่?`)) {
        const currentRound = getCurrentRound();
        if (currentRound) {
            delete currentRound.playerConfirmations[playerName];
            currentRound.members = currentRound.members.filter(member => member !== playerName);
            updatePlayerConfirmationUI();
            saveSessionToLocalStorage();
        }
    }
}

function addNewPlayerConfirmation() {
    const playerName = prompt('ใส่ชื่อสมาชิกใหม่:');
    if (!playerName || playerName.trim() === '') return;
    
    const trimmedName = playerName.trim();
    const currentRound = getCurrentRound();
    
    // Check if player already exists in current round
    if (currentRound.members.includes(trimmedName)) {
        showNotification('สมาชิกนี้มีอยู่ในรอบนี้แล้ว', 'warning');
        return;
    }
    
    currentRound.members.push(trimmedName);
    currentRound.playerConfirmations[trimmedName] = 'pending';
    addPlayerConfirmationElement(trimmedName, 'pending');
    saveSessionToLocalStorage();
}

function resetAllConfirmations() {
    if (confirm('ต้องการรีเซ็ตสถานะการรับส่วนแบ่งของทุกคนหรือไม่?')) {
        const currentRound = getCurrentRound();
        if (currentRound) {
            Object.keys(currentRound.playerConfirmations).forEach(playerName => {
                currentRound.playerConfirmations[playerName] = 'pending';
            });
            
            updatePlayerConfirmationUI();
            saveSessionToLocalStorage();
            
            showNotification('รีเซ็ตสถานะทั้งหมดเรียบร้อยแล้ว', 'success');
        }
    }
}

async function autoLoadSession() {
    const statusElement = document.getElementById('sessionStatusText');
    const sessionStatusDiv = document.querySelector('.session-status');
    
    if (statusElement) {
        statusElement.textContent = '🔄 กำลังโหลดข้อมูลจาก localStorage...';
        sessionStatusDiv.className = 'session-status connecting';
    }
    
    try {
        const loaded = loadSessionFromLocalStorage();
        
        if (loaded) {
            // Update UI with loaded data
            await updateUIWithSessionData();
            
            if (statusElement) {
                statusElement.textContent = `✅ โหลดข้อมูล Multi-Round Session สำเร็จ`;
                sessionStatusDiv.className = 'session-status';
            }
            showNotification('โหลดข้อมูล Session สำเร็จ!', 'success');
        } else {
            if (statusElement) {
                statusElement.textContent = '🆕 เริ่มต้น Session ใหม่';
                sessionStatusDiv.className = 'session-status warning';
            }
            console.log('No saved session found, using default data');
        }
    } catch (error) {
        if (statusElement) {
            statusElement.textContent = '❌ เกิดข้อผิดพลาดในการโหลดข้อมูล';
            sessionStatusDiv.className = 'session-status error';
        }
        console.error('Failed to load session:', error);
    }
}

function initializePlayerConfirmations() {
    const addPlayerBtn = document.getElementById('addPlayerConfirmationBtn');
    const resetBtn = document.getElementById('resetConfirmationsBtn');
    
    if (addPlayerBtn) {
        addPlayerBtn.addEventListener('click', addNewPlayerConfirmation);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllConfirmations);
    }
    
    updatePlayerConfirmationUI();
}

function syncImageToLocalStorage(imageData, tabType, action = 'add') {
    const currentRound = getCurrentRound();
    if (!currentRound) return;
    
    if (action === 'add') {
        if (!currentRound[tabType]) {
            currentRound[tabType] = [];
        }
        currentRound[tabType].push(imageData);
    } else if (action === 'remove') {
        currentRound[tabType] = currentRound[tabType].filter(
            img => !(img.filename === imageData.filename && img.timestamp === imageData.timestamp)
        );
    } else if (action === 'clear') {
        currentRound[tabType] = [];
    }
    
    // Save to localStorage
    saveSessionToLocalStorage();
}

// API Functions with enhanced error handling
async function loadExchangeRatesFromAPI() {
    updateAPIStatus('loading', '🔄 กำลังโหลดราคาจาก POE2Scout...');
    
    try {
        console.log('Loading exchange rates from API...');
        
        // Use a CORS proxy as fallback or direct fetch
        const originalUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.currency}?page=1&perPage=25&league=${encodeURIComponent(API_CONFIG.defaultLeague)}&referenceCurrency=${API_CONFIG.referenceCurrency}`;
        
        // Try multiple CORS proxy services
        const corsProxies = [
            '', // Try direct first
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        
        let lastError;
        
        for (let i = 0; i < corsProxies.length; i++) {
            try {
                const proxyUrl = corsProxies[i];
                const url = proxyUrl ? `${proxyUrl}${encodeURIComponent(originalUrl)}` : originalUrl;
                
                console.log(`Trying ${proxyUrl ? 'proxy' : 'direct'} fetch:`, url);
                
                // Set timeout for fetch
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors',
                    headers: proxyUrl ? {
                        'Accept': 'application/json'
                    } : {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('API Response received:', data);
                
                // Try different possible data structures
                let items = data.data || data.items || data;
                if (!Array.isArray(items)) {
                    throw new Error('Invalid API response format - no array found');
                }
                
                console.log('Items array found:', items.length, 'items');
                console.log('First few items:', items.slice(0, 3));
                
                const rates = extractRatesFromPOE2Scout(items);
                console.log('Extracted rates:', rates);
                
                if (rates && (rates.divine || rates.exalted)) {
                    // Use force apply to override manual settings when user clicks refresh
                    forceApplyRatesFromAPI(rates);
                    updateAPIStatus('success', `✅ อัปเดตราคาจาก POE2Scout สำเร็จ ${proxyUrl ? '(ผ่าน Proxy)' : ''}`);
                    updateLastUpdated('POE2Scout API');

                    calculateExchangeRates();
                    calculateResults();
                    return; // Success, exit the function
                } else {
                    throw new Error('ไม่พบข้อมูล Divine หรือ Exalted ใน API');
                }
                
            } catch (error) {
                console.error(`${corsProxies[i] ? 'Proxy' : 'Direct'} attempt failed:`, error);
                lastError = error;
                
                // If this is not the last attempt, continue to the next proxy
                if (i < corsProxies.length - 1) {
                    continue;
                }
            }
        }
        
        // If all attempts failed, throw the last error
        throw lastError;
        
    } catch (error) {
        console.error('API Error Details:', error);
        
        // Use fallback rates
        applyFallbackRates();
        
        let errorMessage = '❌ API ไม่พร้อมใช้งาน - ใช้ราคาสำรอง';
        
        if (error.name === 'AbortError') {
            errorMessage = '⏱️ Timeout - ใช้ราคาสำรอง';
        } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            errorMessage = '🌐 CORS Blocked - ใช้ราคาสำรอง';
        } else if (error.message.includes('HTTP')) {
            errorMessage = `🔴 ${error.message} - ใช้ราคาสำรอง`;
        }
        
        updateAPIStatus('error', errorMessage);
        updateLastUpdated('Fallback rates');
    }
    
    calculateExchangeRates();
    calculateResults();
}

function calculateAndDisplayResults() {
    calculateExchangeRates();
    calculateResults();
}

function extractRatesFromPOE2Scout(items) {
    console.log('Extracting rates from', items.length, 'items');
    const rates = {};
    
    // Debug: Log all apiIds to see what we have
    const apiIds = items.map(item => item.apiId || item.id || item.name).filter(Boolean);
    console.log('Available apiIds:', apiIds);
    
    // Find Divine Orb
    const divineItem = items.find(item => item.apiId === 'divine');
    console.log('Divine item found:', divineItem);
    if (divineItem?.currentPrice) {
        rates.divine = divineItem.currentPrice;
        currencyApiData.divine = {
            price: divineItem.currentPrice,
            icon: divineItem.iconUrl || divineItem.itemMetadata?.icon
        };
    }
    
    // Find Exalted Orb (reference currency, should be 1.0)
    const exaltedItem = items.find(item => item.apiId === 'exalted');
    console.log('Exalted item found:', exaltedItem);
    if (exaltedItem?.currentPrice) {
        rates.exalted = exaltedItem.currentPrice;
        currencyApiData.exalted = {
            price: exaltedItem.currentPrice,
            icon: exaltedItem.iconUrl || exaltedItem.itemMetadata?.icon
        };
    }
    
    console.log('Final rates:', rates);
    return (rates.divine || rates.exalted) ? rates : null;
}

function applyRatesFromAPI(rates) {
    console.log('Applying rates from API:', rates);
    
    // Set flag to prevent manual marking during API update
    isApiUpdating = true;
    
    if (rates.divine && !isRateManuallyOverridden('divine')) {
        console.log('Setting divine rate to:', rates.divine);
        divineRateInput.value = rates.divine.toFixed(2);
        markRateAsAPI('divine');
        
        // Update currency selector with icon if available
        updateCurrencyIcon('divine', currencyApiData.divine.icon);
    } else if (rates.divine) {
        console.log('Divine rate manually overridden, skipping API update');
    }
    
    if (rates.exalted && !isRateManuallyOverridden('exalted')) {
        console.log('Setting exalted rate to:', rates.exalted);
        exaltedRateInput.value = rates.exalted.toFixed(2);
        markRateAsAPI('exalted');
        
        // Update currency selector with icon if available
        updateCurrencyIcon('exalted', currencyApiData.exalted.icon);
    } else if (rates.exalted) {
        console.log('Exalted rate manually overridden, skipping API update');
    }
    
    // Reset flag after a brief delay to allow events to process
    setTimeout(() => {
        isApiUpdating = false;
    }, 100);
    
    // Update timestamp
    const now = new Date();
    lastUpdated.textContent = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Update league info
    currentLeague.textContent = 'Rise of the Abyssal';
    
    // Force recalculation after updating rates
    calculateExchangeRates();
    calculateResults();
}

// Force update rates from API, ignoring manual override
function forceApplyRatesFromAPI(rates) {
    console.log('Force applying rates from API:', rates);
    
    // Set flag to prevent manual marking during API update
    isApiUpdating = true;
    
    if (rates.divine) {
        console.log('Force setting divine rate to:', rates.divine);
        divineRateInput.value = rates.divine.toFixed(2);
        markRateAsAPI('divine');
        
        // Update currency selector with icon if available
        updateCurrencyIcon('divine', currencyApiData.divine.icon);
    }
    
    if (rates.exalted) {
        console.log('Force setting exalted rate to:', rates.exalted);
        exaltedRateInput.value = rates.exalted.toFixed(2);
        markRateAsAPI('exalted');
        
        // Update currency selector with icon if available
        updateCurrencyIcon('exalted', currencyApiData.exalted.icon);
    }
    
    // Reset flag after a brief delay to allow events to process
    setTimeout(() => {
        isApiUpdating = false;
    }, 100);
    
    // Update timestamp
    const now = new Date();
    lastUpdated.textContent = now.toLocaleString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Update league info
    currentLeague.textContent = 'Rise of the Abyssal';
    
    // Force recalculation after updating rates
    calculateExchangeRates();
    calculateResults();
}

function updateCurrencyIcon(currencyType, iconUrl) {
    if (!iconUrl) return;
    
    console.log(`Updating ${currencyType} icon with URL:`, iconUrl);
    
    // Store icon in our data
    if (!currencyApiData[currencyType]) {
        currencyApiData[currencyType] = {};
    }
    currencyApiData[currencyType].icon = iconUrl;
    
    // Update exchange rate section with icon
    const rateLabel = document.querySelector(`#${currencyType}Rate`).parentElement.querySelector('.rate-label');
    if (rateLabel) {
        // Remove existing icon if any
        const existingIcon = rateLabel.querySelector('.currency-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Create new icon
        const img = document.createElement('img');
        img.src = iconUrl;
        img.className = 'currency-icon';
        img.style.width = '20px';
        img.style.height = '20px';
        img.style.marginRight = '5px';
        img.style.verticalAlign = 'middle';
        img.style.borderRadius = '3px';
        img.alt = `${currencyType} icon`;
        
        // Handle image load error
        img.onerror = function() {
            console.error(`Failed to load ${currencyType} icon:`, iconUrl);
            this.style.display = 'none';
        };
        
        // Insert icon before text
        rateLabel.insertBefore(img, rateLabel.firstChild);
        console.log(`Added ${currencyType} icon to rate label`);
    }
    
    // Update total currency label if it's divine
    if (currencyType === 'divine') {
        updateTotalCurrencyLabel();
    }
}

function applyFallbackRates() {
    // Set flag to prevent manual marking during API update
    isApiUpdating = true;
    
    if (!isRateManuallyOverridden('divine')) {
        divineRateInput.value = '205.84';
        markRateAsAPI('divine');
    }
    
    if (!isRateManuallyOverridden('exalted')) {
        exaltedRateInput.value = '1.00';
        markRateAsAPI('exalted');
    }
    
    // Reset flag after a brief delay
    setTimeout(() => {
        isApiUpdating = false;
    }, 100);
}

function updateAPIStatus(status, message) {
    apiStatus.className = `status-${status}`;
    apiStatus.textContent = message;
}

function updateLastUpdated(source = 'API') {
    const now = new Date();
    const timeString = now.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (lastUpdated) {
        lastUpdated.textContent = `อัปเดตล่าสุด: ${timeString} (${source})`;
    }
}

function markRateAsManual(currency) {
    const rateSource = document.querySelector(`#${currency}Rate`).parentElement.querySelector('.rate-source');
    if (rateSource) {
        rateSource.textContent = 'Manual';
        rateSource.style.background = '#ffc107';
        rateSource.style.color = '#212529';
    }
    localStorage.setItem(`${currency}RateManual`, 'true');
}

function markRateAsAPI(currency) {
    console.log(`Marking ${currency} as API source...`);
    const rateInput = document.querySelector(`#${currency}Rate`);
    console.log(`Rate input found:`, rateInput);
    
    if (rateInput) {
        const parentElement = rateInput.parentElement;
        console.log(`Parent element:`, parentElement);
        
        const rateSource = parentElement.querySelector('.rate-source');
        console.log(`Rate source element:`, rateSource);
        
        if (rateSource) {
            rateSource.textContent = 'API';
            rateSource.style.background = '#667eea';
            rateSource.style.color = 'white';
            console.log(`Successfully marked ${currency} as API`);
        } else {
            console.error(`Rate source element not found for ${currency}`);
        }
    } else {
        console.error(`Rate input not found for ${currency}`);
    }
    
    localStorage.removeItem(`${currency}RateManual`);
    console.log(`Removed manual override flag for ${currency}`);
}

function isRateManuallyOverridden(currency) {
    return localStorage.getItem(`${currency}RateManual`) === 'true';
}

// Currency functions
function updateTotalCurrencyLabel() {
    const totalCurrencyLabel = document.querySelector('label[for="totalCurrency"]');
    const divineIcon = currencyApiData['divine']?.icon;
    
    if (totalCurrencyLabel) {
        // Remove existing icon
        const existingIcon = totalCurrencyLabel.querySelector('.total-currency-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
        
        // Add new icon if available
        if (divineIcon) {
            const img = document.createElement('img');
            img.src = divineIcon;
            img.className = 'total-currency-icon';
            img.style.width = '20px';
            img.style.height = '20px';
            img.style.marginRight = '5px';
            img.style.verticalAlign = 'middle';
            img.style.borderRadius = '3px';
            img.alt = 'Divine Orb icon';
            
            img.onerror = function() {
                this.style.display = 'none';
            };
            
            // Insert icon before "Total"
            totalCurrencyLabel.insertBefore(img, totalCurrencyLabel.firstChild);
        }
    }
}

function calculateExchangeRates() {
    const totalDivine = parseFloat(totalCurrencyInput.value) || 0;
    const divineRate = parseFloat(divineRateInput.value) || 205.84;
    
    // Convert Divine to Exalted for calculations
    const totalInExalted = totalDivine * divineRate;
    
    // Update display
    totalValueInExalted.textContent = formatNumber(totalInExalted.toFixed(2));
    totalValueInDivine.textContent = totalDivine.toFixed(3);
    
    return totalInExalted;
}

function updatePlayerEventListeners() {
    // Remove button listeners
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const playerCard = this.closest('.player-card');
            removePlayer(playerCard);
        });
    });
    
    // Player name and contribution listeners
    document.querySelectorAll('.player-name, .contribution').forEach(input => {
        input.addEventListener('input', calculateResults);
    });
}

function getPlayersData() {
    const playerCards = document.querySelectorAll('.player-card');
    const players = [];
    
    playerCards.forEach(card => {
        const nameInput = card.querySelector('.player-name');
        const contributionInput = card.querySelector('.contribution');
        
        const name = nameInput.value.trim() || 'ไม่ระบุชื่อ';
        const contribution = parseFloat(contributionInput.value) || 0;
        
        players.push({
            name: name,
            contribution: contribution
        });
    });
    
    return players;
}

// Player management
function addPlayer() {
    // Get actual number of player cards before adding
    const currentPlayerCards = document.querySelectorAll('.player-card').length;
    
    if (currentPlayerCards >= MAX_PLAYERS) {
        console.log(`Cannot add player: ${currentPlayerCards} players already, maximum is ${MAX_PLAYERS}`);
        return;
    }
    
    const newPlayerNumber = currentPlayerCards + 1;
    const newPlayerCard = createPlayerCard(newPlayerNumber);
    playersContainer.appendChild(newPlayerCard);
    
    // Update playerCount to match actual cards
    playerCount = document.querySelectorAll('.player-card').length;
    
    updatePlayerCount();
    updateRemoveButtons();
    updatePlayerEventListeners();
    calculateResults();
    
    console.log(`Player added. Current count: ${playerCount}`);
}

function removePlayer(playerCard) {
    // Get actual number of player cards before removal
    const currentPlayerCards = document.querySelectorAll('.player-card').length;
    
    // Prevent removal if we're at minimum players
    if (currentPlayerCards <= MIN_PLAYERS) {
        console.log(`Cannot remove player: ${currentPlayerCards} players remaining, minimum is ${MIN_PLAYERS}`);
        return;
    }
    
    playerCard.remove();
    
    // Update playerCount to match actual cards
    playerCount = document.querySelectorAll('.player-card').length;
    
    // Renumber remaining players
    renumberPlayers();
    
    updatePlayerCount();
    updateRemoveButtons();
    calculateResults();
    
    console.log(`Player removed. Current count: ${playerCount}`);
}

function createPlayerCard(playerNumber) {
    const playerCard = document.createElement('div');
    playerCard.className = 'player-card';
    playerCard.setAttribute('data-player', playerNumber);
    
    playerCard.innerHTML = `
        <div class="player-header">
            <span class="player-number">Player ${playerNumber}</span>
            <button class="btn-remove">🗑️</button>
        </div>
        <input type="text" class="player-name" placeholder="ชื่อผู้เล่น">
        <div class="contribution-section">
            <label>💪 Contribution (%):</label>
            <input type="number" class="contribution" value="0" min="0" max="100">
        </div>
    `;
    
    return playerCard;
}

function renumberPlayers() {
    const playerCards = document.querySelectorAll('.player-card');
    playerCards.forEach((card, index) => {
        const playerNumber = index + 1;
        card.setAttribute('data-player', playerNumber);
        card.querySelector('.player-number').textContent = `Player ${playerNumber}`;
    });
}

function updatePlayerCount() {
    playerCountDisplay.textContent = playerCount;
    
    // Update add button state
    if (playerCount >= MAX_PLAYERS) {
        addPlayerBtn.disabled = true;
        addPlayerBtn.textContent = '🚫 สูงสุด 6 คน';
    } else {
        addPlayerBtn.disabled = false;
        addPlayerBtn.textContent = '+ เพิ่มคน';
    }
}

function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll('.btn-remove');
    const actualPlayerCount = document.querySelectorAll('.player-card').length;
    
    console.log(`Updating remove buttons: ${actualPlayerCount} players, MIN_PLAYERS = ${MIN_PLAYERS}`);
    
    removeButtons.forEach((btn, index) => {
        const shouldDisable = actualPlayerCount <= MIN_PLAYERS;
        btn.disabled = shouldDisable;
        console.log(`Remove button ${index + 1}: ${shouldDisable ? 'disabled' : 'enabled'}`);
    });
}

// Calculation functions
function calculateResults() {
    const totalDivine = parseFloat(totalCurrencyInput.value) || 0;
    const mapsCost = parseFloat(mapsCostInput.value) || 0;
    const isMapsCostDeducted = !mapsReimbursedCheckbox.checked; // ถ้าไม่ติ๊กเบิกแล้ว = ต้องหัก
    
    // Calculate actual distributable amount (หักค่า maps ถ้ายังไม่เบิก)
    const actualDistributableDivine = isMapsCostDeducted ? totalDivine - mapsCost : totalDivine;
    const totalInExalted = calculateExchangeRates();
    const actualDistributableExalted = isMapsCostDeducted ? totalInExalted - (mapsCost * (parseFloat(divineRateInput.value) || 205.84)) : totalInExalted;
    
    const players = getPlayersData();
    
    // Update display total with icon and maps info
    const divineIcon = currencyApiData['divine']?.icon;
    let displayTotalHTML = `${formatNumber(totalDivine)} Divine Orb`;
    if (divineIcon) {
        displayTotalHTML = `<img src="${divineIcon}" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="divine icon" onerror="this.style.display='none'">${displayTotalHTML}`;
    }
    
    // Add maps cost info to display
    if (mapsCost > 0) {
        const mapsStatus = isMapsCostDeducted ? '❌ ยังไม่เบิก' : '✅ เบิกแล้ว';
        displayTotalHTML += `<br><small style="color: #666;">🗺️ Maps: ${formatNumber(mapsCost)} Divine (${mapsStatus})</small>`;
        if (isMapsCostDeducted) {
            displayTotalHTML += `<br><small style="color: #28a745; font-weight: bold;">💰 แบ่งได้: ${formatNumber(actualDistributableDivine)} Divine</small>`;
        }
    }
    
    displayTotal.innerHTML = displayTotalHTML;
    
    // Calculate total contribution
    const totalContribution = players.reduce((sum, player) => sum + player.contribution, 0);
    totalContributionDisplay.textContent = `${totalContribution}%`;
    
    // Show/hide warning
    if (Math.abs(totalContribution - 100) > 0.01 && totalContribution > 0) {
        warningMessage.style.display = 'block';
        warningMessage.innerHTML = `⚠️ Total Contribution = ${totalContribution}% (ควรเป็น 100%)`;
    } else {
        warningMessage.style.display = 'none';
    }
    
    // Calculate individual amounts using distributable amount
    displayResults(players, actualDistributableDivine, totalContribution, actualDistributableExalted);
}

function displayResults(players, totalDivine, totalContribution, totalInExalted) {
    resultsContainer.innerHTML = '';
    
    if (totalDivine <= 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #666;">กรอก Total Divine Orbs เพื่อดูผลการคำนวณ</p>';
        return;
    }
    
    // Calculate exact amounts for each player (no rounding)
    let totalDistributedDivine = 0;
    let totalDistributedExalted = 0;
    let playerResults = [];
    
    players.forEach(player => {
        let amountInDivine = 0;
        let amountInExalted = 0;
        
        if (totalContribution > 0) {
            // Calculate exact amounts (no rounding here)
            amountInDivine = (totalDivine * player.contribution) / totalContribution;
            amountInExalted = (totalInExalted * player.contribution) / totalContribution;
        }
        
        totalDistributedDivine += amountInDivine;
        totalDistributedExalted += amountInExalted;
        
        playerResults.push({
            player: player,
            amountInDivine: amountInDivine,
            amountInExalted: amountInExalted
        });
    });
    
    // Calculate remainder (what's left in the "central pool")
    const remainderDivine = totalDivine - totalDistributedDivine;
    const remainderExalted = totalInExalted - totalDistributedExalted;
    
    // Display each player's results
    playerResults.forEach(result => {
        const resultCard = createResultCard(result.player, result.amountInDivine, result.amountInExalted);
        resultsContainer.appendChild(resultCard);
    });
    
    // Show remainder as "Central Pool" if there's any significant amount
    if (Math.abs(remainderDivine) >= 0.01 || Math.abs(remainderExalted) >= 0.01) {
        const centralPoolCard = createCentralPoolCard(remainderDivine, remainderExalted);
        resultsContainer.appendChild(centralPoolCard);
    }
}

function createResultCard(player, amountInDivine, amountInExalted) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    // Get currency icons
    const divineIcon = currencyApiData.divine?.icon;
    const exaltedIcon = currencyApiData.exalted?.icon;
    const divineRate = parseFloat(divineRateInput.value) || 205.84;
    
    // Smart conversion logic: Split into whole Divine + remaining as Exalted
    let displayHTML = '';
    
    if (amountInDivine >= 1) {
        // Split into whole Divine + remaining as Exalted
        const wholeDivine = Math.floor(amountInDivine);
        const remainingDivine = amountInDivine - wholeDivine;
        const remainingExalted = Math.round(remainingDivine * divineRate);
        
        // Build display for Divine part
        let divineHTML = '';
        if (divineIcon) {
            divineHTML += `<img src="${divineIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="divine icon" onerror="this.style.display='none'">`;
        }
        divineHTML += `${formatNumber(wholeDivine)} Divine`;
        
        if (remainingExalted > 0) {
            // Build display for Exalted part
            let exaltedHTML = '';
            if (exaltedIcon) {
                exaltedHTML += `<img src="${exaltedIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="exalted icon" onerror="this.style.display='none'">`;
            }
            exaltedHTML += `${formatNumber(remainingExalted)} Exalted`;
            
            displayHTML = `${divineHTML} + ${exaltedHTML}`;
        } else {
            displayHTML = divineHTML;
        }
        
    } else {
        // Less than 1 Divine, show only as Exalted
        let exaltedHTML = '';
        if (exaltedIcon) {
            exaltedHTML += `<img src="${exaltedIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="exalted icon" onerror="this.style.display='none'">`;
        }
        exaltedHTML += `${formatNumber(Math.round(amountInExalted))} Exalted`;
        displayHTML = exaltedHTML;
    }
    
    // Build conversion information (total equivalents)
    let conversionHTML = '';
    if (divineIcon) {
        conversionHTML += `<img src="${divineIcon}" style="width: 16px; height: 16px; margin-right: 3px; vertical-align: middle; border-radius: 2px;" alt="divine icon" onerror="this.style.display='none'">`;
    }
    conversionHTML += `Total: ${amountInDivine.toFixed(2)} Divine`;
    
    if (exaltedIcon) {
        conversionHTML += ` | <img src="${exaltedIcon}" style="width: 16px; height: 16px; margin-right: 3px; vertical-align: middle; border-radius: 2px;" alt="exalted icon" onerror="this.style.display='none'">`;
    }
    conversionHTML += `${formatNumber(Math.round(amountInExalted))} Exalted`;
    
    resultCard.innerHTML = `
        <div class="result-player">
            ${player.name} (${player.contribution}%)
        </div>
        <div class="result-amounts">
            <div class="primary-amount">
                ${displayHTML}
            </div>
            <div class="converted-amounts">
                ${conversionHTML}
            </div>
        </div>
    `;
    
    return resultCard;
}

function createCentralPoolCard(remainderDivine, remainderExalted) {
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card central-pool';
    
    // Get currency icons
    const divineIcon = currencyApiData.divine?.icon;
    const exaltedIcon = currencyApiData.exalted?.icon;
    
    // Build display for remainder
    let displayHTML = '';
    
    if (Math.abs(remainderDivine) >= 0.01) {
        // Show as Divine + Exalted if there's Divine remainder
        let divineHTML = '';
        if (divineIcon) {
            divineHTML += `<img src="${divineIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="divine icon" onerror="this.style.display='none'">`;
        }
        divineHTML += `${remainderDivine.toFixed(3)} Divine`;
        
        if (Math.abs(remainderExalted) >= 0.01) {
            let exaltedHTML = '';
            if (exaltedIcon) {
                exaltedHTML += `<img src="${exaltedIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="exalted icon" onerror="this.style.display='none'">`;
            }
            exaltedHTML += `${remainderExalted.toFixed(2)} Exalted`;
            
            displayHTML = `${divineHTML} + ${exaltedHTML}`;
        } else {
            displayHTML = divineHTML;
        }
    } else if (Math.abs(remainderExalted) >= 0.01) {
        // Show only as Exalted
        let exaltedHTML = '';
        if (exaltedIcon) {
            exaltedHTML += `<img src="${exaltedIcon}" class="currency-result-icon" style="width: 20px; height: 20px; margin-right: 5px; vertical-align: middle; border-radius: 3px;" alt="exalted icon" onerror="this.style.display='none'">`;
        }
        exaltedHTML += `${remainderExalted.toFixed(2)} Exalted`;
        displayHTML = exaltedHTML;
    }
    
    resultCard.innerHTML = `
        <div class="result-player central-pool-title">
            🏦 ส่วนกลาง (เศษที่เหลือ)
        </div>
        <div class="result-amounts">
            <div class="primary-amount">
                ${displayHTML}
            </div>
            <div class="converted-amounts">
                <small>💡 ส่วนที่เหลือจากการคำนวณแบบไม่ปัด</small>
            </div>
        </div>
    `;
    
    return resultCard;
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('th-TH').format(num);
}

function equalSplit() {
    const contributionInputs = document.querySelectorAll('.contribution');
    const exactPercentage = 100 / playerCount;
    
    contributionInputs.forEach((input, index) => {
        if (index === contributionInputs.length - 1) {
            // คนสุดท้ายได้ส่วนที่เหลือเพื่อให้รวม 100% พอดี
            const others = Array.from(contributionInputs).slice(0, -1);
            const othersTotal = others.reduce((sum, inp) => sum + parseFloat(inp.value || 0), 0);
            input.value = parseFloat((100 - othersTotal).toFixed(6));
        } else {
            // คนอื่นๆ ได้เท่ากัน
            input.value = parseFloat(exactPercentage.toFixed(6));
        }
    });
    
    calculateResults();
}

function clearAll() {
    if (confirm('ต้องการเคลียร์ข้อมูลทั้งหมดหรือไม่?')) {
        // Clear total currency
        totalCurrencyInput.value = '';
        
        // Clear all player names and contributions
        document.querySelectorAll('.player-name').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.contribution').forEach(input => {
            input.value = '0';
        });
        
        // Reset to default name for first player
        const firstPlayerName = document.querySelector('.player-name');
        if (firstPlayerName) {
            firstPlayerName.value = 'คุณ';
        }
        
        calculateResults();
    }
}

function copyResults() {
    const totalDivine = parseFloat(totalCurrencyInput.value) || 0;
    const players = getPlayersData();
    const totalContribution = players.reduce((sum, player) => sum + player.contribution, 0);
    const totalInExalted = calculateExchangeRates();
    
    if (totalDivine <= 0) {
        alert('ไม่มีข้อมูลให้คัดลอก');
        return;
    }
    
    let resultText = `💰 POE2 Currency Calculator\n`;
    resultText += `================================\n`;
    resultText += `Total: ${formatNumber(totalDivine)} Divine Orbs\n`;
    resultText += `Total Value: ${formatNumber(totalInExalted.toFixed(2))} Exalted Orbs\n`;
    resultText += `Total Contribution: ${totalContribution}%\n\n`;
    resultText += `การแบ่ง Currency:\n`;
    resultText += `----------------\n`;
    
    const divineRate = parseFloat(divineRateInput.value) || 205.84;
    
    players.forEach(player => {
        let amountInDivine = 0;
        let amountInExalted = 0;
        
        if (totalContribution > 0) {
            amountInDivine = (totalDivine * player.contribution) / totalContribution;
            amountInExalted = (totalInExalted * player.contribution) / totalContribution;
        }
        
        // Smart conversion logic for display (same as createResultCard)
        if (amountInDivine >= 1) {
            // Split into whole Divine + remaining as Exalted
            const wholeDivine = Math.floor(amountInDivine);
            const remainingDivine = amountInDivine - wholeDivine;
            const remainingExalted = Math.round(remainingDivine * divineRate);
            
            if (remainingExalted > 0) {
                resultText += `${player.name}: ${wholeDivine} Divine + ${formatNumber(remainingExalted)} Exalted (${player.contribution}%)\n`;
            } else {
                resultText += `${player.name}: ${wholeDivine} Divine (${player.contribution}%)\n`;
            }
            resultText += `  Total: ${amountInDivine.toFixed(2)} Divine | ${formatNumber(Math.round(amountInExalted))} Exalted\n\n`;
        } else {
            resultText += `${player.name}: ${formatNumber(Math.round(amountInExalted))} Exalted (${player.contribution}%)\n`;
            resultText += `  Total: ${amountInDivine.toFixed(2)} Divine | ${formatNumber(Math.round(amountInExalted))} Exalted\n\n`;
        }
    });
    
    resultText += `Exchange Rates (${lastUpdated.textContent}):\n`;
    resultText += `1 Divine = ${divineRate} Exalted\n`;
    resultText += `League: ${currentLeague.textContent}\n\n`;
    resultText += `🎮 Happy Farming in POE2!`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(resultText).then(() => {
        // Show success message
        const originalText = copyResultsBtn.textContent;
        copyResultsBtn.textContent = '✅ คัดลอกแล้ว!';
        copyResultsBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyResultsBtn.textContent = originalText;
            copyResultsBtn.style.background = '';
        }, 2000);
    }).catch(() => {
        alert('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง');
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        calculateResults();
    }
    
    // Ctrl/Cmd + E for equal split
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        equalSplit();
    }
    
    // Ctrl/Cmd + R to clear (prevent default refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        clearAll();
    }
});

// Auto-save to localStorage
function saveToLocalStorage() {
    const data = {
        totalCurrency: totalCurrencyInput.value,
        players: getPlayersData()
    };
    localStorage.setItem('currencyCalculatorData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('currencyCalculatorData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Restore total currency
            if (data.totalCurrency) {
                totalCurrencyInput.value = data.totalCurrency;
            }
            
            // Restore players data
            if (data.players && data.players.length > 0) {
                // Adjust player count
                while (playerCount < data.players.length && playerCount < MAX_PLAYERS) {
                    addPlayer();
                }
                
                // Fill in data
                const playerCards = document.querySelectorAll('.player-card');
                playerCards.forEach((card, index) => {
                    if (data.players[index]) {
                        card.querySelector('.player-name').value = data.players[index].name || '';
                        card.querySelector('.contribution').value = data.players[index].contribution || 0;
                    }
                });
            }
            
            calculateResults();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Auto-save on changes
setInterval(saveToLocalStorage, 5000); // Save every 5 seconds

// Load saved data on page load
window.addEventListener('load', loadFromLocalStorage);

// Save before page unload
window.addEventListener('beforeunload', saveToLocalStorage);