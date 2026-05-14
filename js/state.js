/**
 * ShushaCase - Управление состоянием приложения
 * 
 * Хранит: баланс, инвентарь, статистику, слоты апгрейда
 * Сохраняет всё в localStorage
 */

// ===== ХРАНИЛИЩЕ ДАННЫХ =====
const STORAGE_KEYS = {
    balance: 'shushacase_balance',
    inventory: 'shushacase_inventory',
    isAuthenticated: 'shushacase_auth',
    stats: 'shushacase_stats',
    history: 'shushacase_history',
    upgradeState: 'shushacase_upgrade'
};

// ===== ГЛАВНОЕ СОСТОЯНИЕ =====
const gameState = {
    // Финансы
    balance: 10000,
    
    // Инвентарь: [{ instanceId, skinId, acquiredAt }]
    inventory: [],
    
    // Авторизация Steam (фейковая)
    isAuthenticated: false,
    steamName: 'Гость',
    steamAvatar: '🎮',
    
    // Статистика
    stats: {
        casesOpened: 0,
        upgradesDone: 0,
        upgradesSuccess: 0,
        totalSpent: 0,
        totalEarned: 0,
        bestSkinPrice: 0,
        bestSkinName: '—'
    },
    
    // История действий: [{ time, action, details }]
    history: [],
    
    // Слоты апгрейда (не сохраняются между сессиями)
    upgradeSlots: {
        left: [null, null, null, null, null, null], // 6 слотов
        right: null, // Желаемый предмет
        reservedIds: new Set() // ID предметов, зарезервированных в слотах
    },
    
    // UI состояние (не сохраняется)
    currentTab: 'cases',
    currentCaseIndex: null,
    isRouletteActive: false
};

// ===== СОХРАНЕНИЕ И ЗАГРУЗКА =====

/**
 * Сохраняет состояние в localStorage
 */
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEYS.balance, gameState.balance);
        localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(gameState.inventory));
        localStorage.setItem(STORAGE_KEYS.isAuthenticated, gameState.isAuthenticated ? '1' : '0');
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(gameState.stats));
        
        // Сохраняем только последние 50 записей истории
        const recentHistory = gameState.history.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(recentHistory));
        
        console.log('💾 Состояние сохранено');
    } catch (error) {
        console.warn('⚠️ Ошибка сохранения:', error.message);
    }
}

/**
 * Загружает состояние из localStorage
 */
function loadState() {
    try {
        // Баланс
        const savedBalance = localStorage.getItem(STORAGE_KEYS.balance);
        if (savedBalance !== null) {
            gameState.balance = parseInt(savedBalance) || 10000;
        }
        
        // Инвентарь
        const savedInventory = localStorage.getItem(STORAGE_KEYS.inventory);
        if (savedInventory) {
            gameState.inventory = JSON.parse(savedInventory);
            if (!Array.isArray(gameState.inventory)) {
                gameState.inventory = [];
            }
        }
        
        // Авторизация
        gameState.isAuthenticated = localStorage.getItem(STORAGE_KEYS.isAuthenticated) === '1';
        if (gameState.isAuthenticated) {
            gameState.steamName = 'Игрок ShushaCase';
            gameState.steamAvatar = '✅';
        }
        
        // Статистика
        const savedStats = localStorage.getItem(STORAGE_KEYS.stats);
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            gameState.stats = { ...gameState.stats, ...parsed };
        }
        
        // История
        const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
        if (savedHistory) {
            gameState.history = JSON.parse(savedHistory);
        }
        
        console.log('📂 Состояние загружено');
        console.log(`   💰 Баланс: ${gameState.balance} ₽`);
        console.log(`   🎒 Предметов: ${gameState.inventory.length}`);
        console.log(`   📦 Кейсов открыто: ${gameState.stats.casesOpened}`);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка загрузки состояния:', error.message);
        return false;
    }
}

// ===== МЕТОДЫ ДЛЯ РАБОТЫ С СОСТОЯНИЕМ =====

/**
 * Добавляет предмет в инвентарь
 */
function addToInventory(skinId) {
    const newItem = {
        instanceId: generateInstanceId(),
        skinId: skinId,
        acquiredAt: Date.now()
    };
    
    gameState.inventory.push(newItem);
    
    // Обновляем статистику лучшего скина
    const skin = getSkinById(skinId);
    if (skin && skin.price > gameState.stats.bestSkinPrice) {
        gameState.stats.bestSkinPrice = skin.price;
        gameState.stats.bestSkinName = skin.name;
    }
    
    saveState();
    return newItem;
}

/**
 * Удаляет предмет из инвентаря
 */
function removeFromInventory(instanceId) {
    const index = gameState.inventory.findIndex(item => item.instanceId === instanceId);
    if (index === -1) return false;
    
    // Нельзя удалить зарезервированный предмет
    if (gameState.upgradeSlots.reservedIds.has(instanceId)) {
        return false;
    }
    
    gameState.inventory.splice(index, 1);
    saveState();
    return true;
}

