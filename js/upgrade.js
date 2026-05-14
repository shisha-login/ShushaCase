/**
 * ShushaCase - Система апгрейда
 * 
 * Механика "колеса фортуны":
 * - Игрок выбирает до 6 предметов слева (жертвует)
 * - Выбирает 1 желаемый предмет справа
 * - Шанс успеха = (сумма левых / цена правого) * 0.9 (макс 95%)
 * - Стрелка крутится 4+ секунд, останавливается на красном/зелёном
 */

// ===== ДЛИНА ОКРУЖНОСТИ =====
const CIRCUMFERENCE = 2 * Math.PI * 90; // Радиус круга = 90

// ===== РЕНДЕР СТРАНИЦЫ АПГРЕЙДА =====

/**
 * Отрисовывает страницу апгрейда
 */
function renderUpgradePage() {
    const container = DOM.contentUpgrade;
    if (!container) return;
    
    container.innerHTML = '';
    
    // Основной контейнер
    const upgradeWrap = createElement('div', { className: 'upgrade-wrap' });
    
    // Левая панель (слоты для жертвы)
    const leftPanel = createElement('div', { 
        className: 'upgrade-left',
        id: 'upgradeLeftPanel'
    });
    
    // Создаём 6 слотов
    for (let i = 0; i < 6; i++) {
        const slot = createUpgradeSlot(i);
        leftPanel.appendChild(slot);
    }
    
    // Центр (колесо фортуны)
    const centerPanel = createUpgradeCenter();
    
    // Правая панель (желаемый предмет)
    const rightPanel = createElement('div', {
        className: 'upg-right-slot',
        id: 'upgradeRightSlot',
        onClick: () => onRightSlotClick()
    }, createElement('span', {}, '+'));
    
    upgradeWrap.append(leftPanel, centerPanel, rightPanel);
    container.appendChild(upgradeWrap);
    
    // Кешируем DOM-элементы
    DOM.upgradeLeftSlots = $('#upgradeLeftPanel');
    DOM.upgradeRightSlot = $('#upgradeRightSlot');
    DOM.upgradeStartBtn = $('#upgradeStartBtn');
    DOM.chanceArrow = $('#chanceArrow');
    DOM.chanceText = $('#chanceText');
    DOM.chanceRed = $('#chanceRed');
    DOM.chanceGreen = $('#chanceGreen');
    
    // Обновляем состояние слотов
    updateUpgradeSlots();
}

/**
 * Создаёт слот апгрейда
 */
function createUpgradeSlot(index) {
    const slotData = gameState.upgradeSlots.left[index];
    
    const slot = createElement('div', {
        className: 'upg-slot' + (slotData ? ' upg-slot--filled' : ''),
        onClick: () => onLeftSlotClick(index)
    });
    
    if (slotData) {
        const skin = getSkinById(slotData.skinId);
        if (skin) {
            slot.innerHTML = '';
            
            const emoji = createElement('span', {}, skin.emoji || '🎨');
            
            const removeBtn = createElement('span', {
                className: 'upg-slot__remove',
                onClick: (e) => {
                    e.stopPropagation();
                    removeFromLeftSlot(index);
                }
            }, '✕');
            
            slot.append(emoji, removeBtn);
            slot.title = `${skin.name} — ${formatPrice(skin.price)} ₽`;
        }
    } else {
        slot.innerHTML = '<span>+</span>';
        slot.title = 'Выбрать предмет';
    }
    
    return slot;
}

/**
 * Создаёт центральную панель с колесом
 */
