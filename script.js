// Отключаем все логирование
Object.keys(console).forEach(key => {
    if (typeof console[key] === 'function') {
        console[key] = function() {};
    }
});

function updateFlameVisibility() {
    const shouldBeVisible = (sendStatus === "В Посыле" && window.flameInPosylEnabled) || 
                           (sendStatus === "Вне Посыла" && window.flameOutsidePosylEnabled);
    flameVideo.style.display = "block";
    flameVideo.classList.toggle("visible", shouldBeVisible);
    if (shouldBeVisible && hasUserInteracted) {
        flameVideo.play().catch(error => console.error("Ошибка воспроизведения:", error));
    } else {
        flameVideo.pause();
    }
    // Вызываем обновление прозрачности после изменения видимости
    if (typeof updateFlameOpacity === "function") {
        updateFlameOpacity();
    }
}

