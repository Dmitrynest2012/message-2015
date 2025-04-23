let messageText;
let posylType = localStorage.getItem("posylType") || "Ежедневные Посылы";
let sendStatus = "Вне Посыла";
let jsonData = [];
let lastModified = null;
let lastContentHash = null;
let sessionId = null;
let lastIntervalStart = null;

// Добавляем в начало файла
let intervalEndAudio;
let hasIntervalEndPlayed = false;

let imageElement;
let audioElement;
let bellAudio;
let songTitleElement;
let musicToggleButton;
let progressLine;
let flameVideo;
let lastImageSrc = "";
let wasInPosyl = false;
let currentTrack = null;
let currentIntervalStart = null;
let hasUserInteracted = false;
let hasBellPlayed = false;
let lastProgressPercentage = 0;

let notificationAudio;
let lastUpdateTime = null;
let isUserActive = false;

document.addEventListener("DOMContentLoaded", () => {
    messageText = document.getElementById("message-text");
    imageElement = document.getElementById("dynamic-image");
    songTitleElement = document.getElementById("song-title");
    musicToggleButton = document.getElementById("music-toggle");
    progressLine = document.querySelector(".progress-line");
    flameVideo = document.getElementById("flame-video");
    audioElement = new Audio();
    bellAudio = new Audio(bellSound.src);
    if (!messageText) throw new Error("Элемент #message-text не найден");
    if (!imageElement) throw new Error("Элемент #dynamic-image не найден");
    if (!songTitleElement) throw new Error("Элемент #song-title не найден");
    if (!musicToggleButton) throw new Error("Элемент #music-toggle не найден");
    if (!progressLine) throw new Error("Элемент .progress-line не найден");
    if (!flameVideo) throw new Error("Элемент #flame-video не найден");

    // Проверка загрузки видео
    console.log("Путь к видео:", flameVideo.src); // Логируем полный путь
    flameVideo.addEventListener("loadeddata", () => {
        console.log("Видео успешно загружено");
    });
    flameVideo.addEventListener("error", (e) => {
        console.error("Ошибка загрузки видео:", e.target.error.message);
    });
    // Принудительно пытаемся загрузить видео
    flameVideo.load();

    // Добавляем обработчики для настроек (если их нет)
    const flameOutsideCheckbox = document.querySelector("#flame-outside-checkbox"); // Замените на реальный ID
    if (flameOutsideCheckbox) {
        flameOutsideCheckbox.addEventListener("change", (e) => {
            window.flameOutsidePosylEnabled = e.target.checked;
            localStorage.setItem("flameOutsidePosylEnabled", e.target.checked);
            window.updateFlameVisibility();
        });
    }

    fetchExcelFile().then(() => {
        updateDate(); // Обновляем дату сразу после первой загрузки данных
    }).catch(error => {
        console.error("Ошибка при начальной загрузке данных:", error);
        updateDate(); // Обновляем с дефолтным значением в случае ошибки
    });

    // Новый код для динамической прозрачности свечи
    const messageContainer = document.querySelector(".message-container");
    if (messageContainer) {
        messageContainer.style.transition = "scroll-top 0.5s ease-in-out";
        messageContainer.scrollTop += 1;
        setTimeout(() => {
            messageContainer.scrollTop -= 1;
            setTimeout(() => {
                messageContainer.style.transition = ""; // Убираем transition после анимации
                if (typeof updateFlameOpacity === "function") {
                    updateFlameOpacity();
                }
            }, 500);
        }, 500);
    }

    notificationAudio = new Audio(notificationSound.src);
    notificationAudio.volume = window.bellVolume; // Используем громкость колокола по умолчанию

    // После notificationAudio
    

    // Отслеживание активности пользователя
    isUserActive = true;
    window.addEventListener("focus", () => isUserActive = true);
    window.addEventListener("blur", () => isUserActive = false);
    
    

    function updateFlameOpacity() {
        if (!flameVideo.classList.contains("visible") || flameVideo.style.display === "none") {
            return; // Ничего не делаем, если свеча не видна
        }
        const messageContainer = document.querySelector(".message-container");
        const scrollTop = messageContainer.scrollTop;
        const scrollHeight = messageContainer.scrollHeight;
        const clientHeight = messageContainer.clientHeight;
        const maxOpacity = 0.3; // Максимальная прозрачность (не меняем)
        const minOpacity = 0.05; // Минимальная прозрачность (было 0.0, теперь 0.06)
    
        if (scrollHeight <= clientHeight) {
            // Если контента меньше высоты контейнера
            flameVideo.style.opacity = sendStatus === "Вне Посыла" ? maxOpacity : minOpacity;
            return;
        }
    
        const scrollPercentage = (scrollHeight - clientHeight - scrollTop) / (scrollHeight - clientHeight);
        let newOpacity;
        if (sendStatus === "Вне Посыла") {
            // Вне Посыла: от 0.2 (вверху) до 0.06 (внизу)
            newOpacity = minOpacity + (maxOpacity - minOpacity) * scrollPercentage;
        } else {
            // В Посыле: от 0.06 (вверху) до 0.2 (внизу)
            newOpacity = minOpacity + (maxOpacity - minOpacity) * (1 - scrollPercentage);
        }
        flameVideo.style.opacity = newOpacity;
    }

    // Обработчик прокрутки
    messageContainer.addEventListener("scroll", updateFlameOpacity);
    

    // Инициализация прозрачности при загрузке
    updateFlameOpacity();

    // Переопределение updateFlameVisibility
    const originalUpdateFlameVisibility = window.updateFlameVisibility || function() {};
    window.updateFlameVisibility = function() {
        originalUpdateFlameVisibility(); // Выполняем оригинальную логику
        // Убираем дублирующий вызов updateFlameOpacity, так как он уже есть в settings.js
    };

    const musicEnabled = localStorage.getItem("musicEnabled") !== "false";
    setMusicToggleState(musicEnabled, false);
    musicToggleButton.addEventListener("click", toggleMusic);
    musicToggleButton.addEventListener("mouseover", showSongTitle);
    musicToggleButton.addEventListener("mouseout", hideSongTitle);

    document.body.addEventListener("click", () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            if (localStorage.getItem("musicEnabled") !== "false") {
                playMusic(sendStatus, null);
            }
            const shouldPlay = (sendStatus === "В Посыле" && window.flameInPosylEnabled) || 
                              (sendStatus === "Вне Посыла" && window.flameOutsidePosylEnabled);
            if (shouldPlay) {
                flameVideo.classList.add("visible");
                flameVideo.play().catch(error => console.error("Ошибка воспроизведения:", error));
            }
        }
    }, { once: true });

    setInterval(() => {
        if (!audioElement.paused) {
            const targetVolume = sendStatus === "Вне Посыла" ? window.outsideVolume : window.posylVolume; // Обновляем на posylVolume
            audioElement.volume = targetVolume;
        }
    }, 100);

    // Добавляем слушатель изменения ориентации
    window.matchMedia("(orientation: portrait)").addEventListener("change", () => {
        adjustMessageTextSize();
    });

    waitForTime();
});

