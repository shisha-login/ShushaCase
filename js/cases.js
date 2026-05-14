/**
 * ShushaCase - Логика открытия кейсов
 * 
 * Управляет открытием кейсов, рулеткой, быстрым открытием.
 * Взаимодействует с data.js (скины), state.js (баланс/инвентарь), audio.js (звуки).
 */

// ===== ПЕРЕМЕННЫЕ ДЛЯ РУЛЕТКИ =====
let currentDetailCase = null;      // Текущий просматриваемый кейс
let rouletteActive = false;        // Флаг активности рулетки
let rouletteAnimationId = null;    // ID анимации
let quickOpenResults = [];         // Результаты быстрого открытия

// ===== ФУНКЦИИ ВЗВЕШЕННОГО ВЫБОРА =====

/**
 * Выбирает случайный скин из дроп-таблицы кейса
 * Использует весовую систему: чем выше weight, тем чаще выпадает
 * 
 * @param {Array} dropTable - Массив { skinId, weight }
 * @returns {string} ID выпавшего скина
 */
function weightedRandom(dropTable) {
    // Суммируем все веса
    const totalWeight = dropTable.reduce((sum, entry) => sum + entry.weight, 0);
    
    // Генерируем случайное число
    let random = Math.random() * totalWeight;
    
    // Находим выпавший скин
    for (const entry of dropTable) {
        random -= entry.weight;
        if (random <= 0) {
            return entry.skinId;
        }
    }
    
    // Запасной вариант (не должен достигаться)
    return dropTable[dropTable.length - 1].skinId;
}

/**
 * Быстрое открытие нескольких кейсов
 * 
 * @param {number} count - Количество открытий
 * @returns {Array} Массив выпавших скинов
 */
function openMultipleCases(caseObj, count) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
        const skinId = weightedRandom(caseObj.dropTable);
        const skin = getSkinById(skinId);
        
        if (skin) {
            // Добавляем в инвентарь
            addToInventory(skinId);
            
            // Обновляем статистику
            if (skin.price > gameState.stats.bestSkinPrice) {
                gameState.stats.bestSkinPrice = skin.price;
                gameState.stats.bestSkinName = skin.name;
            }
            
            results.push(skin);
        }
    }
    
    return results;
}

// ===== ОТКРЫТИЕ КЕЙСА (ДЕТАЛЬНАЯ СТРАНИЦА) =====

/**
 * Открывает детальную страницу кейса
 */
function openCaseDetail(caseIndex) {
    currentDetailCase = CASES[caseIndex];
    if (!currentDetailCase) return;
    
    renderCaseDetailPage();
    switchTab('caseDetail');
    
    // Сбрасываем кнопки навигации
    $$('.nav-tab').forEach(btn => btn.classList.remove('nav-tab--active'));
}

/**
 * Отрисовывает детальную страницу кейса
 */
