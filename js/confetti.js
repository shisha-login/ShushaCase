/**
 * ShushaCase - Система конфетти
 * 
 * Рисует анимированные частицы на canvas при успешных действиях.
 * Использует requestAnimationFrame для плавной анимации.
 */

// ===== КАНВАС =====
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');

let particles = [];
let animationId = null;
let isAnimating = false;

// ===== НАСТРОЙКИ =====
const CONFETTI_COLORS = [
    '#eb4b4b', // Covert красный
    '#d32ce6', // Classified розовый
    '#8847ff', // Restricted фиолетовый
    '#4b69ff', // Mil-spec синий
    '#5e98d9', // Industrial голубой
    '#f0c060', // Золотой
    '#4caf84', // Зелёный
    '#ff6b6b', // Светло-красный
    '#ffaa00', // Оранжевый
    '#00e5ff', // Голубой неон
    '#ff4081', // Розовый
    '#69f0ae'  // Мятный
];

// ===== ИНИЦИАЛИЗАЦИЯ =====

/**
 * Подгоняет размер канваса под окно
 */
function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

// Слушаем изменение размера окна
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

// ===== УПРАВЛЕНИЕ ЧАСТИЦАМИ =====

/**
 * Создаёт новую частицу
 */
function createParticle() {
    return {
        // Позиция
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 200, // Начинают над экраном
        
        // Размер
        width: Math.random() * 10 + 4,
        height: Math.random() * 6 + 3,
        
        // Цвет
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        
        // Скорость
        velocityX: (Math.random() - 0.5) * 8,  // Горизонтальная
        velocityY: Math.random() * 5 + 3,       // Вертикальная
        
        // Вращение
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        
        // Физика
        gravity: 0.06 + Math.random() * 0.1,
        opacity: 1,
        fadeSpeed: 0.003 + Math.random() * 0.005
    };
}

/**
 * Запускает конфетти
 * @param {number} count - Количество частиц
 * @param {object} options - Настройки
 */
function launchConfetti(count = 150, options = {}) {
    // Настройки по умолчанию
    const settings = {
        spread: options.spread || 360,      // Разброс в градусах
        startVelocity: options.startVelocity || 45,
        decay: options.decay || 0.9,
        colors: options.colors || CONFETTI_COLORS,
        origin: options.origin || { x: 0.5, y: 0.5 } // Центр экрана
    };
    
    // Создаём частицы
    particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(createParticle());
    }
    
    // Запускаем анимацию
    if (!isAnimating) {
        isAnimating = true;
        animateConfetti();
    }
    
    console.log(`🎉 Конфетти: ${count} частиц`);
}

/**
 * Запускает конфетти из центра экрана
 */
function launchCenterConfetti(count = 120) {
    launchConfetti(count, {
        origin: { x: 0.5, y: 0.4 },
        spread: 180
    });
}

/**
 * Запускает мини-конфетти (для выпадения предмета)
 */
function launchMiniConfetti() {
    launchConfetti(40, {
        origin: { x: 0.5, y: 0.5 },
        spread: 90,
        startVelocity: 25
    });
}

/**
 * Запускает конфетти для успешного апгрейда
 */
function launchUpgradeConfetti() {
    // Два взрыва конфетти
    launchConfetti(100, {
        origin: { x: 0.3, y: 0.5 },
        spread: 120
    });
    
    setTimeout(() => {
        launchConfetti(80, {
            origin: { x: 0.7, y: 0.5 },
            spread: 120
        });
    }, 200);
}

// ===== АНИМАЦИЯ =====

/**
 * Главный цикл анимации
 */
function animateConfetti() {
    if (!isAnimating) return;
    
    // Очищаем канвас
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    let aliveCount = 0;
    
    particles.forEach(particle => {
        // Обновляем позицию
        particle.x += particle.velocityX;
        particle.velocityY += particle.gravity;
        particle.y += particle.velocityY;
        
        // Замедление
        particle.velocityX *= 0.99;
        particle.velocityY *= 0.99;
        
        // Вращение
        particle.rotation += particle.rotationSpeed;
        
        // Затухание
        particle.opacity -= particle.fadeSpeed;
        
        // Убираем мёртвые частицы
        if (particle.opacity <= 0 || particle.y > confettiCanvas.height + 100) {
            return;
        }
        
        aliveCount++;
        
        // Рисуем частицу
        ctx.save();
        ctx.globalAlpha = Math.max(0, particle.opacity);
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        
        // Прямоугольник с градиентом
        const gradient = ctx.createLinearGradient(
            -particle.width / 2, 0,
            particle.width / 2, 0
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.5, lightenColor(particle.color, 30));
        gradient.addColorStop(1, particle.color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            -particle.width / 2,
            -particle.height / 2,
            particle.width,
            particle.height
        );
        
        ctx.restore();
    });
    
    // Продолжаем или останавливаем
    if (aliveCount > 0) {
        animationId = requestAnimationFrame(animateConfetti);
    } else {
        stopConfetti();
    }
}

/**
 * Останавливает конфетти
 */
function stopConfetti() {
    isAnimating = false;
    particles = [];
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Очищаем канвас
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Осветляет цвет
 */
function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
}

/**
 * Создаёт эффект "золотого дождя" для больших побед
 */
function launchGoldenRain() {
    const goldColors = ['#f0c060', '#ffd700', '#ffaa00', '#ff8c00', '#ffd700'];
    
    launchConfetti(200, {
        colors: goldColors,
        spread: 360,
        startVelocity: 60,
        decay: 0.95
    });
}

// ===== ЭКСПОРТ =====
window.launchConfetti = launchConfetti;
window.launchCenterConfetti = launchCenterConfetti;
window.launchMiniConfetti = launchMiniConfetti;
window.launchUpgradeConfetti = launchUpgradeConfetti;
window.launchGoldenRain = launchGoldenRain;
window.stopConfetti = stopConfetti;