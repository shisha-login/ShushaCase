/**
 * ShushaCase - Главный файл приложения
 * 
 * Точка входа. Инициализирует всё приложение:
 * 1. Загружает данные скинов
 * 2. Загружает состояние из localStorage
 * 3. Настраивает интерфейс
 * 4. Запускает приложение
 */

// ===== ВЕРСИЯ ПРИЛОЖЕНИЯ =====
const APP_VERSION = '1.0.0';
const APP_NAME = 'ShushaCase';
const APP_DESCRIPTION = 'Симулятор открытия кейсов CS2';

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Главная функция инициализации
 */
async function initApp() {
    console.log('='.repeat(50));
    console.log(`🎮 ${APP_NAME} v${APP_VERSION}`);
    console.log(`📝 ${APP_DESCRIPTION}`);
    console.log('='.repeat(50));
    
    try {
        // 1. Загружаем данные скинов (из кеша или API)
        console.log('📦 Загрузка данных скинов...');
        loadCachedSkinsData();
        
        // 2. Загружаем состояние игры
        console.log('💾 Загрузка состояния...');
        const stateLoaded = loadState();
        
        if (!stateLoaded) {
            console.warn('⚠️ Не удалось загрузить состояние, используются значения по умолчанию');
        }
        
        // 3. Инициализируем интерфейс
        console.log('🎨 Настройка интерфейса...');
        setupEventListeners();
        updateBalanceDisplay();
        updateSteamButton();
        
        // 4. Рендерим начальную страницу
        renderCasesList();
        
        // 5. Показываем стартовую вкладку
        switchTab('cases');
        
        // 6. Загружаем данные скинов асинхронно
        console.log('🔄 Фоновая загрузка данных...');
        loadSkinsData().then(() => {
            console.log('✅ Данные скинов обновлены');
            // Обновляем интерфейс если нужно
            if (gameState.currentTab === 'profile') {
                renderProfilePage();
            }
        }).catch(error => {
            console.warn('⚠️ Не удалось обновить данные скинов:', error.message);
        });
        
        // 7. Показываем приветствие
        showWelcomeMessage();
        
        console.log('✅ Приложение запущено!');
        console.log(`   💰 Баланс: ${formatPrice(gameState.balance)} ₽`);
        console.log(`   🎒 Предметов: ${gameState.inventory.length}`);
        console.log(`   📦 Кейсов: ${CASES.length}`);
        console.log(`   🎨 Скинов в базе: ${SKINS_DATABASE.length}`);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showNotification('Произошла ошибка при запуске. Обновите страницу.', 'error');
    }
}

/**
 * Показывает приветственное сообщение
 */
function showWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 6) greeting = 'Доброй ночи';
    else if (hour < 12) greeting = 'Доброе утро';
    else if (hour < 18) greeting = 'Добрый день';
    else greeting = 'Добрый вечер';
    
    const name = gameState.isAuthenticated ? 'Игрок' : 'Гость';
    
    console.log(`👋 ${greeting}, ${name}!`);
    
    // Показываем уведомление при первом запуске
    if (!localStorage.getItem('shushacase_welcomed')) {
        setTimeout(() => {
            showNotification(
                `🎮 Добро пожаловать в ${APP_NAME}! Начните с открытия кейсов.`,
                'info'
            );
            localStorage.setItem('shushacase_welcomed', '1');
        }, 1000);
    }
}

// ===== ГОРЯЧИЕ КЛАВИШИ =====

/**
 * Настройка горячих клавиш
 */
function setupHotkeys() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+1: Кейсы
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            switchTab('cases');
            showNotification('📦 Переключено на Кейсы', 'info');
        }
        
        // Ctrl+2: Апгрейд
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            switchTab('upgrade');
            showNotification('⬆️ Переключено на Апгрейд', 'info');
        }
        
        // Ctrl+3: Профиль
        if (e.ctrlKey && e.key === '3') {
            e.preventDefault();
            switchTab('profile');
            showNotification('👤 Переключено на Профиль', 'info');
        }
        
        // Ctrl+S: Продать всё
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            handleSellAll();
        }
        
        // Escape: Закрыть модалки
        if (e.key === 'Escape') {
            closeAllModals();
            if (DOM.upgradeResultOverlay) {
                DOM.upgradeResultOverlay.classList.remove('upgrade-result-overlay--visible');
            }
        }
    });
}