function createUpgradeCenter() {
    const centerPanel = createElement('div', { className: 'upgrade-center' });
    
    // Колесо фортуны
    const circleContainer = createElement('div', { className: 'chance-circle' });
    
    // SVG круг
    const svg = `
        <svg class="chance-circle-svg" viewBox="0 0 200 200">
            <circle class="chance-bg" cx="100" cy="100" r="90"/>
            <circle class="chance-red" id="chanceRed" cx="100" cy="100" r="90" 
                stroke-dasharray="0 ${CIRCUMFERENCE}" stroke-dashoffset="0"/>
            <circle class="chance-green" id="chanceGreen" cx="100" cy="100" r="90" 
                stroke-dasharray="0 ${CIRCUMFERENCE}" stroke-dashoffset="0"/>
        </svg>
    `;
    
    // Стрелка
    const arrow = createElement('div', { 
        className: 'chance-arrow',
        id: 'chanceArrow'
    },
        createElement('div', { className: 'chance-arrow__tip' })
    );
    
    // Текст процента
    const text = createElement('div', {
        className: 'chance-text',
        id: 'chanceText'
    }, '—%');
    
    circleContainer.innerHTML = svg;
    circleContainer.append(arrow, text);
    
    // Кнопка запуска
    const startButton = createElement('button', {
        className: 'upgrade-start-btn',
        id: 'upgradeStartBtn',
        disabled: true,
        onClick: () => startUpgrade()
    }, '⚡ Начать Апгрейд');
    
    centerPanel.append(circleContainer, startButton);
    
    return centerPanel;
}

// ===== УПРАВЛЕНИЕ СЛОТАМИ =====

/**
 * Обновляет все слоты и шанс
 */
function updateUpgradeSlots() {
    // Обновляем левые слоты
    if (DOM.upgradeLeftSlots) {
        DOM.upgradeLeftSlots.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const slot = createUpgradeSlot(i);
            DOM.upgradeLeftSlots.appendChild(slot);
        }
    }
    
    // Обновляем правый слот
    if (DOM.upgradeRightSlot) {
        DOM.upgradeRightSlot.innerHTML = '';
        
        if (gameState.upgradeSlots.right) {
            const skin = gameState.upgradeSlots.right;
            DOM.upgradeRightSlot.classList.add('upg-right-slot--filled');
            
            const emoji = createElement('span', {}, skin.emoji || '🎨');
            const name = createElement('span', { 
                className: 'upg-right-slot__name' 
            }, skin.name.substring(0, 16));
            const price = createElement('span', {
                style: 'font-size:0.5rem;color:#f0c060;'
            }, `${formatPrice(skin.price)} ₽`);
            
            const removeBtn = createElement('span', {
                className: 'upg-slot__remove',
                onClick: (e) => {
                    e.stopPropagation();
                    gameState.upgradeSlots.right = null;
                    updateUpgradeSlots();
                }
            }, '✕');
            
            DOM.upgradeRightSlot.append(emoji, name, price, removeBtn);
        } else {
            DOM.upgradeRightSlot.classList.remove('upg-right-slot--filled');
            DOM.upgradeRightSlot.innerHTML = '<span>+</span>';
        }
    }
    
    // Обновляем шанс
    updateChanceDisplay();
}

/**
 * Клик по левому слоту
 */
function onLeftSlotClick(index) {
    const slotData = gameState.upgradeSlots.left[index];
    
    // Если слот заполнен — очищаем
    if (slotData) {
        removeFromLeftSlot(index);
        return;
    }
    
    // Показываем модалку выбора предмета
    showInventoryPicker((item) => {
        // Добавляем в слот
        gameState.upgradeSlots.left[index] = {
            instanceId: item.instanceId,
            skinId: item.skinId
        };
        gameState.upgradeSlots.reservedIds.add(item.instanceId);
        
        updateUpgradeSlots();
        renderProfilePage(); // Обновляем инвентарь в профиле
    });
}

/**
 * Удаляет предмет из левого слота
 */
function removeFromLeftSlot(index) {
    const slotData = gameState.upgradeSlots.left[index];
    if (slotData) {
        gameState.upgradeSlots.reservedIds.delete(slotData.instanceId);
        gameState.upgradeSlots.left[index] = null;
        updateUpgradeSlots();
        renderProfilePage();
    }
}