/**
 * Продаёт предмет
 */
function sellItem(instanceId) {
    const item = gameState.inventory.find(i => i.instanceId === instanceId);
    if (!item) return false;
    if (gameState.upgradeSlots.reservedIds.has(instanceId)) return false;
    
    const skin = getSkinById(item.skinId);
    if (!skin) return false;
    
    gameState.balance += skin.price;
    gameState.stats.totalEarned += skin.price;
    removeFromInventory(instanceId);
    
    addHistory('💰 Продажа', `${skin.name} (+${formatPrice(skin.price)} ₽)`);
    saveState();
    return true;
}

/**
 * Продаёт все предметы (кроме зарезервированных)
 */
function sellAllItems() {
    const availableItems = gameState.inventory.filter(
        item => !gameState.upgradeSlots.reservedIds.has(item.instanceId)
    );
    
    if (availableItems.length === 0) return 0;
    
    let totalEarned = 0;
    const idsToRemove = new Set(availableItems.map(i => i.instanceId));
    
    gameState.inventory = gameState.inventory.filter(item => {
        if (idsToRemove.has(item.instanceId)) {
            const skin = getSkinById(item.skinId);
            if (skin) totalEarned += skin.price;
            return false;
        }
        return true;
    });
    
    gameState.balance += totalEarned;
    gameState.stats.totalEarned += totalEarned;
    
    addHistory('💸 Продажа всего', `+${formatPrice(totalEarned)} ₽ (${availableItems.length} предметов)`);
    saveState();
    return totalEarned;
}

/**
 * Списывает средства
 */
function spendMoney(amount) {
    if (gameState.balance < amount) return false;
    
    gameState.balance -= amount;
    gameState.stats.totalSpent += amount;
    saveState();
    return true;
}

/**
 * Переключает авторизацию Steam
 */
function toggleSteamAuth() {
    gameState.isAuthenticated = !gameState.isAuthenticated;
    
    if (gameState.isAuthenticated) {
        gameState.steamName = 'Игрок ShushaCase';
        gameState.steamAvatar = '✅';
        
        // Бонус новичка
        if (gameState.balance < 500) {
            gameState.balance += 500;
        }
    } else {
        gameState.steamName = 'Гость';
        gameState.steamAvatar = '🎮';
    }
    
    addHistory('🔐 Авторизация', gameState.isAuthenticated ? 'Вход через Steam' : 'Выход');
    saveState();
}

/**
 * Добавляет запись в историю
 */
function addHistory(action, details) {
    gameState.history.unshift({
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: action,
        details: details
    });
    
    // Ограничиваем историю 100 записями
    if (gameState.history.length > 100) {
        gameState.history = gameState.history.slice(0, 100);
    }
}

/**
 * Сбрасывает слоты апгрейда
 */
function resetUpgradeSlots() {
    gameState.upgradeSlots.left = [null, null, null, null, null, null];
    gameState.upgradeSlots.right = null;
    gameState.upgradeSlots.reservedIds.clear();
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Генерирует уникальный ID для предмета
 */
function generateInstanceId() {
    return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Форматирует число с разделителями
 */
function formatPrice(price) {
    if (typeof price !== 'number') return '0';
    return price.toLocaleString('ru-RU');
}

/**
 * Получает доступные предметы инвентаря (не зарезервированные)
 */
function getAvailableInventory() {
    return gameState.inventory.filter(
        item => !gameState.upgradeSlots.reservedIds.has(item.instanceId)
    );
}

/**
 * Проверяет, достаточно ли средств
 */
function canAfford(amount) {
    return gameState.balance >= amount;
}

/**
 * Получает общую стоимость инвентаря
 */
function getInventoryTotal() {
    return gameState.inventory.reduce((total, item) => {
        const skin = getSkinById(item.skinId);
        return total + (skin ? skin.price : 0);
    }, 0);
}

/**
 * Получает статистику по редкостям в инвентаре
 */
function getInventoryRarities() {
    const rarities = {};
    gameState.inventory.forEach(item => {
        const skin = getSkinById(item.skinId);
        if (skin) {
            rarities[skin.rarity] = (rarities[skin.rarity] || 0) + 1;
        }
    });
    return rarities;
}

// ===== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ =====
// Эти функции будут доступны из других модулей
window.gameState = gameState;
window.saveState = saveState;
window.loadState = loadState;
window.addToInventory = addToInventory;
window.removeFromInventory = removeFromInventory;
window.sellItem = sellItem;
window.sellAllItems = sellAllItems;
window.spendMoney = spendMoney;
window.toggleSteamAuth = toggleSteamAuth;
window.addHistory = addHistory;
window.resetUpgradeSlots = resetUpgradeSlots;
window.getAvailableInventory = getAvailableInventory;
window.canAfford = canAfford;
window.getInventoryTotal = getInventoryTotal;
window.formatPrice = formatPrice;