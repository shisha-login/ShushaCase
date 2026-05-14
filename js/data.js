/**
 * ShushaCase - База данных скинов CS2
 * 
 * Источники:
 * - Изображения: CS:GO Backpack API (бесплатный, без ключа)
 * - Цены: Steam Market RUB (через priceoverview)
 * 
 * Обновление: автоматическое при загрузке + кнопка "Обновить цены"
 */

const SKINS_DATABASE = [
    // ===== COVERT (Красные) =====
    {
        id: 'skin_001',
        name: 'AK-47 | Кровавая паутина',
        rarity: 'Covert',
        price: 14500,
        color: '#eb4b4b',
        marketHash: 'AK-47%20%7C%20Bloodsport%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_002',
        name: 'AWP | Азимов',
        rarity: 'Covert',
        price: 8200,
        color: '#eb4b4b',
        marketHash: 'AWP%20%7C%20Asiimov%20%28Field-Tested%29',
        imageUrl: ''
    },
    {
        id: 'skin_003',
        name: 'M4A4 | Император',
        rarity: 'Covert',
        price: 3500,
        color: '#eb4b4b',
        marketHash: 'M4A4%20%7C%20The%20Emperor%20%28Minimal%20Wear%29',
        imageUrl: ''
    },
    {
        id: 'skin_004',
        name: 'Desert Eagle | Кровавая паутина',
        rarity: 'Covert',
        price: 1400,
        color: '#eb4b4b',
        marketHash: 'Desert%20Eagle%20%7C%20Crimson%20Web%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_005',
        name: 'M4A1-S | Гиперзверь',
        rarity: 'Covert',
        price: 4600,
        color: '#eb4b4b',
        marketHash: 'M4A1-S%20%7C%20Hyper%20Beast%20%28Factory%20New%29',
        imageUrl: ''
    },

    // ===== CLASSIFIED (Розовые) =====
    {
        id: 'skin_006',
        name: 'AK-47 | Красная линия',
        rarity: 'Classified',
        price: 1100,
        color: '#d32ce6',
        marketHash: 'AK-47%20%7C%20Redline%20%28Field-Tested%29',
        imageUrl: ''
    },
    {
        id: 'skin_007',
        name: 'Glock-18 | Водяной элемент',
        rarity: 'Classified',
        price: 1500,
        color: '#d32ce6',
        marketHash: 'Glock-18%20%7C%20Water%20Elemental%20%28Minimal%20Wear%29',
        imageUrl: ''
    },
    {
        id: 'skin_008',
        name: 'SSG 08 | Кровь в воде',
        rarity: 'Classified',
        price: 450,
        color: '#d32ce6',
        marketHash: 'SSG%2008%20%7C%20Blood%20in%20the%20Water%20%28Minimal%20Wear%29',
        imageUrl: ''
    },
    {
        id: 'skin_009',
        name: 'P250 | Мёртвые',
        rarity: 'Classified',
        price: 250,
        color: '#d32ce6',
        marketHash: 'P250%20%7C%20Muertos%20%28Factory%20New%29',
        imageUrl: ''
    },

    // ===== RESTRICTED (Фиолетовые) =====
    {
        id: 'skin_010',
        name: 'USP-S | Убийца',
        rarity: 'Restricted',
        price: 800,
        color: '#8847ff',
        marketHash: 'USP-S%20%7C%20Kill%20Confirmed%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_011',
        name: 'SCAR-20 | Фрагменты',
        rarity: 'Restricted',
        price: 620,
        color: '#8847ff',
        marketHash: 'SCAR-20%20%7C%20Fragments%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_012',
        name: 'Five-SeveN | Огненный змей',
        rarity: 'Restricted',
        price: 340,
        color: '#8847ff',
        marketHash: 'Five-SeveN%20%7C%20Flame%20Test%20%28Factory%20New%29',
        imageUrl: ''
    },

    // ===== MIL-SPEC (Синие) =====
    {
        id: 'skin_013',
        name: 'MAC-10 | Белая рыбка',
        rarity: 'Mil-spec',
        price: 120,
        color: '#4b69ff',
        marketHash: 'MAC-10%20%7C%20Whitefish%20%28Field-Tested%29',
        imageUrl: ''
    },
    {
        id: 'skin_014',
        name: 'FAMAS | Пульс',
        rarity: 'Mil-spec',
        price: 180,
        color: '#4b69ff',
        marketHash: 'FAMAS%20%7C%20Pulse%20%28Minimal%20Wear%29',
        imageUrl: ''
    },
    {
        id: 'skin_015',
        name: 'MP9 | Зелёный клетчатый',
        rarity: 'Mil-spec',
        price: 45,
        color: '#4b69ff',
        marketHash: 'MP9%20%7C%20Green%20Plaid%20%28Field-Tested%29',
        imageUrl: ''
    },

    // ===== INDUSTRIAL (Голубые) =====
    {
        id: 'skin_016',
        name: 'Nova | Восходящий череп',
        rarity: 'Industrial',
        price: 80,
        color: '#5e98d9',
        marketHash: 'Nova%20%7C%20Rising%20Skull%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_017',
        name: 'MAG-7 | Металлик',
        rarity: 'Industrial',
        price: 60,
        color: '#5e98d9',
        marketHash: 'MAG-7%20%7C%20Metallic%20DDPAT%20%28Minimal%20Wear%29',
        imageUrl: ''
    },
    {
        id: 'skin_018',
        name: 'MP7 | Океанская пена',
        rarity: 'Industrial',
        price: 35,
        color: '#5e98d9',
        marketHash: 'MP7%20%7C%20Ocean%20Foam%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_019',
        name: 'PP-Bizon | Химический зелёный',
        rarity: 'Industrial',
        price: 25,
        color: '#5e98d9',
        marketHash: 'PP-Bizon%20%7C%20Chemical%20Green%20%28Factory%20New%29',
        imageUrl: ''
    },
    {
        id: 'skin_020',
        name: 'P90 | Холодная кровь',
        rarity: 'Industrial',
        price: 40,
        color: '#5e98d9',
        marketHash: 'P90%20%7C%20Cold%20Blooded%20%28Factory%20New%29',
        imageUrl: ''
    }
];