/**
 * Клик по правому слоту
 */
function onRightSlotClick() {
    // Если слот заполнен — очищаем
    if (gameState.upgradeSlots.right) {
        gameState.upgradeSlots.right = null;
        updateUpgradeSlots();
        return;
    }
    
    // Показываем модалку со всеми скинами
    showAllSkinsPicker((skin) => {
        gameState.upgradeSlots.right = skin;
        updateUpgradeSlots();
    });
}

// ===== МОДАЛКИ ВЫБОРА =====

/**
 * Показывает модалку выбора из инвентаря
 */
function showInventoryPicker(callback) {
    const availableItems = getAvailableInventory();
    
    if (availableItems.length === 0) {
        showNotification('❌ Нет доступных предметов в инвентаре', 'error');
        return;
    }
    
    const grid = createElement('div', { className: 'modal__grid' });
    
    availableItems.forEach(item => {
        const skin = getSkinById(item.skinId);
        if (!skin) return;
        
        const itemEl = createElement('div', {
            className: 'modal__item',
            style: `border-left:3px solid ${skin.color}`,
            onClick: () => {
                callback(item);
                closeAllModals();
            }
        },
            createElement('span', { className: 'modal__item-emoji' }, skin.emoji || '🎨'),
            createElement('span', {}, skin.name.substring(0, 14)),
            createElement('span', { 
                style: 'color:#f0c060;font-size:0.6rem;' 
            }, `${formatPrice(skin.price)} ₽`)
        );
        
        grid.appendChild(itemEl);
    });
    
    showModal('🎒 Выберите предмет для жертвы', grid);
}

/**
 * Показывает модалку со всеми скинами из базы
 */
function showAllSkinsPicker(callback) {
    const grid = createElement('div', { className: 'modal__grid' });
    
    SKINS_DATABASE.forEach(skin => {
        const itemEl = createElement('div', {
            className: 'modal__item',
            style: `border-left:3px solid ${skin.color}`,
            onClick: () => {
                callback(skin);
                closeAllModals();
            }
        },
            createElement('span', { className: 'modal__item-emoji' }, skin.emoji || '🎨'),
            createElement('span', {}, skin.name.substring(0, 14)),
            createElement('span', { 
                style: 'color:#f0c060;font-size:0.6rem;' 
            }, `${formatPrice(skin.price)} ₽`),
            createElement('span', {
                style: `font-size:0.5rem;color:${skin.color};`
            }, skin.rarity)
        );
        
        grid.appendChild(itemEl);
    });
    
    showModal('🎯 Выберите желаемый предмет', grid);
}

// ===== РАСЧЁТ ШАНСА =====

/**
 * Обновляет отображение шанса на колесе
 */
function updateChanceDisplay() {
    const leftSum = gameState.upgradeSlots.left
        .filter(s => s !== null)
        .reduce((sum, slotData) => {
            const skin = getSkinById(slotData.skinId);
            return sum + (skin ? skin.price : 0);
        }, 0);
    
    const rightPrice = gameState.upgradeSlots.right ? gameState.upgradeSlots.right.price : 0;
    
    const arrow = DOM.chanceArrow;
    const text = DOM.chanceText;
    const red = DOM.chanceRed;
    const green = DOM.chanceGreen;
    const button = DOM.upgradeStartBtn;
    
    if (!arrow || !text || !red || !green || !button) return;
    
    // Если не выбраны предметы
    if (leftSum <= 0 || rightPrice <= 0) {
        text.textContent = '—%';
        arrow.style.transform = 'translate(-50%,-100%) rotate(0deg)';
        red.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
        green.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
        button.disabled = true;
        return;
    }
    
    // Рассчитываем шанс
    let chance = (leftSum / rightPrice) * 0.9;
    chance = Math.min(chance, 0.95); // Максимум 95%
    chance = Math.max(chance, 0.01);  // Минимум 1%
    
    const percent = Math.round(chance * 100);
    
    // Обновляем текст
    text.textContent = `${percent}%`;
    
    // Обновляем круги
    const redLength = chance * CIRCUMFERENCE;
    const greenLength = CIRCUMFERENCE - redLength;
    
    red.setAttribute('stroke-dasharray', `${redLength} ${CIRCUMFERENCE}`);
    green.setAttribute('stroke-dasharray', `${greenLength} ${CIRCUMFERENCE}`);
    green.setAttribute('stroke-dashoffset', `-${redLength}`);
    
    // Поворачиваем стрелку на границу красного
    const angle = chance * 360;
    arrow.style.transition = 'transform 0.3s ease';
    arrow.style.transform = `translate(-50%,-100%) rotate(${angle}deg)`;
    
    // Активируем кнопку
    const hasLeft = gameState.upgradeSlots.left.some(s => s !== null);
    button.disabled = !(hasLeft && gameState.upgradeSlots.right);
}

