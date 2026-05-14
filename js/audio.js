/**
 * ShushaCase - Звуковой движок (Web Audio API)
 * 
 * Все звуки генерируются программно, без внешних файлов.
 * Использует AudioContext для создания звуковых эффектов.
 */

// ===== АУДИО КОНТЕКСТ =====
let audioContext = null;

/**
 * Ленивая инициализация AudioContext
 * Требуется после первого взаимодействия пользователя
 */
function getAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 AudioContext создан');
        } catch (error) {
            console.warn('⚠️ Web Audio API не поддерживается');
            return null;
        }
    }
    
    // Возобновляем, если был приостановлен
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    return audioContext;
}

// ===== ЗВУКОВЫЕ ЭФФЕКТЫ =====

/**
 * Звук тика рулетки
 * Частота меняется в зависимости от скорости вращения
 * 
 * @param {number} frequency - Частота звука (400-1200 Hz)
 * @param {number} duration - Длительность в секундах
 * @param {number} volume - Громкость (0-1)
 */
function playTickSound(frequency = 800, duration = 0.03, volume = 0.06) {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        // Осциллятор (генератор звука)
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine'; // Чистый тон
        
        // Усилитель (громкость)
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        // Настройка частоты
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        // Подключение
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Воспроизведение
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
        
        // Очистка
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    } catch (error) {
        // Тихо игнорируем ошибки звука
    }
}

/**
 * Звук открытия кейса (восходящий)
 */
function playCaseOpenSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        // Восходящий тон
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sine';
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.6);
    } catch (error) {}
}

/**
 * Звук выпадения предмета (приятный динь)
 */
function playItemDropSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        const notes = [523, 659, 784]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            oscillator.type = 'triangle';
            
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
            
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime + i * 0.1);
            oscillator.stop(ctx.currentTime + i * 0.1 + 0.3);
        });
    } catch (error) {}
}

/**
 * Победный фанфары (успешный апгрейд)
 */
function playSuccessSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        // Мажорный аккорд
        const melody = [
            { freq: 523, time: 0 },     // C5
            { freq: 659, time: 0.12 },   // E5
            { freq: 784, time: 0.24 },   // G5
            { freq: 1047, time: 0.36 }   // C6
        ];
        
        melody.forEach(note => {
            const oscillator = ctx.createOscillator();
            oscillator.type = 'triangle';
            
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime + note.time);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + 0.4);
            
            oscillator.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime + note.time);
            oscillator.stop(ctx.currentTime + note.time + 0.4);
        });
    } catch (error) {}
}

/**
 * Грустный звук (провал апгрейда)
 */
function playFailSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        // Нисходящий тон
        const oscillator = ctx.createOscillator();
        oscillator.type = 'sawtooth';
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        oscillator.frequency.setValueAtTime(500, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.8);
        
        // Добавляем шум для эффекта "разочарования"
        const noiseOsc = ctx.createOscillator();
        noiseOsc.type = 'square';
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        noiseOsc.frequency.setValueAtTime(150, ctx.currentTime);
        
        oscillator.connect(gainNode);
        noiseOsc.connect(noiseGain);
        gainNode.connect(ctx.destination);
        noiseGain.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        noiseOsc.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
        noiseOsc.stop(ctx.currentTime + 0.3);
    } catch (error) {}
}

/**
 * Звук продажи предмета (звон монет)
 */
function playSellSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        // Два быстрых щелчка
        for (let i = 0; i < 2; i++) {
            const oscillator = ctx.createOscillator();
            oscillator.type = 'sine';
            
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.06);
            
            oscillator.frequency.setValueAtTime(1500 + i * 200, ctx.currentTime + i * 0.08);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start(ctx.currentTime + i * 0.08);
            oscillator.stop(ctx.currentTime + i * 0.08 + 0.06);
        }
    } catch (error) {}
}

/**
 * Звук кнопки (короткий клик)
 */
function playClickSound() {
    playTickSound(1000, 0.02, 0.04);
}

/**
 * Звук наведения (очень тихий)
 */
function playHoverSound() {
    playTickSound(600, 0.015, 0.02);
}

// ===== НАСТРОЙКА ГРОМКОСТИ =====
let masterVolume = 0.7; // 70% громкость по умолчанию

/**
 * Установка общей громкости
 * @param {number} volume - Громкость (0-1)
 */
function setMasterVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('shushacase_volume', masterVolume);
    console.log(`🔊 Громкость: ${Math.round(masterVolume * 100)}%`);
}

/**
 * Загрузка сохранённой громкости
 */
function loadVolume() {
    const saved = localStorage.getItem('shushacase_volume');
    if (saved !== null) {
        masterVolume = parseFloat(saved);
    }
}

// Загружаем громкость при старте
loadVolume();

// ===== ЭКСПОРТ =====
window.playTickSound = playTickSound;
window.playCaseOpenSound = playCaseOpenSound;
window.playItemDropSound = playItemDropSound;
window.playSuccessSound = playSuccessSound;
window.playFailSound = playFailSound;
window.playSellSound = playSellSound;
window.playClickSound = playClickSound;
window.playHoverSound = playHoverSound;
window.setMasterVolume = setMasterVolume;
window.getAudioContext = getAudioContext;