// Кейсы с дроп-листами
const CASES = [
    {
        id: 'case_001',
        name: 'Революция',
        price: 400,
        emoji: '📦',
        dropTable: [
            { skinId: 'skin_001', weight: 1 },
            { skinId: 'skin_005', weight: 1 },
            { skinId: 'skin_007', weight: 3 },
            { skinId: 'skin_010', weight: 8 },
            { skinId: 'skin_013', weight: 15 },
            { skinId: 'skin_016', weight: 20 }
        ]
    },
    {
        id: 'case_002',
        name: 'Огненный змей',
        price: 550,
        emoji: '🔥',
        dropTable: [
            { skinId: 'skin_002', weight: 1 },
            { skinId: 'skin_006', weight: 3 },
            { skinId: 'skin_008', weight: 5 },
            { skinId: 'skin_011', weight: 10 },
            { skinId: 'skin_014', weight: 18 },
            { skinId: 'skin_018', weight: 22 }
        ]
    },
    {
        id: 'case_003',
        name: 'Охотничий',
        price: 280,
        emoji: '🎯',
        dropTable: [
            { skinId: 'skin_003', weight: 1 },
            { skinId: 'skin_004', weight: 2 },
            { skinId: 'skin_009', weight: 6 },
            { skinId: 'skin_012', weight: 12 },
            { skinId: 'skin_015', weight: 20 },
            { skinId: 'skin_019', weight: 25 }
        ]
    },
    {
        id: 'case_004',
        name: 'Зимний',
        price: 320,
        emoji: '❄️',
        dropTable: [
            { skinId: 'skin_004', weight: 1 },
            { skinId: 'skin_008', weight: 4 },
            { skinId: 'skin_012', weight: 10 },
            { skinId: 'skin_015', weight: 18 },
            { skinId: 'skin_017', weight: 22 },
            { skinId: 'skin_020', weight: 25 }
        ]
    }
];

// Вспомогательные функции
function getSkinById(id) {
    return SKINS_DATABASE.find(s => s.id === id) || null;
}

/**
 * Загрузка изображений и цен через CS:GO Backpack API
 */
async function loadSkinsData() {
    console.log('🔄 Загрузка данных скинов...');
    
    try {
        const response = await fetch('https://csgobackpack.net/api/GetItemsList/v2/?json=1');
        const data = await response.json();
        
        if (!data || !data.items_list) {
            console.warn('⚠️ API недоступен, используются локальные данные');
            return;
        }

        let updatedCount = 0;
        
        for (const skin of SKINS_DATABASE) {
            const apiItem = data.items_list[skin.marketHash];
            
            if (apiItem) {
                // Загружаем картинку
                if (apiItem.icon_url) {
                    skin.imageUrl = `https://steamcommunity-a.akamaihd.net/economy/image/${apiItem.icon_url}`;
                    updatedCount++;
                }
                
                // Обновляем цену (средняя за 7 дней, RUB)
                if (apiItem.price && apiItem.price['7_days']) {
                    const avgPrice = apiItem.price['7_days'].average;
                    if (avgPrice > 0) {
                        skin.price = Math.round(avgPrice * 0.89); // Конвертация в RUB
                    }
                }
            }
        }
        
        console.log(`✅ Обновлено ${updatedCount} скинов`);
        
        // Кешируем данные
        localStorage.setItem('skins_cache', JSON.stringify(
            SKINS_DATABASE.map(s => ({ id: s.id, imageUrl: s.imageUrl, price: s.price }))
        ));
        
    } catch (error) {
        console.warn('⚠️ Ошибка загрузки данных, используются кешированные:', error.message);
        loadCachedSkinsData();
    }
}

/**
 * Загрузка кешированных данных
 */
function loadCachedSkinsData() {
    const cached = localStorage.getItem('skins_cache');
    if (!cached) return;
    
    try {
        const data = JSON.parse(cached);
        data.forEach(item => {
            const skin = SKINS_DATABASE.find(s => s.id === item.id);
            if (skin) {
                if (item.imageUrl) skin.imageUrl = item.imageUrl;
                if (item.price) skin.price = item.price;
            }
        });
        console.log('📦 Загружены кешированные данные скинов');
    } catch (error) {
        console.warn('Ошибка загрузки кеша:', error);
    }
}

/**
 * Быстрое обновление цен через Steam Market (без картинок)
 */
async function updatePricesOnly() {
    console.log('💰 Обновление цен...');
    
    for (const skin of SKINS_DATABASE) {
        try {
            const response = await fetch(
                `https://steamcommunity.com/market/priceoverview/?appid=730&currency=5&market_hash_name=${skin.marketHash}`
            );
            const data = await response.json();
            
            if (data && data.lowest_price) {
                const priceStr = data.lowest_price.replace(/[^0-9,]/g, '').replace(',', '.');
                skin.price = parseFloat(priceStr);
            }
        } catch (error) {
            // Пропускаем, оставляем старую цену
        }
    }
    
    // Сохраняем обновлённые цены
    localStorage.setItem('skins_cache', JSON.stringify(
        SKINS_DATABASE.map(s => ({ id: s.id, imageUrl: s.imageUrl, price: s.price }))
    ));
    
    console.log('✅ Цены обновлены');
}