function renderCaseDetailPage() {
    const container = DOM.contentCaseDetail;
    if (!container || !currentDetailCase) return;
    
    const c = currentDetailCase;
    const totalWeight = c.dropTable.reduce((sum, e) => sum + e.weight, 0);
    
    container.innerHTML = '';
    
    // Кнопка назад
    const backButton = createElement('button', {
        className: 'btn btn--outline btn--sm',
        onClick: () => {
            switchTab('cases');
            $$('.nav-tab').forEach(btn => {
                btn.classList.remove('nav-tab--active');
                if (btn.dataset.tab === 'cases') btn.classList.add('nav-tab--active');
            });
        }
    }, '← Назад к кейсам');
    
    // Хедер кейса
    const caseHeader = createElement('div', { className: 'case-detail__top' },
        createElement('span', { className: 'case-detail__img' }, c.emoji),
        createElement('div', { className: 'case-detail__info' },
            createElement('h3', {}, c.name),
            createElement('p', {}, `Цена: ${formatPrice(c.price)} ₽ | Скинов: ${c.dropTable.length}`)
        )
    );
    
    // Кнопки открытия
    const actions = createElement('div', { className: 'case-detail__actions' });
    
    // Кнопка "Открыть 1 раз"
    const openOneButton = createElement('button', {
        className: 'btn btn--gold',
        id: 'btnOpenOne',
        onClick: () => openSingleCase()
    }, `🔓 Открыть за ${formatPrice(c.price)} ₽`);
    
    // Быстрое открытие
    const quickOpenRow = createElement('div', { className: 'quick-open-row' },
        createElement('button', {
            className: 'btn btn--purple btn--sm',
            onClick: () => {
                const count = parseInt($('#inpQuickCount')?.value) || 5;
                openQuickMultiple(Math.min(count, 50));
            }
        }, '⚡ Открыть'),
        createElement('input', {
            type: 'number',
            id: 'inpQuickCount',
            value: '5',
            min: '1',
            max: '50',
            style: 'width:55px;'
        }),
        createElement('span', {}, 'раз')
    );
    
    actions.append(openOneButton, quickOpenRow);
    
    // Контейнер для рулетки
    const rouletteBox = createElement('div', {
        className: 'roulette-box',
        id: 'rouletteBox',
        style: 'display:none;'
    },
        createElement('div', { className: 'roulette-box__indicator' }),
        createElement('div', { className: 'roulette-box__strip', id: 'rouletteStrip' })
    );
    
    // Контейнер для результата
    const resultContainer = createElement('div', {
        id: 'rouletteResult',
        style: 'display:none;'
    });
    
    // Дроп-лист
    const dropTitle = createElement('div', {
        style: 'font-weight:700;color:#fff;margin-top:10px;'
    }, '📋 Возможный дроп');
    
    const dropGrid = createElement('div', { className: 'drop-grid' });
    
    c.dropTable.forEach(entry => {
        const skin = getSkinById(entry.skinId);
        if (!skin) return;
        
        const chance = ((entry.weight / totalWeight) * 100).toFixed(1);
        
        const dropItem = createElement('div', {
            className: 'drop-item',
            style: `border-left:3px solid ${skin.color};`
        },
            createElement('span', { className: 'drop-item__emoji' }, 
                skin.imageUrl ? 
                createElement('img', { src: skin.imageUrl, style: 'width:30px;height:30px;' }) : 
                skin.emoji || '🎨'
            ),
            createElement('span', { className: 'drop-item__name' }, skin.name.substring(0, 14)),
            createElement('span', {
                className: 'drop-item__rarity',
                style: `background:${skin.color}33;color:${skin.color};`
            }, skin.rarity),
            createElement('span', { className: 'drop-item__chance' }, `${chance}%`)
        );
        
        dropGrid.appendChild(dropItem);
    });
    
    container.append(backButton, caseHeader, actions, rouletteBox, resultContainer, dropTitle, dropGrid);
}

/**
 * Открытие одного кейса с анимацией рулетки
 */
function openSingleCase() {
    if (rouletteActive) return;
    
    const c = currentDetailCase;
    if (!c) return;
    
    // Проверка баланса
    if (!canAfford(c.price)) {
        showNotification('❌ Недостаточно средств!', 'error');
        return;
    }
    
    // Списываем средства
    spendMoney(c.price);
    gameState.stats.casesOpened++;
    updateBalanceDisplay();
    
    // Определяем победителя
    const winSkinId = weightedRandom(c.dropTable);
    const winSkin = getSkinById(winSkinId);
    
    if (!winSkin) return;
    
    // Строим рулетку
    buildRouletteStrip(c, winSkinId);
    
    // Показываем рулетку
    const rouletteBox = $('#rouletteBox');
    const resultContainer = $('#rouletteResult');
    const openButton = $('#btnOpenOne');
    
    rouletteBox.style.display = 'block';
    resultContainer.style.display = 'none';
    openButton.disabled = true;
    openButton.textContent = '⏳ Крутим...';
    
    // Запускаем анимацию
    rouletteActive = true;
    playCaseOpenSound();
    
    spinRoulette(winSkin, () => {
        // Добавляем в инвентарь
        addToInventory(winSkinId);
        
        // Обновляем лучший скин
        if (winSkin.price > gameState.stats.bestSkinPrice) {
            gameState.stats.bestSkinPrice = winSkin.price;
            gameState.stats.bestSkinName = winSkin.name;
        }
        
        // Показываем результат
        showRouletteResult(winSkin);
        
        // Звуки и эффекты
        playItemDropSound();
        launchMiniConfetti();
        addHistory('📦 Открытие кейса', `${c.name} → ${winSkin.name}`);
        
        // Разблокируем кнопку
        openButton.disabled = false;
        openButton.textContent = `🔓 Открыть за ${formatPrice(c.price)} ₽`;
    });
}

