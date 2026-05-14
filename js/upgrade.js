/**
 * ShushaCase - Система апгрейда v3.0
 * 
 * Полностью переписан:
 * - Красная зона всегда видна
 * - Плавная анимация без рывков
 * - Поддержка кастомной PNG-стрелки
 * - Колесо фортуны с правильным отображением шанса
 */

const CIRCUMFERENCE = 2 * Math.PI * 90; // Длина окружности (радиус 90)
const ARROW_IMAGE = 'arrow.png'; // Твой PNG файл со стрелкой

// ===== РЕНДЕР СТРАНИЦЫ =====

function renderUpgradePage() {
    const container = DOM.contentUpgrade;
    if (!container) return;
    
    container.innerHTML = '';
    
    const upgradeWrap = createElement('div', { className: 'upgrade-wrap' });
    
    // Левая панель (6 слотов)
    const leftPanel = createElement('div', { 
        className: 'upgrade-left', 
        id: 'upgradeLeftPanel' 
    });
    
    for (let i = 0; i < 6; i++) {
        const slot = createUpgradeSlot(i);
        leftPanel.appendChild(slot);
    }
    
    // Центральная панель (колесо + кнопка)
    const centerPanel = createUpgradeCenter();
    
    // Правый слот (желаемый предмет)
    const rightSlot = createElement('div', {
        className: 'upg-right-slot',
        id: 'upgradeRightSlot',
        onClick: () => onRightSlotClick()
    }, createElement('span', {}, '+'));
    
    upgradeWrap.append(leftPanel, centerPanel, rightSlot);
    container.appendChild(upgradeWrap);
    
    // Кешируем DOM элементы
    cacheUpgradeDOM();
    
    // Обновляем отображение
    updateUpgradeSlots();
}

// ===== СОЗДАНИЕ ЭЛЕМЕНТОВ =====

function createUpgradeSlot(index) {
    const slotData = gameState.upgradeSlots.left[index];
    
    const slot = createElement('div', {
        className: 'upg-slot' + (slotData ? ' upg-slot--filled' : ''),
        onClick: () => onLeftSlotClick(index)
    });
    
    if (slotData) {
        const skin = getSkinById(slotData.skinId);
        if (skin) {
            // Показываем картинку или эмодзи
            if (skin.imageUrl) {
                slot.innerHTML = `<img src="${skin.imageUrl}" style="width:35px;height:35px;border-radius:4px;" alt="${skin.name}">`;
            } else {
                slot.innerHTML = `<span style="font-size:1.5rem;">${skin.emoji || '🎨'}</span>`;
            }
            
            // Кнопка удаления
            const removeBtn = createElement('span', {
                className: 'upg-slot__remove',
                onClick: (e) => {
                    e.stopPropagation();
                    removeFromLeftSlot(index);
                }
            }, '✕');
            
            slot.appendChild(removeBtn);
            slot.title = `${skin.name}\n${formatPrice(skin.price)} ₽`;
        }
    } else {
        slot.innerHTML = '<span>+</span>';
        slot.title = 'Нажмите, чтобы выбрать предмет';
    }
    
    return slot;
}