// ===== ЗАПУСК АПГРЕЙДА =====

/**
 * Запускает процесс апгрейда
 */
function startUpgrade() {
    const button = DOM.upgradeStartBtn;
    if (!button || button.disabled) return;
    
    // Собираем левые предметы
    const leftItems = gameState.upgradeSlots.left.filter(s => s !== null);
    const rightSkin = gameState.upgradeSlots.right;
    
    if (leftItems.length === 0 || !rightSkin) return;
    
    // Рассчитываем шанс
    const leftSum = leftItems.reduce((sum, slotData) => {
        const skin = getSkinById(slotData.skinId);
        return sum + (skin ? skin.price : 0);
    }, 0);
    
    let chance = (leftSum / rightSkin.price) * 0.9;
    chance = Math.min(chance, 0.95);
    chance = Math.max(chance, 0.01);
    
    // Определяем результат
    const roll = Math.random();
    const success = roll < chance;
    
    // Удаляем левые предметы из инвентаря
    const idsToRemove = new Set(leftItems.map(s => s.instanceId));
    gameState.inventory = gameState.inventory.filter(item => !idsToRemove.has(item.instanceId));
    
    // Очищаем слоты
    idsToRemove.forEach(id => gameState.upgradeSlots.reservedIds.delete(id));
    gameState.upgradeSlots.left = [null, null, null, null, null, null];
    gameState.upgradeSlots.right = null;
    
    // Обновляем статистику
    gameState.stats.upgradesDone++;
    gameState.stats.totalSpent += leftSum;
    
    // Сохраняем
    saveState();
    updateBalanceDisplay();
    updateUpgradeSlots();
    
    // Анимация вращения стрелки
    const arrow = DOM.chanceArrow;
    const spins = 4 + Math.random() * 4; // 4-8 полных оборотов
    const targetAngle = success ? 
        (chance * 360) : 
        (chance * 360 + (0.05 + Math.random() * 0.1) * 360);
    const totalAngle = spins * 360 + targetAngle;
    
    // Запускаем анимацию
    arrow.style.transition = 'transform 4s cubic-bezier(0.12, 0.85, 0.25, 1)';
    arrow.style.transform = `translate(-50%,-100%) rotate(${totalAngle}deg)`;
    
    // Подсвечиваем слоты
    document.querySelectorAll('.upg-slot, .upg-right-slot').forEach(slot => {
        slot.classList.add('upg-spinning');
    });
    
    // Ждём окончания анимации
    setTimeout(() => {
        // Убираем подсветку
        document.querySelectorAll('.upg-slot, .upg-right-slot').forEach(slot => {
            slot.classList.remove('upg-spinning');
        });
        
        // Финальная позиция стрелки
        arrow.style.transition = 'transform 0.5s ease';
        arrow.style.transform = `translate(-50%,-100%) rotate(${targetAngle}deg)`;
        
        if (success) {
            // Успех!
            addToInventory(rightSkin.id);
            if (rightSkin.price > gameState.stats.bestSkinPrice) {
                gameState.stats.bestSkinPrice = rightSkin.price;
                gameState.stats.bestSkinName = rightSkin.name;
            }
            gameState.stats.upgradesSuccess = (gameState.stats.upgradesSuccess || 0) + 1;
            
            saveState();
            updateBalanceDisplay();
            
            launchUpgradeConfetti();
            playSuccessSound();
            addHistory('⬆️ Апгрейд успешен', `${leftItems.length} предметов → ${rightSkin.name}`);
            
            showUpgradeResult(true, rightSkin, chance);
        } else {
            // Провал
            saveState();
            updateBalanceDisplay();
            
            // Красная вспышка
            document.body.style.transition = 'background 0.2s';
            document.body.style.background = 'rgba(200,30,30,0.2)';
            setTimeout(() => {
                document.body.style.background = '';
                document.body.style.transition = '';
            }, 300);
            
            playFailSound();
            addHistory('💔 Апгрейд провален', `${leftItems.length} предметов сгорели`);
            
            showUpgradeResult(false, rightSkin, chance);
        }
        
        // Обновляем интерфейс
        renderProfilePage();
    }, 4000);
}