/**
 * Быстрое открытие нескольких кейсов
 */
function openQuickMultiple(count) {
    const c = currentDetailCase;
    if (!c) return;
    
    const totalCost = c.price * count;
    
    // Проверка баланса
    if (!canAfford(totalCost)) {
        showNotification(`❌ Недостаточно средств! Нужно ${formatPrice(totalCost)} ₽`, 'error');
        return;
    }
    
    // Подтверждение
    if (!confirm(`Открыть ${count} кейсов за ${formatPrice(totalCost)} ₽?`)) {
        return;
    }
    
    // Списываем средства
    spendMoney(totalCost);
    gameState.stats.casesOpened += count;
    updateBalanceDisplay();
    
    // Открываем все кейсы
    quickOpenResults = openMultipleCases(c, count);
    
    if (quickOpenResults.length === 0) {
        showNotification('❌ Ошибка открытия кейсов', 'error');
        return;
    }
    
    // Показываем анимацию для последнего предмета
    const lastSkin = quickOpenResults[quickOpenResults.length - 1];
    buildRouletteStrip(c, lastSkin.id);
    
    const rouletteBox = $('#rouletteBox');
    const resultContainer = $('#rouletteResult');
    const openButton = $('#btnOpenOne');
    
    rouletteBox.style.display = 'block';
    resultContainer.style.display = 'none';
    openButton.disabled = true;
    openButton.textContent = '⏳ Открываем...';
    
    rouletteActive = true;
    playCaseOpenSound();
    
    spinRoulette(lastSkin, () => {
        showQuickOpenResults();
        playItemDropSound();
        launchMiniConfetti();
        addHistory('📦 Быстрое открытие', `${count}× ${c.name} → ${quickOpenResults.length} предметов`);
        
        openButton.disabled = false;
        openButton.textContent = `🔓 Открыть за ${formatPrice(c.price)} ₽`;
    });
}

// ===== РУЛЕТКА =====

/**
 * Строит полосу рулетки
 */
function buildRouletteStrip(caseObj, winSkinId) {
    const strip = $('#rouletteStrip');
    if (!strip) return;
    
    strip.innerHTML = '';
    
    const allSkinIds = caseObj.dropTable.map(e => e.skinId);
    const totalCards = 35;
    const winPosition = Math.floor(totalCards * 0.58); // Победитель на 58% длины
    
    for (let i = 0; i < totalCards; i++) {
        const skinId = (i === winPosition) ? winSkinId : 
            allSkinIds[Math.floor(Math.random() * allSkinIds.length)];
        const skin = getSkinById(skinId);
        
        const card = createElement('div', {
            className: 'roulette-box__card',
            style: `border-bottom: 3px solid ${skin ? skin.color : '#888'}`
        },
            createElement('span', {}, skin ? skin.emoji || '🎨' : '❓'),
            createElement('span', { className: 'roulette-box__card-name' },
                skin ? skin.name.substring(0, 12) : '—'
            )
        );
        
        strip.appendChild(card);
    }
    
    // Сохраняем позицию победителя
    strip.dataset.winIndex = winPosition;
    strip.style.transform = 'translateX(0)';
}

/**
 * Запускает анимацию вращения рулетки
 */
function spinRoulette(winSkin, callback) {
    const strip = $('#rouletteStrip');
    const winIndex = parseInt(strip.dataset.winIndex);
    const cardWidth = 80; // Ширина карточки + отступ
    const winCenter = winIndex * cardWidth + cardWidth / 2;
    const windowWidth = $('#rouletteBox').clientWidth;
    const finalPosition = -(winCenter - windowWidth / 2);
    
    const duration = 3200; // 3.2 секунды
    const startTime = performance.now();
    
    let lastTickTime = 0;
    let tickInterval = 30; // Начальный интервал тиков
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out эффект (быстрое начало, плавное завершение)
        const eased = 1 - Math.pow(1 - progress, 3.5);
        const currentPosition = finalPosition * eased;
        
        strip.style.transform = `translateX(${currentPosition}px)`;
        
        // Звук тиков
        const speedFactor = 1 - eased;
        tickInterval = 25 + speedFactor * 280;
        
        if (currentTime - lastTickTime > tickInterval && progress < 0.98) {
            const frequency = 450 + speedFactor * 550;
            playTickSound(frequency, 0.025, 0.035);
            lastTickTime = currentTime;
        }
        
        if (progress < 1) {
            rouletteAnimationId = requestAnimationFrame(animate);
        } else {
            // Анимация завершена
            rouletteActive = false;
            rouletteAnimationId = null;
            
            if (callback) {
                callback();
            }
        }
    }
    
    rouletteAnimationId = requestAnimationFrame(animate);
}

