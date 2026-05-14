/**
 * ShushaCase - Рендеринг интерфейса
 * 
 * Отвечает за отрисовку всех элементов на странице.
 * Реагирует на изменения состояния и обновляет DOM.
 */

// ===== DOM-ЭЛЕМЕНТЫ (КЕШИРОВАНИЕ) =====
const DOM = {
    // Хедер
    balanceValue: document.getElementById('balanceValue'),
    steamButton: document.getElementById('steamButton'),
    
    // Навигация
    navTabs: document.getElementById('navTabs'),
    
    // Контентные секции
    contentCases: document.getElementById('contentCases'),
    contentCaseDetail: document.getElementById('contentCaseDetail'),
    contentUpgrade: document.getElementById('contentUpgrade'),
    contentProfile: document.getElementById('contentProfile'),
    
    // Апгрейд
    upgradeLeftSlots: null,
    upgradeRightSlot: null,
    upgradeStartBtn: null,
    chanceArrow: null,
    chanceText: null,
    chanceRed: null,
    chanceGreen: null,
    
    // Модалки
    upgradeResultOverlay: document.getElementById('upgradeResultOverlay'),
    upgradeResultBox: document.getElementById('upgradeResultBox')
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ DOM =====

/**
 * Безопасное получение элемента
 */
function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Безопасное получение всех элементов
 */
function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Создаёт HTML-элемент с атрибутами и содержимым
 */
function createElement(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    
    // Устанавливаем атрибуты
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on')) {
            const event = key.substring(2).toLowerCase();
            element.addEventListener(event, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Добавляем детей
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====

/**
 * Обновляет отображение баланса
 */
function updateBalanceDisplay() {
    DOM.balanceValue.textContent = formatPrice(gameState.balance);
    
    // Анимация изменения баланса
    DOM.balanceValue.style.transform = 'scale(1.1)';
    setTimeout(() => {
        DOM.balanceValue.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Обновляет кнопку Steam
 */
function updateSteamButton() {
    if (gameState.isAuthenticated) {
        DOM.steamButton.textContent = '✅ Авторизован';
        DOM.steamButton.classList.add('header__steam-btn--active');
    } else {
        DOM.steamButton.textContent = '🔐 Войти через Steam';
        DOM.steamButton.classList.remove('header__steam-btn--active');
    }
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====

/**
 * Переключает активную вкладку
 */
function switchTab(tabName) {
    // Обновляем кнопки навигации
    $$('.nav-tab').forEach(button => {
        button.classList.remove('nav-tab--active');
        if (button.dataset.tab === tabName) {
            button.classList.add('nav-tab--active');
        }
    });
    
    // Скрываем все секции
    [
        DOM.contentCases,
        DOM.contentCaseDetail,
        DOM.contentUpgrade,
        DOM.contentProfile
    ].forEach(section => {
        if (section) section.classList.remove('content--active');
    });
    
    // Показываем нужную секцию
    const sectionMap = {
        'cases': DOM.contentCases,
        'caseDetail': DOM.contentCaseDetail,
        'upgrade': DOM.contentUpgrade,
        'profile': DOM.contentProfile
    };
    
    const targetSection = sectionMap[tabName];
    if (targetSection) {
        targetSection.classList.add('content--active');
    }
    
    // Обновляем содержимое при переключении
    if (tabName === 'profile') {
        renderProfilePage();
    } else if (tabName === 'upgrade') {
        renderUpgradePage();
    } else if (tabName === 'cases') {
        renderCasesList();
    }
    
    gameState.currentTab = tabName;
}

// ===== РЕНДЕР КЕЙСОВ (СПИСОК) =====

/**
 * Отрисовывает список кейсов
 */
function renderCasesList() {
    if (!DOM.contentCases) return;
    
    DOM.contentCases.innerHTML = '';
    
    const casesGrid = createElement('div', { className: 'cases-grid' });
    
    CASES.forEach((caseObj, index) => {
        const caseCard = createElement('div', {
            className: 'case-card',
            onClick: () => openCaseDetail(index)
        });
        
        // Изображение кейса
        const caseImage = createElement('span', {
            className: 'case-card__img'
        }, caseObj.emoji);
        
        // Название
        const caseName = createElement('span', {
            className: 'case-card__name'
        }, caseObj.name);
        
        // Цена
        const casePrice = createElement('span', {
            className: 'case-card__price'
        }, `${formatPrice(caseObj.price)} ₽`);
        
        // Кнопка
        const openButton = createElement('button', {
            className: 'case-card__btn',
            onClick: (e) => {
                e.stopPropagation();
                openCaseDetail(index);
            }
        }, '📋 Подробнее');
        
        caseCard.append(caseImage, caseName, casePrice, openButton);
        casesGrid.appendChild(caseCard);
    });
    
    DOM.contentCases.appendChild(casesGrid);
}

// ===== РЕНДЕР СТРАНИЦЫ ПРОФИЛЯ =====

/**
 * Отрисовывает страницу профиля с инвентарём
 */
function renderProfilePage() {
    if (!DOM.contentProfile) return;
    
    DOM.contentProfile.innerHTML = '';
    
    // Карточка профиля
    const profileCard = createProfileCard();
    
    // Статистика
    const statsRow = createStatsRow();
    
    // Инвентарь
    const inventorySection = createInventorySection();
    
    DOM.contentProfile.append(profileCard, statsRow, inventorySection);
}

/**
 * Создаёт карточку профиля
 */
function createProfileCard() {
    return createElement('div', { className: 'profile-card' },
        createElement('div', { className: 'profile-card__avatar' },
            gameState.isAuthenticated ? '✅' : '🎮'
        ),
        createElement('div', { className: 'profile-card__info' },
            createElement('h4', {}, gameState.isAuthenticated ? 'Игрок ShushaCase' : 'Гость ShushaCase'),
            createElement('p', {}, `Уровень ${calculateLevel()} • ${getLevelTitle()}`),
            createElement('p', { style: 'color:#888;font-size:0.75rem;' },
                `На проекте с: ${new Date().toLocaleDateString('ru-RU')}`
            )
        )
    );
}

/**
 * Создаёт строку статистики
 */
function createStatsRow() {
    const statsRow = createElement('div', { className: 'stats-row' });
    
    const statItems = [
        { value: gameState.stats.casesOpened, label: 'Кейсов открыто' },
        { value: gameState.stats.upgradesDone, label: 'Апгрейдов' },
        { value: `${formatPrice(gameState.stats.totalSpent)} ₽`, label: 'Потрачено' },
        { value: gameState.stats.bestSkinName.substring(0, 20), label: 'Лучший скин' }
    ];
    
    statItems.forEach(item => {
        const stat = createElement('div', { className: 'stat' },
            createElement('div', { className: 'stat__val' }, String(item.value)),
            createElement('div', { className: 'stat__lbl' }, item.label)
        );
        statsRow.appendChild(stat);
    });
    
    return statsRow;
}

/**
 * Создаёт секцию инвентаря
 */
function createInventorySection() {
    const section = createElement('div', { className: 'inv-section' });
    
    // Заголовок
    const header = createElement('div', { className: 'inv-section__head' },
        createElement('span', { className: 'inv-section__title' }, '🎒 Инвентарь'),
        createElement('span', { className: 'inv-section__summary' },
            `Предметов: ${getAvailableInventory().length} | Цена: ${formatPrice(getInventoryTotal())} ₽`
        ),
        createElement('button', {
            className: 'sell-all-btn',
            onClick: handleSellAll
        }, '💸 Продать всё')
    );
    
    // Сетка предметов
    const grid = createElement('div', { className: 'inv-grid' });
    
    const availableItems = getAvailableInventory();
    
    if (availableItems.length === 0) {
        const emptyState = createElement('div', {
            className: 'inventory-empty',
            style: 'display:block;text-align:center;padding:30px;color:#888;'
        },
            createElement('span', { style: 'font-size:3rem;display:block;' }, '📦'),
            createElement('p', {}, 'Инвентарь пуст. Откройте кейсы!')
        );
        section.append(header, emptyState);
        return section;
    }
    
    availableItems.forEach(item => {
        const skin = getSkinById(item.skinId);
        if (!skin) return;
        
        const itemCard = createElement('div', {
            className: 'inv-item',
            style: `border-left: 3px solid ${skin.color}`
        },
            createElement('span', { className: 'inv-item__emoji' }, skin.imageUrl ? 
                createElement('img', { 
                    src: skin.imageUrl, 
                    style: 'width:40px;height:40px;',
                    alt: skin.name 
                }) : 
                skin.emoji || '🎨'
            ),
            createElement('span', { className: 'inv-item__name' }, skin.name.substring(0, 16)),
            createElement('span', {
                className: 'inv-item__rarity',
                style: `background:${skin.color}33;color:${skin.color}`
            }, skin.rarity),
            createElement('span', { className: 'inv-item__price' }, `${formatPrice(skin.price)} ₽`),
            createElement('button', {
                className: 'inv-item__sell',
                onClick: (e) => {
                    e.stopPropagation();
                    handleSellItem(item.instanceId);
                }
            }, 'Продать')
        );
        
        grid.appendChild(itemCard);
    });
    
    section.append(header, grid);
    return section;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ПРОФИЛЯ =====

/**
 * Вычисляет уровень игрока
 */
function calculateLevel() {
    return Math.floor(gameState.stats.casesOpened / 3) + 
           Math.floor(gameState.stats.upgradesDone / 2) + 1;
}

/**
 * Возвращает звание в зависимости от уровня
 */
function getLevelTitle() {
    const level = calculateLevel();
    if (level >= 20) return 'Легенда';
    if (level >= 15) return 'Ветеран';
    if (level >= 10) return 'Опытный';
    if (level >= 5) return 'Бывалый';
    if (level >= 3) return 'Любитель';
    return 'Новичок';
}

// ===== ОБРАБОТЧИКИ ДЕЙСТВИЙ =====

/**
 * Продажа одного предмета
 */
function handleSellItem(instanceId) {
    if (sellItem(instanceId)) {
        playSellSound();
        updateBalanceDisplay();
        renderProfilePage();
        console.log('✅ Предмет продан');
    }
}

/**
 * Продажа всех предметов
 */
function handleSellAll() {
    const availableCount = getAvailableInventory().length;
    if (availableCount === 0) {
        alert('Нет доступных предметов для продажи.');
        return;
    }
    
    if (!confirm(`Продать все ${availableCount} предметов?`)) {
        return;
    }
    
    const totalEarned = sellAllItems();
    if (totalEarned > 0) {
        playSellSound();
        updateBalanceDisplay();
        renderProfilePage();
        console.log(`✅ Продано всё: +${formatPrice(totalEarned)} ₽`);
    }
}

// ===== МОДАЛЬНЫЕ ОКНА =====

/**
 * Показывает модальное окно
 */
function showModal(title, content, onClose) {
    const backdrop = createElement('div', {
        className: 'modal-bg',
        onClick: (e) => {
            if (e.target === backdrop) {
                backdrop.remove();
                if (onClose) onClose();
            }
        }
    });
    
    const modal = createElement('div', { className: 'modal' },
        createElement('div', { className: 'modal__title' }, title),
        content,
        createElement('button', {
            className: 'modal__close',
            onClick: () => {
                backdrop.remove();
                if (onClose) onClose();
            }
        }, '✕ Закрыть')
    );
    
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    return { backdrop, modal };
}

/**
 * Закрывает все модальные окна
 */
function closeAllModals() {
    $$('.modal-bg').forEach(modal => modal.remove());
}

/**
 * Показывает уведомление
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#4caf84',
        error: '#e05555',
        info: '#4b69ff',
        warning: '#f0c060'
    };
    
    const notification = createElement('div', {
        style: {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: colors[type] || colors.info,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            zIndex: '1000',
            animation: 'fadeIn 0.3s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }
    }, message);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Навешивает обработчики событий
 */
function setupEventListeners() {
    // Навигация
    DOM.navTabs.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.nav-tab');
        if (!tabButton) return;
        
        const tabName = tabButton.dataset.tab;
        if (tabName) {
            switchTab(tabName);
            playClickSound();
        }
    });
    
    // Кнопка Steam
    DOM.steamButton.addEventListener('click', () => {
        toggleSteamAuth();
        updateSteamButton();
        updateBalanceDisplay();
        renderProfilePage();
        playClickSound();
        
        const message = gameState.isAuthenticated ? 
            '✅ Вы вошли как Игрок ShushaCase' : 
            '👋 Вы вышли из аккаунта';
        showNotification(message, gameState.isAuthenticated ? 'success' : 'info');
    });
    
    // Закрытие модалок по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ===== ЭКСПОРТ =====
window.updateBalanceDisplay = updateBalanceDisplay;
window.updateSteamButton = updateSteamButton;
window.switchTab = switchTab;
window.renderCasesList = renderCasesList;
window.renderProfilePage = renderProfilePage;
window.showModal = showModal;
window.closeAllModals = closeAllModals;
window.showNotification = showNotification;
window.setupEventListeners = setupEventListeners;