function createUpgradeCenter() {
    const centerPanel = createElement('div', { className: 'upgrade-center' });
    
    // === КОЛЕСО ФОРТУНЫ ===
    const circleContainer = createElement('div', { 
        className: 'chance-circle',
        style: 'position:relative;'
    });
    
    // SVG с кругами
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'chance-circle-svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    
    // Фоновый круг
    const bgCircle = document.createElementNS(svgNS, 'circle');
    bgCircle.setAttribute('class', 'chance-bg');
    bgCircle.setAttribute('cx', '100');
    bgCircle.setAttribute('cy', '100');
    bgCircle.setAttribute('r', '90');
    svg.appendChild(bgCircle);
    
    // Красный сектор (зона провала)
    const redCircle = document.createElementNS(svgNS, 'circle');
    redCircle.setAttribute('class', 'chance-red');
    redCircle.setAttribute('id', 'chanceRed');
    redCircle.setAttribute('cx', '100');
    redCircle.setAttribute('cy', '100');
    redCircle.setAttribute('r', '90');
    redCircle.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
    redCircle.setAttribute('stroke-dashoffset', '0');
    svg.appendChild(redCircle);
    
    // Зелёный сектор (зона успеха)
    const greenCircle = document.createElementNS(svgNS, 'circle');
    greenCircle.setAttribute('class', 'chance-green');
    greenCircle.setAttribute('id', 'chanceGreen');
    greenCircle.setAttribute('cx', '100');
    greenCircle.setAttribute('cy', '100');
    greenCircle.setAttribute('r', '90');
    greenCircle.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
    greenCircle.setAttribute('stroke-dashoffset', '0');
    svg.appendChild(greenCircle);
    
    circleContainer.appendChild(svg);
    
    // Стрелка (PNG изображение)
    const arrowImg = createElement('img', {
        src: ARROW_IMAGE,
        className: 'chance-arrow-png',
        id: 'chanceArrow',
        alt: 'Стрелка',
        onerror: function() {
            // Fallback: если PNG не загрузился, показываем CSS-стрелку
            this.style.display = 'none';
            const fallbackArrow = document.getElementById('chanceArrowFallback');
            if (fallbackArrow) fallbackArrow.style.display = 'block';
        }
    });
    
    // Fallback стрелка (CSS)
    const fallbackArrow = createElement('div', {
        className: 'chance-arrow-fallback',
        id: 'chanceArrowFallback',
        style: 'display:none;'
    }, createElement('div', { className: 'chance-arrow__tip' }));
    
    // Текст с процентом
    const chanceText = createElement('div', {
        className: 'chance-text',
        id: 'chanceText'
    }, '—%');
    
    circleContainer.append(arrowImg, fallbackArrow, chanceText);
    
    // === КНОПКА ЗАПУСКА ===
    const startButton = createElement('button', {
        className: 'upgrade-start-btn',
        id: 'upgradeStartBtn',
        disabled: true,
        onClick: () => startUpgrade()
    }, '⚡ Начать Апгрейд');
    
    centerPanel.append(circleContainer, startButton);
    
    return centerPanel;
}

// ===== КЕШИРОВАНИЕ DOM =====

function cacheUpgradeDOM() {
    DOM.upgradeLeftSlots = document.getElementById('upgradeLeftPanel');
    DOM.upgradeRightSlot = document.getElementById('upgradeRightSlot');
    DOM.upgradeStartBtn = document.getElementById('upgradeStartBtn');
    DOM.chanceArrow = document.getElementById('chanceArrow');
    DOM.chanceArrowFallback = document.getElementById('chanceArrowFallback');
    DOM.chanceText = document.getElementById('chanceText');
    DOM.chanceRed = document.getElementById('chanceRed');
    DOM.chanceGreen = document.getElementById('chanceGreen');
}

// ===== УПРАВЛЕНИЕ СЛОТАМИ =====

function updateUpgradeSlots() {
    // Левые слоты
    if (DOM.upgradeLeftSlots) {
        DOM.upgradeLeftSlots.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            DOM.upgradeLeftSlots.appendChild(createUpgradeSlot(i));
        }
    }
    
    // Правый слот
    if (DOM.upgradeRightSlot) {
        DOM.upgradeRightSlot.innerHTML = '';
        
        if (gameState.upgradeSlots.right) {
            const skin = gameState.upgradeSlots.right;
            DOM.upgradeRightSlot.classList.add('upg-right-slot--filled');
            
            if (skin.imageUrl) {
                DOM.upgradeRightSlot.innerHTML = `
                    <img src="${skin.imageUrl}" style="width:50px;height:50px;border-radius:6px;" alt="${skin.name}">
                `;
            } else {
                DOM.upgradeRightSlot.innerHTML = `<span style="font-size:2rem;">${skin.emoji || '🎨'}</span>`;
            }
            
            DOM.upgradeRightSlot.innerHTML += `
                <span class="upg-right-slot__name">${skin.name.substring(0, 16)}</span>
                <span style="font-size:0.5rem;color:#f0c060;">${formatPrice(skin.price)} ₽</span>
                <span class="upg-slot__remove" onclick="event.stopPropagation(); gameState.upgradeSlots.right = null; updateUpgradeSlots();">✕</span>
            `;
        } else {
            DOM.upgradeRightSlot.classList.remove('upg-right-slot--filled');
            DOM.upgradeRightSlot.innerHTML = '<span>+</span>';
        }
    }
    
    // Обновляем шанс
    updateChanceDisplay();
}

function onLeftSlotClick(index) {
    const slotData = gameState.upgradeSlots.left[index];
    
    if (slotData) {
        removeFromLeftSlot(index);
        return;
    }
    
    // Показываем модалку выбора из инвентаря
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
                gameState.upgradeSlots.left[index] = {
                    instanceId: item.instanceId,
                    skinId: item.skinId
                };
                gameState.upgradeSlots.reservedIds.add(item.instanceId);
                closeAllModals();
                updateUpgradeSlots();
                if (gameState.currentTab === 'profile') renderProfilePage();
            }
        },
            createElement('span', { className: 'modal__item-emoji' }, 
                skin.imageUrl ? 
                `<img src="${skin.imageUrl}" style="width:30px;height:30px;">` : 
                skin.emoji || '🎨'
            ),
            createElement('span', {}, skin.name.substring(0, 14)),
            createElement('span', { style: 'color:#f0c060;font-size:0.6rem;' }, 
                `${formatPrice(skin.price)} ₽`
            )
        );
        
        grid.appendChild(itemEl);
    });
    
    showModal('🎒 Выберите предмет для жертвы', grid);
}