/**
 * Показывает результат одного открытия
 */
function showRouletteResult(winSkin) {
    const container = $('#rouletteResult');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    const resultBox = createElement('div', { className: 'roulette-result' },
        createElement('span', { style: 'font-size:2.5rem;' }, winSkin.emoji || '🎁'),
        createElement('div', { 
            style: `font-weight:700;color:${winSkin.color};` 
        }, winSkin.name),
        createElement('div', { style: 'color:#f0c060;' }, `${formatPrice(winSkin.price)} ₽`),
        createElement('div', { style: `color:${winSkin.color};` }, winSkin.rarity),
        createElement('div', { className: 'roulette-result__actions' },
            createElement('button', {
                className: 'btn btn--purple btn--sm',
                onClick: () => {
                    // Продать последний добавленный предмет
                    const lastItem = gameState.inventory[gameState.inventory.length - 1];
                    if (lastItem && lastItem.skinId === winSkin.id) {
                        sellItem(lastItem.instanceId);
                        updateBalanceDisplay();
                        showNotification(`💰 Продан: ${winSkin.name}`, 'success');
                        
                        // Скрываем рулетку
                        $('#rouletteBox').style.display = 'none';
                        container.style.display = 'none';
                    }
                }
            }, `💰 Продать (${formatPrice(winSkin.price)} ₽)`),
            createElement('button', {
                className: 'btn btn--outline btn--sm',
                onClick: () => {
                    $('#rouletteBox').style.display = 'none';
                    container.style.display = 'none';
                }
            }, 'Ок')
        )
    );
    
    container.appendChild(resultBox);
}

/**
 * Показывает результат быстрого открытия
 */
function showQuickOpenResults() {
    const container = $('#rouletteResult');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = '';
    
    const lastSkin = quickOpenResults[quickOpenResults.length - 1];
    const totalValue = quickOpenResults.reduce((sum, skin) => sum + skin.price, 0);
    
    // Группируем по редкости
    const rarityCounts = {};
    quickOpenResults.forEach(skin => {
        rarityCounts[skin.rarity] = (rarityCounts[skin.rarity] || 0) + 1;
    });
    
    const rarityText = Object.entries(rarityCounts)
        .map(([rarity, count]) => `${rarity}: ${count}`)
        .join(', ');
    
    const resultBox = createElement('div', { className: 'roulette-result' },
        createElement('span', { style: 'font-size:2.5rem;' }, '🎁'),
        createElement('div', { style: 'font-weight:700;color:#fff;' }, 
            `+${quickOpenResults.length} предметов!`
        ),
        createElement('div', { style: 'color:#f0c060;' }, 
            `Общая цена: ${formatPrice(totalValue)} ₽`
        ),
        createElement('div', { style: 'color:#aaa;font-size:0.8rem;' }, rarityText),
        createElement('div', { 
            style: `color:${lastSkin.color};font-weight:600;` 
        }, `Последний: ${lastSkin.name}`),
        createElement('div', { className: 'roulette-result__actions' },
            createElement('button', {
                className: 'btn btn--outline btn--sm',
                onClick: () => {
                    $('#rouletteBox').style.display = 'none';
                    container.style.display = 'none';
                    // Обновляем профиль если открыт
                    if (gameState.currentTab === 'profile') {
                        renderProfilePage();
                    }
                }
            }, 'Ок')
        )
    );
    
    container.appendChild(resultBox);
    
    // Сохраняем состояние
    saveState();
}

// ===== ЭКСПОРТ =====
window.openCaseDetail = openCaseDetail;
window.renderCaseDetailPage = renderCaseDetailPage;
window.openSingleCase = openSingleCase;
window.openQuickMultiple = openQuickMultiple;