function generateSessionId() {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, "0");
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const year = now.getUTCFullYear();
    const hours = String(now.getUTCHours() + 3).padStart(2, "0");
    const minutes = String(now.getUTCMinutes()).padStart(2, "0");
    const seconds = String(now.getUTCSeconds()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function computeHash(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = (hash * 31 + data.charCodeAt(i)) | 0;
    }
    return hash.toString();
}

async function fetchExcelFile() {
    const response = await fetch('data-message.xlsx', { cache: "no-store" });
    if (!response.ok) throw new Error(`Не удалось загрузить файл: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const textDecoder = new TextDecoder("utf-8");
    const contentString = textDecoder.decode(arrayBuffer);
    const newContentHash = computeHash(contentString);

    const currentLastModified = response.headers.get("Last-Modified") || Date.now().toString();

    // Инициализируем lastContentHash при первой загрузке
    if (lastContentHash === null) {
        lastContentHash = newContentHash;
        lastUpdateTime = currentLastModified; // Устанавливаем начальное время
    } else if (lastContentHash !== newContentHash) {
        // Файл обновился, и пользователь активен
        lastUpdateTime = currentLastModified;
        showNotification();
    }

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    jsonData = XLSX.utils.sheet_to_json(sheet);
    lastModified = currentLastModified;
    lastContentHash = newContentHash;
    processExcelData();
}

// Функция проверки изменений (добавляем сюда)
async function checkCache() {
    await fetchExcelFile(); // Загружаем файл заново каждые 10 секунд
}

function showNotification() {
    const notificationContainer = document.getElementById("notification-container");
    const notificationText = document.getElementById("notification-text");
    const imageContainer = document.getElementById("image-container");

    if (!notificationContainer || !notificationText || !imageContainer) return;

    // Парсим lastUpdateTime как дату
    let updateDate;
    if (typeof lastUpdateTime === "string") {
        updateDate = new Date(lastUpdateTime);
        if (isNaN(updateDate.getTime())) {
            updateDate = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay, currentHours, currentMinutes, currentSeconds));
        }
    } else {
        updateDate = new Date(lastUpdateTime);
    }

    updateDate.setUTCHours(updateDate.getUTCHours() + 3);

    const day = String(updateDate.getUTCDate()).padStart(2, "0");
    const month = String(updateDate.getUTCMonth() + 1).padStart(2, "0");
    const year = updateDate.getUTCFullYear();
    const hours = String(updateDate.getUTCHours()).padStart(2, "0");
    const minutes = String(updateDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(updateDate.getUTCSeconds()).padStart(2, "0");
    const formattedTime = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

    notificationText.textContent = `Обновлен текст Посыла [${formattedTime}]`;

    // Рассчитываем середину высоты image-container
    const imageContainerHeight = imageContainer.offsetHeight;
    const middlePosition = imageContainerHeight / 2 - notificationContainer.offsetHeight / 2;

    // Устанавливаем начальную позицию и запускаем подъем
    notificationContainer.style.bottom = "-100px";
    notificationContainer.classList.remove("exiting");
    notificationContainer.classList.add("visible");

    // Поднимаем до середины через небольшой таймаут
    setTimeout(() => {
        notificationContainer.style.bottom = `${middlePosition}px`;
    }, 10);

    // Воспроизводим звук
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(error => console.error("Ошибка воспроизведения звука уведомления:", error));

    // Ожидаем 2 секунды в середине, затем запускаем уход
    setTimeout(() => {
        notificationContainer.classList.remove("visible");
        notificationContainer.classList.add("exiting");

        // Очищаем после завершения анимации
        notificationContainer.addEventListener("transitionend", function handler() {
            notificationContainer.classList.remove("exiting");
            notificationContainer.style.bottom = "-100px"; // Сбрасываем позицию
            notificationContainer.removeEventListener("transitionend", handler);
        }, { once: true });
    }, 2500); // 0.5 сек (подъем) + 2 сек (пауза)
}

function processExcelData() {
    let newPosylType = "Ежедневные Посылы"; // Сбрасываем тип посыла по умолчанию
    const currentDate = String(new Date().getDate()).padStart(2, "0");

    jsonData.forEach(row => {
        if (row["Дата [мск]:"] && row["Тип:"] === "часовой посыл") {
            try {
                let datesArray = JSON.parse(row["Дата [мск]:"]);
                if (Array.isArray(datesArray) && datesArray.includes(currentDate)) {
                    newPosylType = "Ежедневные + часовой Посыл";
                }
            } catch (error) {
                console.error("Ошибка парсинга даты:", error);
            }
        }
        if (row["Триггеры:"]) {
            row.triggers = row["Триггеры:"];
        }
    });

    if (posylType !== newPosylType) {
        const dateElement = document.getElementById("date");
        const oldText = dateElement.textContent;
        posylType = newPosylType;
        window.posylType = posylType;
        localStorage.setItem("posylType", posylType);

        // Определяем, увеличивается или уменьшается длина текста
        const newText = `Сегодня ${posylType}. ${currentDate}.${String(currentMonth).padStart(2, "0")}.${currentYear}`;
        const isTextLonger = newText.length > oldText.length;

        // Применяем нужную анимацию
        dateElement.classList.add(isTextLonger ? "date-expanding" : "date-shrinking");
        setTimeout(() => {
            dateElement.classList.remove("date-expanding", "date-shrinking");
        }, 500);

        updateDate(); // Обновляем текст и цвет
    } else {
        posylType = newPosylType;
        window.posylType = posylType;
        localStorage.setItem("posylType", posylType);
    }
    
    updateDisplay();
}

function formatText(text) {
    let result = "";
    let parts = text.split(/(\*[^*]+\*|#[^#]+#|\^)/);
    parts.forEach(part => {
        if (part.startsWith("*") && part.endsWith("*")) {
            result += `<span class="purple-bold">${part.slice(1, -1)}</span>`;
        } else if (part.startsWith("#") && part.endsWith("#")) {
            result += `<span class="bold-underlined">${part.slice(1, -1)}</span>`;
        } else if (part === "^") {
            result += "<br>";
        } else {
            result += `<span class="white-text">${part}</span>`;
        }
    });
    return result;
}

function updateImage(newSrc) {
    if (imageElement.src.endsWith(newSrc)) return;
    imageElement.classList.add("fade");
    setTimeout(() => {
        imageElement.src = newSrc;
        imageElement.classList.remove("fade");
    }, 250);
}

function getRandomImage(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomMusic(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function playMusic(sendStatus, intervalType, forceRestart = false) {
    const isMusicEnabled = localStorage.getItem("musicEnabled") !== "false";
    if (!isMusicEnabled || !hasUserInteracted) return;

    let newTrack;
    let targetVolume;
    if (sendStatus === "Вне Посыла") {
        newTrack = getRandomMusic(outsideMusic);
        targetVolume = window.outsideVolume;
    } else {
        newTrack = dailyPosylMusic; // Используем одну музыку для всех посылов
        targetVolume = window.posylVolume; // Единая громкость для посылов
    }

    const currentTime = window.currentHours * 3600 + window.currentMinutes * 60 + window.currentSeconds;
    const startTime = currentIntervalStart ? currentIntervalStart : currentTime;
    const elapsedTime = sendStatus === "В Посыле" ? currentTime - startTime : 0;

    if (forceRestart || newTrack !== currentTrack || audioElement.paused) {
        if (currentTrack && sendStatus === "В Посыле" && !audioElement.paused) {
            fadeOutMusic(() => {
                audioElement.src = newTrack.src;
                audioElement.currentTime = elapsedTime > 0 ? elapsedTime : 0;
                fadeInMusic(targetVolume);
            });
        } else {
            audioElement.src = newTrack.src;
            audioElement.currentTime = elapsedTime > 0 ? elapsedTime : 0;
            audioElement.volume = targetVolume;
            audioElement.play().catch(error => console.error("Ошибка воспроизведения:", error));
        }
        currentTrack = newTrack;
        songTitleElement.textContent = newTrack.title;
    }

    audioElement.onended = () => {
        if (sendStatus === "Вне Посыла") {
            playMusic("Вне Посыла", null);
        }
    };
}

function fadeOutMusic(callback) {
    let volume = audioElement.volume;
    const fadeOut = setInterval(() => {
        volume = Math.max(0, volume - 0.05);
        audioElement.volume = volume;
        if (volume <= 0) {
            clearInterval(fadeOut);
            audioElement.pause();
            callback();
        }
    }, 100);
}

function fadeInMusic(targetVolume) {
    let volume = 0;
    audioElement.volume = 0;
    audioElement.play();
    const fadeIn = setInterval(() => {
        volume = Math.min(targetVolume, volume + 0.05);
        audioElement.volume = volume;
        if (volume >= targetVolume) {
            clearInterval(fadeIn);
        }
    }, 100);
}

function setMusicToggleState(enabled, playOnToggle = true) {
    musicToggleButton.classList.toggle("active", enabled);
    musicToggleButton.classList.toggle("inactive", !enabled);
    localStorage.setItem("musicEnabled", enabled);
    if (!enabled) {
        audioElement.pause();
    } else if (playOnToggle && hasUserInteracted) {
        playMusic(sendStatus, null);
    }
}

function toggleMusic() {
    const isEnabled = localStorage.getItem("musicEnabled") !== "false";
    setMusicToggleState(!isEnabled);
}

function showSongTitle() {
    const isMusicEnabled = localStorage.getItem("musicEnabled") !== "false";
    if (currentTrack && isMusicEnabled) {
        songTitleElement.style.display = "block";
    }
}

function hideSongTitle() {
    songTitleElement.style.display = "none";
}

function updateDisplay() {
    if (!window.timeInitialized) {
        messageText.innerHTML = `<span class="countdown">Ожидание инициализации времени...</span>`;
        if (lastImageSrc !== outsidePosylImages[0]) {
            updateImage(outsidePosylImages[0]);
            lastImageSrc = outsidePosylImages[0];
        }
        document.body.classList.remove("in-posyl");
        document.body.classList.add("outside-posyl");
        progressLine.style.width = "0%";
        lastProgressPercentage = 0;
        flameVideo.style.display = "block";
        flameVideo.classList.toggle("visible", window.flameOutsidePosylEnabled);
        return;
    }

    const currentHour = window.currentHours;
    const currentMinute = window.currentMinutes;
    const currentSecond = window.currentSeconds;

    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const currentTotalSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

    let inPosyl = false;
    let sendText = "";
    let nextInterval = null;
    let hourlyPosyl = null;
    let dailyPosyl = null;

    const currentDateStr = String(new Date().getDate()).padStart(2, "0");

    if (jsonData.length === 0) {
        messageText.innerHTML = `<span class="countdown">Ошибка: данные не загружены</span>`;
        if (lastImageSrc !== outsidePosylImages[0]) {
            updateImage(outsidePosylImages[0]);
            lastImageSrc = outsidePosylImages[0];
        }
        document.body.classList.remove("in-posyl");
        document.body.classList.add("outside-posyl");
        progressLine.style.width = "0%";
        lastProgressPercentage = 0;
        flameVideo.style.display = "block";
        flameVideo.classList.toggle("visible", window.flameOutsidePosylEnabled);
        return;
    }

    jsonData.forEach(row => {
        const timeInterval = row["Время [мск]:"];
        if (timeInterval && typeof timeInterval === "string") {
            const normalizedInterval = timeInterval.replace(/\s*-\s*/, "-");
            if (normalizedInterval.includes("-")) {
                const [startTime, endTime] = normalizedInterval.split("-");
                const [startHour, startMinute] = startTime.split(":").map(Number);
                const [endHour, endMinute] = endTime.split(":").map(Number);

                if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return;

                const startTimeInMinutes = startHour * 60 + startMinute;
                const endTimeInMinutes = endHour * 60 + endMinute;

                if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
                    if (row["Тип:"] === "часовой посыл" && row["Дата [мск]:"].includes(currentDateStr)) {
                        hourlyPosyl = row;
                    } else if (row["Тип:"] === "ежедневный посыл") {
                        dailyPosyl = row;
                    }
                    if (!currentIntervalStart || currentIntervalStart !== startTimeInMinutes * 60) {
                        currentIntervalStart = startTimeInMinutes * 60;
                        hasBellPlayed = false;
                        hasIntervalEndPlayed = false; // Сбрасываем флаг уведомления при новом интервале
                    }
                } else {
                    // Проверяем, активен ли интервал для текущего дня
                    let isIntervalActiveToday = true;
                    if (row["Тип:"] === "часовой посыл") {
                        try {
                            const datesArray = JSON.parse(row["Дата [мск]:"]);
                            isIntervalActiveToday = Array.isArray(datesArray) && datesArray.includes(currentDateStr);
                        } catch (error) {
                            console.error("Ошибка парсинга даты:", error);
                            isIntervalActiveToday = false;
                        }
                    }

                    if (isIntervalActiveToday) {
                        let dayOffset = startTimeInMinutes > currentTimeInMinutes ? 0 : 1;
                        let nextTotalSeconds = ((startHour + dayOffset * 24) * 60 + startMinute) * 60;
                        if (!nextInterval || nextTotalSeconds < nextInterval.nextTotalSeconds) {
                            nextInterval = { startHour, startMinute, nextTotalSeconds, dayOffset };
                        }
                    }
                }
            }
        }
    });

    const messageContainer = document.querySelector(".message-container");

    if (hourlyPosyl || dailyPosyl) {
        inPosyl = true;
        sendText = hourlyPosyl ? hourlyPosyl["Текст:"] : dailyPosyl["Текст:"];
        const imageSrc = hourlyPosyl ? hourlyPosylImage : dailyPosylImage;
        if (lastImageSrc !== imageSrc) {
            updateImage(imageSrc);
            lastImageSrc = imageSrc;
        }

        const startTimeInSeconds = currentIntervalStart;
        const activePosyl = hourlyPosyl || dailyPosyl;
        const [endHour, endMinute] = activePosyl["Время [мск]:"].split("-")[1].split(":").map(Number);
        let endTimeInSeconds = (endHour * 3600 + endMinute * 60) + 59;
        if (endTimeInSeconds < startTimeInSeconds) {
            endTimeInSeconds += 24 * 3600;
        }
        const totalDuration = endTimeInSeconds - startTimeInSeconds;
        const elapsedTime = currentTotalSeconds - startTimeInSeconds;
        const remainingTime = endTimeInSeconds - currentTotalSeconds;
        const progressPercentage = Math.min((elapsedTime / totalDuration) * 100, 100);

        

        // Уведомление за 17 секунд
        // Уведомление за 17 секунд
if (remainingTime <= 17 && remainingTime >= 16 && !hasIntervalEndPlayed && window.intervalEndVolume > 0) {
    // Создаем новый экземпляр аудио для уведомления, чтобы не прерывать музыку
    const notificationSound = new Audio(intervalEndSound.src);
    notificationSound.volume = window.intervalEndVolume;
    notificationSound.play().catch(error => console.error("Ошибка воспроизведения звука окончания интервала:", error));
    hasIntervalEndPlayed = true;
}

        if (Math.abs(progressPercentage - lastProgressPercentage) > 0.1) {
            progressLine.style.width = `${progressPercentage}%`;
            lastProgressPercentage = progressPercentage;
        }

        window.updateFlameVisibility();
    } else {
        if (wasInPosyl) {
            const randomImage = getRandomImage(outsidePosylImages);
            if (lastImageSrc !== randomImage) {
                updateImage(randomImage);
                lastImageSrc = randomImage;
            }
        } else if (!lastImageSrc) {
            const randomImage = getRandomImage(outsidePosylImages);
            updateImage(randomImage);
            lastImageSrc = randomImage;
        }
        hasIntervalEndPlayed = false;
        currentIntervalStart = null;
        progressLine.style.width = "0%";
        lastProgressPercentage = 0;
        window.updateFlameVisibility();
    }

    

    // Определяем необходимость прокрутки при смене состояния
    let shouldTriggerScrollTrick = false;
    if (inPosyl && sendStatus !== "В Посыле") {
        shouldTriggerScrollTrick = true; // Переход из "Вне Посыла" в "В Посыле"
    } else if (!inPosyl && sendStatus === "В Посыле") {
        shouldTriggerScrollTrick = true; // Переход из "В Посыле" в "Вне Посыла"
    }

    if (inPosyl) {
        const intervalType = hourlyPosyl ? "часовой посыл" : "ежедневный посыл";
        const isNewInterval = currentIntervalStart !== window.lastIntervalStart;
        if (sendStatus !== "В Посыле" || isNewInterval) {
            playMusic("В Посыле", intervalType, isNewInterval);
            const elapsedTime = currentTotalSeconds - currentIntervalStart;
            if (window.bellEnabled && elapsedTime === 0 && !hasBellPlayed) {
                bellAudio.volume = window.bellVolume;
                bellAudio.play();
                hasBellPlayed = true;
            }
        } else if (currentTotalSeconds - currentIntervalStart > 0) {
            hasBellPlayed = false;
        }
        sendStatus = "В Посыле";
        messageText.innerHTML = formatText(sendText);
        wasInPosyl = true;
        document.body.classList.remove("outside-posyl");
        document.body.classList.add("in-posyl");
    } else {
        if (sendStatus !== "Вне Посыла") {
            playMusic("Вне Посыла", null);
            hasBellPlayed = false;
        }
        sendStatus = "Вне Посыла";
        wasInPosyl = false;
        if (nextInterval && !isNaN(nextInterval.nextTotalSeconds)) {
            let nextTotalSeconds = nextInterval.nextTotalSeconds;
            if (nextTotalSeconds < currentTotalSeconds) nextTotalSeconds += 24 * 3600;
            let diffSeconds = nextTotalSeconds - currentTotalSeconds;
            if (isNaN(diffSeconds)) {
                messageText.innerHTML = `<span class="countdown">Ошибка в вычислении времени</span>`;
            } else {
                let hours = Math.floor(diffSeconds / 3600);
                let minutes = Math.floor((diffSeconds % 3600) / 60);
                let seconds = diffSeconds % 60;
                messageText.innerHTML = `<span class="countdown">До начала подготовки к следующему Посылу: ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}</span>`;
            }
        } else {
            messageText.innerHTML = `<span class="countdown">Все посылы на сегодня завершены</span>`;
        }
        document.body.classList.remove("in-posyl");
        document.body.classList.add("outside-posyl");
    }

    // Выполняем трюк с прокруткой на 1 пиксель при смене состояния
    // Выполняем трюк с прокруткой на 1 пиксель при смене состояния
if (shouldTriggerScrollTrick && messageContainer) {
    // Плавно прокручиваем в начало
    messageContainer.scrollTo({ top: 0, behavior: "smooth" });

    // Ждем завершения анимации (увеличиваем время до 600 мс для мобильных)
    setTimeout(() => {
        // Проверяем, действительно ли прокрутка дошла до верха
        if (messageContainer.scrollTop !== 0) {
            messageContainer.scrollTop = 0; // Принудительно устанавливаем в начало
        }

        // Выполняем трюк с +1 и -1 пикселем для свечи
        messageContainer.scrollTop += 1;
        setTimeout(() => {
            messageContainer.scrollTop -= 1;
            if (typeof updateFlameOpacity === "function") {
                updateFlameOpacity(); // Обновляем прозрачность свечи
            }
        }, 100);
    }, 500); // Увеличиваем задержку для надежности на смартфонах
}

    const dateElement = document.getElementById("date");
    
    // Обновление класса для date в зависимости от posylType
    if (posylType === "Ежедневные + часовой Посыл") {
        dateElement.classList.remove("posyl-type-white");
        dateElement.classList.add("posyl-type-gold");
    } else {
        dateElement.classList.remove("posyl-type-gold");
        dateElement.classList.add("posyl-type-white");
    }

    // После всех обновлений текста вызываем настройку размера
    adjustMessageTextSize();

    // Сохраняем текущий интервал для следующей проверки
    window.lastIntervalStart = currentIntervalStart;
}

// Новая функция для настройки размера текста
function adjustMessageTextSize() {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const messageContainer = document.querySelector(".message-container");

    if (isPortrait) {
        // Мобильная версия (вертикальная ориентация)
        messageContainer.style.fontSize = `${window.mobileFontSize}px`;
    } else {
        // Десктопная версия (без ориентации или landscape)
        messageContainer.style.fontSize = `${window.desktopFontSize}px`;
    }
}

// Новая функция для проверки типа посыла и обновления цвета
function checkPosylTypeAndUpdate() {
    const dateElement = document.getElementById("date");
    if (!dateElement) return;

    if (window.posylType === "Ежедневные + часовой Посыл") {
        if (!dateElement.classList.contains("posyl-type-gold")) {
            dateElement.classList.remove("posyl-type-white");
            dateElement.classList.add("posyl-type-gold");
            dateElement.classList.add("date-updating");
            setTimeout(() => {
                dateElement.classList.remove("date-updating");
            }, 500);
        }
    } else {
        if (!dateElement.classList.contains("posyl-type-white")) {
            dateElement.classList.remove("posyl-type-gold");
            dateElement.classList.add("posyl-type-white");
            dateElement.classList.add("date-updating");
            setTimeout(() => {
                dateElement.classList.remove("date-updating");
            }, 500);
        }
    }
}

async function checkContentChange() {
    const response = await fetch('data-message.xlsx', { cache: "no-store" });
    const arrayBuffer = await response.arrayBuffer();
    const textDecoder = new TextDecoder("utf-8");
    const contentString = textDecoder.decode(arrayBuffer);
    const newContentHash = computeHash(contentString);
    if (newContentHash !== lastContentHash) await fetchExcelFile();
}



function waitForTime() {
    if (window.timeInitialized) {
        setInterval(updateDisplay, 500);
        setInterval(checkCache, 10000);
        setInterval(() => {
            if (sendStatus === "Вне Посыла") {
                const randomImage = getRandomImage(outsidePosylImages);
                if (lastImageSrc !== randomImage) {
                    updateImage(randomImage);
                    lastImageSrc = randomImage;
                }
            }
        }, 300000);
    } else {
        setTimeout(waitForTime, 100);
    }
}