function removeFromLeftSlot(index) {
    const slotData = gameState.upgradeSlots.left[index];
    if (slotData) {
        gameState.upgradeSlots.reservedIds.delete(slotData.instanceId);
        gameState.upgradeSlots.left[index] = null;
        updateUpgradeSlots();
        if (gameState.currentTab === 'profile') renderProfilePage();
    }
}

function onRightSlotClick() {
    if (gameState.upgradeSlots.right) {
        gameState.upgradeSlots.right = null;
        updateUpgradeSlots();
        return;
    }
    
    // Показываем все скины из базы
    const grid = createElement('div', { className: 'modal__grid' });
    
    SKINS_DATABASE.forEach(skin => {
        const itemEl = createElement('div', {
            className: 'modal__item',
            style: `border-left:3px solid ${skin.color}`,
            onClick: () => {
                gameState.upgradeSlots.right = skin;
                closeAllModals();
                updateUpgradeSlots();
            }
        },
            createElement('span', { className: 'modal__item-emoji' },
                skin.imageUrl ?
                `<img src="${skin.imageUrl}" style="width:30px;height:30px;">` :
                skin.emoji || '🎨'
            ),
            createElement('span', {}, skin.name.substring(0, 14)),
            createElement('span', { style: 'color:#f0c060;font-size:0.6rem;' },
                `${formatPrice(skin.price)} ₽`
            ),
            createElement('span', { style: `font-size:0.5rem;color:${skin.color};` },
                skin.rarity
            )
        );
        
        grid.appendChild(itemEl);
    });
    
    showModal('🎯 Выберите желаемый предмет', grid);
}

// ===== ОБНОВЛЕНИЕ ШАНСА =====

function updateChanceDisplay() {
    const leftSum = gameState.upgradeSlots.left
        .filter(s => s !== null)
        .reduce((sum, slotData) => {
            const skin = getSkinById(slotData.skinId);
            return sum + (skin ? skin.price : 0);
        }, 0);
    
    const rightPrice = gameState.upgradeSlots.right ? gameState.upgradeSlots.right.price : 0;
    
    const redCircle = DOM.chanceRed;
    const greenCircle = DOM.chanceGreen;
    const textEl = DOM.chanceText;
    const button = DOM.upgradeStartBtn;
    
    if (!redCircle || !greenCircle || !textEl || !button) return;
    
    // Если не выбраны предметы
    if (leftSum <= 0 || rightPrice <= 0) {
        textEl.textContent = '—%';
        resetArrow();
        redCircle.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
        greenCircle.setAttribute('stroke-dasharray', `${CIRCUMFERENCE} ${CIRCUMFERENCE}`);
        greenCircle.setAttribute('stroke-dashoffset', '0');
        button.disabled = true;
        return;
    }
    
    // Рассчитываем шанс
    let chance = (leftSum / rightPrice) * 0.9;
    chance = Math.min(chance, 0.95);
    chance = Math.max(chance, 0.01);
    
    const percent = Math.round(chance * 100);
    textEl.textContent = `${percent}%`;
    
    // Красная зона (провал) - всегда видна
    const redLength = chance * CIRCUMFERENCE;
    const greenLength = CIRCUMFERENCE - redLength;
    
    redCircle.setAttribute('stroke-dasharray', `${redLength} ${CIRCUMFERENCE}`);
    greenCircle.setAttribute('stroke-dasharray', `${greenLength} ${CIRCUMFERENCE}`);
    greenCircle.setAttribute('stroke-dashoffset', `-${redLength}`);
    
    // Поворачиваем стрелку на границу красного
    const angle = chance * 360;
    updateArrowRotation(angle, 0.3);
    
    // Активируем кнопку
    const hasLeft = gameState.upgradeSlots.left.some(s => s !== null);
    button.disabled = !(hasLeft && gameState.upgradeSlots.right);
}

function resetArrow() {
    updateArrowRotation(0, 0.3);
}

