document.addEventListener("DOMContentLoaded", () => {
    const settingsToggle = document.getElementById("settings-toggle");
    const settingsPopup = document.getElementById("settings-popup");
    const outsideVolumeSlider = document.getElementById("outside-volume");
    const posylVolumeSlider = document.getElementById("posyl-volume");
    const bellToggle = document.getElementById("bell-toggle");
    const bellVolumeSlider = document.getElementById("bell-volume");
    const flameInPosylToggle = document.getElementById("flame-in-posyl");
    const flameOutsidePosylToggle = document.getElementById("flame-outside-posyl");
    const flameVideo = document.getElementById("flame-video");
    // Новая переменная для полноэкранного режима
    const fullscreenToggle = document.getElementById("fullscreen-toggle");

    if (!settingsToggle || !settingsPopup || !outsideVolumeSlider || !posylVolumeSlider || 
        !bellToggle || !bellVolumeSlider || !flameInPosylToggle || 
        !flameOutsidePosylToggle || !flameVideo || !fullscreenToggle) {
        console.error("Не найдены элементы настроек или видео");
        return;
    }

    // Инициализация значений ползунков и переключателей
    outsideVolumeSlider.value = window.outsideVolume;
    posylVolumeSlider.value = window.posylVolume;
    bellToggle.checked = window.bellEnabled;
    bellVolumeSlider.value = window.bellVolume;
    bellVolumeSlider.disabled = !window.bellEnabled;

    window.flameInPosylEnabled = localStorage.getItem("flameInPosylEnabled") === "true";
    window.flameOutsidePosylEnabled = localStorage.getItem("flameOutsidePosylEnabled") === "true";
    flameInPosylToggle.checked = window.flameInPosylEnabled;
    flameOutsidePosylToggle.checked = window.flameOutsidePosylEnabled;

    // Инициализация полноэкранного режима (по умолчанию выключен)
    fullscreenToggle.checked = false;

    // Переключение состояния кнопки и попапа
    let isSettingsActive = false;
    settingsToggle.addEventListener("click", () => {
        isSettingsActive = !isSettingsActive;
        settingsToggle.classList.toggle("active", isSettingsActive);
        settingsToggle.classList.toggle("inactive", !isSettingsActive);
        
        if (isSettingsActive) {
            settingsPopup.style.display = "block";
            setTimeout(() => {
                settingsPopup.classList.add("visible");
            }, 10);
        } else {
            settingsPopup.classList.remove("visible");
            settingsPopup.addEventListener("transitionend", function handler() {
                if (!isSettingsActive) {
                    settingsPopup.style.display = "none";
                }
                settingsPopup.removeEventListener("transitionend", handler);
            });
        }
    });

    document.addEventListener("click", (event) => {
        if (!settingsPopup.contains(event.target) && !settingsToggle.contains(event.target) && isSettingsActive) {
            isSettingsActive = false;
            settingsToggle.classList.remove("active");
            settingsToggle.classList.add("inactive");
            settingsPopup.classList.remove("visible");
            settingsPopup.addEventListener("transitionend", function handler() {
                if (!isSettingsActive) {
                    settingsPopup.style.display = "none";
                }
                settingsPopup.removeEventListener("transitionend", handler);
            });
        }
    });

    outsideVolumeSlider.addEventListener("input", () => {
        const newValue = parseFloat(outsideVolumeSlider.value);
        localStorage.setItem("outsideVolume", newValue);
        window.outsideVolume = newValue;
    });

    posylVolumeSlider.addEventListener("input", () => {
        const newValue = parseFloat(posylVolumeSlider.value);
        localStorage.setItem("posylVolume", newValue);
        window.posylVolume = newValue;
    });

    bellToggle.addEventListener("change", () => {
        window.bellEnabled = bellToggle.checked;
        localStorage.setItem("bellEnabled", window.bellEnabled);
        bellVolumeSlider.disabled = !window.bellEnabled;
    });

    bellVolumeSlider.addEventListener("input", () => {
        const newValue = parseFloat(bellVolumeSlider.value);
        localStorage.setItem("bellVolume", newValue);
        window.bellVolume = newValue;
        const bellAudio = new Audio(bellSound.src);
        bellAudio.volume = window.bellVolume;
        bellAudio.play();
    });

    // Логика для полноэкранного режима
    fullscreenToggle.addEventListener("change", () => {
        if (fullscreenToggle.checked) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error("Ошибка при входе в полноэкранный режим:", err);
                fullscreenToggle.checked = false; // Сбрасываем, если не удалось
            });
        } else {
            document.exitFullscreen().catch(err => {
                console.error("Ошибка при выходе из полноэкранного режима:", err);
                fullscreenToggle.checked = true; // Сбрасываем, если не удалось
            });
        }
    });

    // Синхронизация состояния переключателя с реальным полноэкранным режимом
    document.addEventListener("fullscreenchange", () => {
        fullscreenToggle.checked = !!document.fullscreenElement;
    });

    function updateFlameVisibility() {
        const shouldBeVisible = (sendStatus === "В Посыле" && window.flameInPosylEnabled) || 
                               (sendStatus === "Вне Посыла" && window.flameOutsidePosylEnabled);
        const wasVisible = flameVideo.classList.contains("visible");
        const wasInPosylPreviously = sendStatus === "В Посыле";

        flameVideo.classList.toggle("visible", shouldBeVisible);

        if (shouldBeVisible) {
            flameVideo.style.display = "block";
            if (typeof updateFlameOpacity === "function") {
                updateFlameOpacity();
            }
            if (hasUserInteracted) {
                flameVideo.play().catch(error => console.error("Ошибка воспроизведения:", error));
            }
        } else {
            flameVideo.pause();
            flameVideo.style.opacity = "0";
            setTimeout(() => {
                if (!flameVideo.classList.contains("visible")) {
                    flameVideo.style.display = "none";
                }
            }, 500);
        }

        const messageContainer = document.querySelector(".message-container");
        if (shouldBeVisible && !wasVisible && messageContainer && sendStatus === "В Посыле") {
            messageContainer.scrollTop += 1;
            setTimeout(() => {
                messageContainer.scrollTop -= 1;
                if (typeof updateFlameOpacity === "function") {
                    updateFlameOpacity();
                }
            }, 100);
        }

        if (shouldBeVisible && sendStatus === "В Посыле" && !wasInPosylPreviously && messageContainer) {
            messageContainer.scrollTop += 1;
            setTimeout(() => {
                messageContainer.scrollTop -= 1;
                if (typeof updateFlameOpacity === "function") {
                    updateFlameOpacity();
                }
            }, 100);
        }
    }

    flameInPosylToggle.addEventListener("change", () => {
        const wasEnabled = window.flameInPosylEnabled;
        window.flameInPosylEnabled = flameInPosylToggle.checked;
        localStorage.setItem("flameInPosylEnabled", window.flameInPosylEnabled);
        updateFlameVisibility();
        if (!wasEnabled && window.flameInPosylEnabled && sendStatus === "В Посыле") {
            const messageContainer = document.querySelector(".message-container");
            if (messageContainer) {
                messageContainer.scrollTop += 1;
                setTimeout(() => {
                    messageContainer.scrollTop -= 1;
                    if (typeof updateFlameOpacity === "function") {
                        updateFlameOpacity();
                    }
                }, 100);
            }
        }
    });

    flameOutsidePosylToggle.addEventListener("change", () => {
        const wasEnabled = window.flameOutsidePosylEnabled;
        window.flameOutsidePosylEnabled = flameOutsidePosylToggle.checked;
        localStorage.setItem("flameOutsidePosylEnabled", window.flameOutsidePosylEnabled);
        updateFlameVisibility();
        if (!wasEnabled && window.flameOutsidePosylEnabled && sendStatus === "Вне Посыла") {
            const messageContainer = document.querySelector(".message-container");
            if (messageContainer) {
                messageContainer.scrollTop += 1;
                setTimeout(() => {
                    messageContainer.scrollTop -= 1;
                    if (typeof updateFlameOpacity === "function") {
                        updateFlameOpacity();
                    }
                }, 100);
            }
        }
    });

    updateFlameVisibility();

    const desktopFontSizeInput = document.getElementById("desktop-font-size");
    const mobileFontSizeInput = document.getElementById("mobile-font-size");
    const fontSizeDecreaseButtons = document.querySelectorAll(".font-size-decrease");
    const fontSizeIncreaseButtons = document.querySelectorAll(".font-size-increase");

    if (!desktopFontSizeInput || !mobileFontSizeInput || !fontSizeDecreaseButtons.length || !fontSizeIncreaseButtons.length) {
        console.error("Не найдены элементы управления размером шрифта");
        return;
    }

    window.desktopFontSize = localStorage.getItem("desktopFontSize") !== null ? parseInt(localStorage.getItem("desktopFontSize")) : 22;
    window.mobileFontSize = localStorage.getItem("mobileFontSize") !== null ? parseInt(localStorage.getItem("mobileFontSize")) : 16;
    desktopFontSizeInput.value = window.desktopFontSize;
    mobileFontSizeInput.value = window.mobileFontSize;

    adjustMessageTextSize();

    desktopFontSizeInput.addEventListener("input", () => {
        let newValue = parseInt(desktopFontSizeInput.value);
        if (isNaN(newValue) || newValue < 16) newValue = 16;
        if (newValue > 30) newValue = 30;
        desktopFontSizeInput.value = newValue;
        window.desktopFontSize = newValue;
        localStorage.setItem("desktopFontSize", newValue);
        adjustMessageTextSize();
    });

    mobileFontSizeInput.addEventListener("input", () => {
        let newValue = parseInt(mobileFontSizeInput.value);
        if (isNaN(newValue) || newValue < 10) newValue = 10;
        if (newValue > 20) newValue = 20;
        mobileFontSizeInput.value = newValue;
        window.mobileFontSize = newValue;
        localStorage.setItem("mobileFontSize", newValue);
        adjustMessageTextSize();
    });

    fontSizeDecreaseButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            let newValue = parseInt(input.value) - 1;
            if (targetId === "desktop-font-size" && newValue >= 16) {
                input.value = newValue;
                window.desktopFontSize = newValue;
                localStorage.setItem("desktopFontSize", newValue);
                adjustMessageTextSize();
            } else if (targetId === "mobile-font-size" && newValue >= 10) {
                input.value = newValue;
                window.mobileFontSize = newValue;
                localStorage.setItem("mobileFontSize", newValue);
                adjustMessageTextSize();
            }
        });
    });

    fontSizeIncreaseButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            let newValue = parseInt(input.value) + 1;
            if (targetId === "desktop-font-size" && newValue <= 30) {
                input.value = newValue;
                window.desktopFontSize = newValue;
                localStorage.setItem("desktopFontSize", newValue);
                adjustMessageTextSize();
            } else if (targetId === "mobile-font-size" && newValue <= 20) {
                input.value = newValue;
                window.mobileFontSize = newValue;
                localStorage.setItem("mobileFontSize", newValue);
                adjustMessageTextSize();
            }
        });
    });

    bellVolumeSlider.addEventListener("input", () => {
        const newValue = parseFloat(bellVolumeSlider.value);
        localStorage.setItem("bellVolume", newValue);
        window.bellVolume = newValue;
        const bellAudio = new Audio(bellSound.src);
        bellAudio.volume = window.bellVolume;
        bellAudio.play();
        notificationAudio.volume = window.bellVolume;
    });

    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.parentElement;
            const content = section.querySelector('.section-content');
            const isCollapsed = section.classList.contains('section-collapsed');

            content.classList.add('animating');

            if (isCollapsed) {
                section.classList.remove('section-collapsed');
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                setTimeout(() => {
                    content.style.maxHeight = '450px';
                    content.classList.remove('animating');
                }, 400);
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                setTimeout(() => {
                    section.classList.add('section-collapsed');
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                    setTimeout(() => {
                        content.classList.remove('animating');
                    }, 400);
                }, 10);
            }

            const sectionTitle = header.querySelector('.section-title').textContent;
            const newCollapsedState = !isCollapsed;
            localStorage.setItem(`section-${sectionTitle}-collapsed`, newCollapsedState);
        });
    });

    document.querySelectorAll('.settings-section').forEach(section => {
        const sectionTitle = section.querySelector('.section-title').textContent;
        const isCollapsed = localStorage.getItem(`section-${sectionTitle}-collapsed`) === 'true';
        const content = section.querySelector('.section-content');
        
        if (isCollapsed) {
            section.classList.add('section-collapsed');
            content.style.maxHeight = '0';
            content.style.opacity = '0';
        } else {
            content.style.maxHeight = '450px';
            content.style.opacity = '1';
        }

        content.addEventListener('transitionend', () => {
            if (!section.classList.contains('section-collapsed')) {
                content.style.maxHeight = '450px';
            }
            content.classList.remove('animating');
        });
    });
});