/**
 * Показывает результат апгрейда
 */
function showUpgradeResult(success, skin, chance) {
    const overlay = DOM.upgradeResultOverlay;
    const box = DOM.upgradeResultBox;
    
    if (!overlay || !box) return;
    
    const percent = Math.round(chance * 100);
    
    overlay.classList.add('upgrade-result-overlay--visible');
    box.className = 'upgrade-result-box';
    
    if (success) {
        box.classList.add('upgrade-result-box--success');
        box.innerHTML = `
            <div style="font-size:3rem;">🎉</div>
            <h3 style="color:#4caf84;">Апгрейд успешен!</h3>
            <div style="font-size:2.5rem;">${skin.emoji || '🎨'}</div>
            <p style="color:#fff;font-weight:700;">${skin.name}</p>
            <p style="color:#f0c060;">${formatPrice(skin.price)} ₽</p>
            <p style="color:#888;">Шанс был: ${percent}%</p>
            <button class="btn btn--purple" id="btnCloseResult">✅ Отлично</button>
        `;
    } else {
        box.classList.add('upgrade-result-box--fail');
        box.innerHTML = `
            <div style="font-size:3rem;">💔</div>
            <h3 style="color:#e05555;">Апгрейд провален</h3>
            <p style="color:#faa;">Предметы сгорели</p>
            <p style="color:#888;">Шанс был: ${percent}%</p>
            <p style="color:#aaa;font-size:0.8rem;">Желаемый: ${skin.name}</p>
            <button class="btn btn--outline" id="btnCloseResult">😞 Понятно</button>
        `;
    }
    
    // Закрытие по кнопке
    setTimeout(() => {
        const closeBtn = $('#btnCloseResult');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('upgrade-result-overlay--visible');
            });
        }
    }, 100);
    
    // Автозакрытие через 5 секунд
    setTimeout(() => {
        if (overlay.classList.contains('upgrade-result-overlay--visible')) {
            overlay.classList.remove('upgrade-result-overlay--visible');
        }
    }, 5000);
}

// Закрытие оверлея по клику на фон
document.addEventListener('click', (e) => {
    if (e.target === DOM.upgradeResultOverlay) {
        DOM.upgradeResultOverlay.classList.remove('upgrade-result-overlay--visible');
    }
});

// ===== ЭКСПОРТ =====
window.renderUpgradePage = renderUpgradePage;
window.updateUpgradeSlots = updateUpgradeSlots;
window.updateChanceDisplay = updateChanceDisplay;
window.startUpgrade = startUpgrade;