// ===== ОБРАБОТКА ОШИБОК =====

/**
 * Глобальный обработчик ошибок
 */
window.addEventListener('error', (event) => {
    console.error('❌ Глобальная ошибка:', event.error);
    
    // Показываем уведомление только для критических ошибок
    if (event.error && event.error.message) {
        showNotification('Произошла ошибка. Попробуйте обновить страницу.', 'error');
    }
});

/**
 * Обработчик ошибок Promise
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Необработанная ошибка Promise:', event.reason);
});

// ===== СЛУЖЕБНЫЕ ФУНКЦИИ =====

/**
 * Сброс всего прогресса (для отладки)
 */
function resetAllProgress() {
    if (!confirm('ВНИМАНИЕ! Это удалит ВЕСЬ прогресс. Продолжить?')) return;
    if (!confirm('Точно? Это действие нельзя отменить!')) return;
    
    // Очищаем localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    
    localStorage.removeItem('skins_cache');
    localStorage.removeItem('shushacase_welcomed');
    localStorage.removeItem('shushacase_volume');
    
    // Сбрасываем состояние
    gameState.balance = 10000;
    gameState.inventory = [];
    gameState.stats = {
        casesOpened: 0,
        upgradesDone: 0,
        upgradesSuccess: 0,
        totalSpent: 0,
        totalEarned: 0,
        bestSkinPrice: 0,
        bestSkinName: '—'
    };
    gameState.history = [];
    gameState.isAuthenticated = false;
    resetUpgradeSlots();
    
    saveState();
    
    // Обновляем интерфейс
    updateBalanceDisplay();
    updateSteamButton();
    renderCasesList();
    switchTab('cases');
    
    showNotification('🔄 Прогресс полностью сброшен', 'warning');
    console.log('🔄 Прогресс сброшен');
    
    // Перезагружаем страницу
    setTimeout(() => location.reload(), 1500);
}

/**
 * Экспорт данных (для бэкапа)
 */
function exportData() {
    const data = {
        version: APP_VERSION,
        balance: gameState.balance,
        inventory: gameState.inventory,
        stats: gameState.stats,
        history: gameState.history.slice(0, 20),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `shushacase_backup_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('💾 Данные экспортированы', 'success');
}

/**
 * Импорт данных (восстановление)
 */
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.balance || !data.inventory) {
                throw new Error('Неверный формат данных');
            }
            
            if (!confirm('Восстановить данные из бэкапа? Текущий прогресс будет заменён.')) return;
            
            gameState.balance = data.balance;
            gameState.inventory = data.inventory;
            gameState.stats = data.stats;
            gameState.history = data.history || [];
            
            saveState();
            updateBalanceDisplay();
            renderProfilePage();
            
            showNotification('✅ Данные восстановлены', 'success');
        } catch (error) {
            showNotification('❌ Ошибка импорта: неверный файл', 'error');
        }
    };
    
    reader.readAsText(file);
}

// ===== ЗАПУСК =====

// Ждём загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен');
    
    // Настраиваем горячие клавиши
    setupHotkeys();
    
    // Запускаем приложение
    initApp();
    
    // Выводим информацию в консоль
    console.log('💡 Подсказки:');
    console.log('   Ctrl+1 — Кейсы');
    console.log('   Ctrl+2 — Апгрейд');
    console.log('   Ctrl+3 — Профиль');
    console.log('   Ctrl+S — Продать всё');
    console.log('   Esc — Закрыть окна');
    
    // Экспортируем полезные функции в глобальную область
    window.resetAllProgress = resetAllProgress;
    window.exportData = exportData;
    window.importData = importData;
    window.APP_VERSION = APP_VERSION;
    window.APP_NAME = APP_NAME;
});

// ===== ЭКСПОРТ =====
window.initApp = initApp;
window.resetAllProgress = resetAllProgress;
window.exportData = exportData;
window.importData = importData;