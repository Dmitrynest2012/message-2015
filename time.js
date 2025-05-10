const clockElement = document.getElementById("clock");
const dateElement = document.getElementById("date");

if (!clockElement || !dateElement) {
    // Логирование удалено
}

let currentHours = 0;
let currentMinutes = 0;
let currentSeconds = 0;
let currentDay = 0;
let currentMonth = 0;
let currentYear = 0;
let timeInitialized = false;

// Список API для получения времени
const timeAPIs = [
    "https://worldtimeapi.org/api/timezone/Etc/UTC",
    "https://timeapi.io/api/Time/current/zone?timeZone=Etc/UTC",
    "http://worldclockapi.com/api/json/utc/now"
];

async function fetchTimeFromAPI() {
    for (const api of timeAPIs) {
        try {
            const response = await fetch(api);
            if (!response.ok) {
                if (response.status === 429) {
                    // Логирование удалено
                }
                throw new Error(`HTTP error ${response.status} from ${api}`);
            }
            const data = await response.json();
            let utcTime;

            // Обработка данных в зависимости от API
            if (api.includes("worldtimeapi.org")) {
                if (data.datetime) {
                    utcTime = new Date(data.datetime);
                }
            } else if (api.includes("timeapi.io")) {
                if (data.dateTime) {
                    utcTime = new Date(data.dateTime);
                }
            } else if (api.includes("worldclockapi.com")) {
                if (data.currentDateTime) {
                    utcTime = new Date(data.currentDateTime);
                }
            }

            if (utcTime) {
                const moscowTime = new Date(utcTime.getTime() + 3 * 3600000);
                updateGlobalTime(moscowTime);
                return; // Успешно получили время, выходим
            }
        } catch (error) {
            // Логирование удалено
            continue; // Пробуем следующий API
        }
    }
    // Если ни один API не сработал, используем локальное время
    useLocalUTC();
}

function useLocalUTC() {
    const utcTime = new Date();
    const moscowTime = new Date(utcTime.getTime() + 3 * 3600000);
    updateGlobalTime(moscowTime);
}

function updateGlobalTime(time) {
    currentHours = time.getUTCHours();
    currentMinutes = time.getUTCMinutes();
    currentSeconds = time.getUTCSeconds();
    currentDay = time.getUTCDate();
    currentMonth = time.getUTCMonth() + 1;
    currentYear = time.getUTCFullYear();
    // Форматируем текущий день по Москве как двухзначную строку
    window.currentDateStr = String(currentDay).padStart(2, "0");
    updateClock();
    updateDate();
    timeInitialized = true;
    window.currentHours = currentHours;
    window.currentMinutes = currentMinutes;
    window.currentSeconds = currentSeconds;
    window.timeInitialized = timeInitialized;
}

function updateClock() {
    const hours = String(currentHours).padStart(2, "0");
    const minutes = String(currentMinutes).padStart(2, "0");
    const seconds = String(currentSeconds).padStart(2, "0");
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

function updateDate() {
    const day = String(currentDay).padStart(2, "0");
    const month = String(currentMonth).padStart(2, "0");
    const year = currentYear;
    const newText = `Сегодня ${window.posylType || "Ежедневные Посылы"}. ${day}.${month}.${year}`;
    
    const dateElement = document.getElementById("date");
    if (dateElement.textContent !== newText) {
        const oldText = dateElement.textContent;
        const isTextLonger = newText.length > oldText.length;

        dateElement.classList.add(isTextLonger ? "date-expanding" : "date-shrinking");
        dateElement.textContent = newText;
        setTimeout(() => {
            dateElement.classList.remove("date-expanding", "date-shrinking");
        }, 500);
    }
    
    if (window.posylType === "Ежедневные + часовой Посыл") {
        dateElement.classList.remove("posyl-type-white");
        dateElement.classList.add("posyl-type-gold");
    } else {
        dateElement.classList.remove("posyl-type-gold");
        dateElement.classList.add("posyl-type-white");
    }
}

function incrementTime() {
    currentSeconds++;
    if (currentSeconds === 60) {
        currentSeconds = 0;
        currentMinutes++;
    }
    if (currentMinutes === 60) {
        currentMinutes = 0;
        currentHours = (currentHours + 1) % 24;
    }
    if (currentHours === 0 && currentMinutes === 0 && currentSeconds === 0) {
        const newDate = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay) + 86400000);
        currentDay = newDate.getUTCDate();
        currentMonth = newDate.getUTCMonth() + 1;
        currentYear = newDate.getUTCFullYear();
        updateDate();
    }
    updateClock();
    window.currentHours = currentHours;
    window.currentMinutes = currentMinutes;
    window.currentSeconds = currentSeconds;
}

// Инициализируем локальное время сразу
useLocalUTC();
fetchTimeFromAPI();
setInterval(incrementTime, 1000);
setInterval(fetchTimeFromAPI, 15000);