function updateArrowRotation(angle, duration = 0.3) {
    // Обновляем PNG стрелку
    if (DOM.chanceArrow && DOM.chanceArrow.style.display !== 'none') {
        DOM.chanceArrow.style.transition = `transform ${duration}s ease`;
        DOM.chanceArrow.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    }
    
    // Обновляем fallback стрелку
    if (DOM.chanceArrowFallback && DOM.chanceArrowFallback.style.display !== 'none') {
        DOM.chanceArrowFallback.style.transition = `transform ${duration}s ease`;
        DOM.chanceArrowFallback.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    }
}

// ===== ЗАПУСК АПГРЕЙДА =====

function startUpgrade() {
    const button = DOM.upgradeStartBtn;
    if (!button || button.disabled) return;
    
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
    
    // Удаляем левые предметы
    const idsToRemove = new Set(leftItems.map(s => s.instanceId));
    gameState.inventory = gameState.inventory.filter(item => !idsToRemove.has(item.instanceId));
    idsToRemove.forEach(id => gameState.upgradeSlots.reservedIds.delete(id));
    
    // Очищаем слоты
    gameState.upgradeSlots.left = [null, null, null, null, null, null];
    gameState.upgradeSlots.right = null;
    
    // Статистика
    gameState.stats.upgradesDone++;
    gameState.stats.totalSpent += leftSum;
    
    saveState();
    updateBalanceDisplay();
    updateUpgradeSlots();
    
    // === АНИМАЦИЯ ===
    
    // Блокируем кнопку
    button.disabled = true;
    
    // Подсвечиваем слоты
    document.querySelectorAll('.upg-slot, .upg-right-slot').forEach(s => {
        s.classList.add('upg-spinning');
    });
    
    // Запускаем вращение стрелки
    const totalSpins = 5 + Math.random() * 3; // 5-8 полных оборотов
    const targetAngle = success ? 
        (chance * 360) : 
        (chance * 360 + (0.05 + Math.random() * 0.1) * 360);
    const totalRotation = totalSpins * 360 + targetAngle;
    
    updateArrowRotation(totalRotation, 4); // 4 секунды анимации
    
    // Ждём завершения
    setTimeout(() => {
        // Убираем подсветку
        document.querySelectorAll('.upg-slot, .upg-right-slot').forEach(s => {
            s.classList.remove('upg-spinning');
        });
        
        // Финальная позиция
        updateArrowRotation(targetAngle % 360, 0.5);
        
        if (success) {
            // Успех!
            addToInventory(rightSkin.id);
            if (rightSkin.price > gameState.stats.bestSkinPrice) {
                gameState.stats.bestSkinPrice = rightSkin.price;
                gameState.stats.bestSkinName = rightSkin.name;
            }
            gameState.stats.upgradesSuccess = (gameState.stats.upgradesSuccess || 0) + 1;
            
            launchUpgradeConfetti();
            playSuccessSound();
            addHistory('⬆️ Успешный апгрейд', `${leftItems.length} предметов → ${rightSkin.name}`);
            showUpgradeResult(true, rightSkin, chance);
        } else {
            // Провал
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
        
        saveState();
        updateBalanceDisplay();
        if (gameState.currentTab === 'profile') renderProfilePage();
        
    }, 4000);
}

// ===== ПОКАЗ РЕЗУЛЬТАТА =====

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
            <button class="btn btn--purple" id="btnCloseUpgResult">✅ Отлично</button>
        `;
    } else {
        box.classList.add('upgrade-result-box--fail');
        box.innerHTML = `
            <div style="font-size:3rem;">💔</div>
            <h3 style="color:#e05555;">Апгрейд провален</h3>
            <p style="color:#faa;">Предметы сгорели</p>
            <p style="color:#888;">Шанс был: ${percent}%</p>
            <p style="color:#aaa;font-size:0.8rem;">Цель: ${skin.name}</p>
            <button class="btn btn--outline" id="btnCloseUpgResult">😞 Понятно</button>
        `;
    }
    
    setTimeout(() => {
        const closeBtn = document.getElementById('btnCloseUpgResult');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                overlay.classList.remove('upgrade-result-overlay--visible');
            });
        }
    }, 100);
    
    setTimeout(() => {
        if (overlay.classList.contains('upgrade-result-overlay--visible')) {
            overlay.classList.remove('upgrade-result-overlay--visible');
        }
    }, 5000);
}

document.addEventListener('click', (e) => {
    if (e.target === DOM.upgradeResultOverlay) {
        DOM.upgradeResultOverlay?.classList.remove('upgrade-result-overlay--visible');
    }
});

// ===== ЭКСПОРТ =====
window.renderUpgradePage = renderUpgradePage;
window.updateUpgradeSlots = updateUpgradeSlots;
window.updateChanceDisplay = updateChanceDisplay;
window.startUpgrade = startUpgrade;
window.updateArrowRotation = updateArrowRotation;