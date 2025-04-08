const outsidePosylImages = [
    "img/message-random-1.jpg",
    "img/message-random-2.jpg",
    "img/message-random-3.jpg",
    "img/message-random-4.jpg",
    "img/message-random-5.jpg",
    "img/message-random-6.jpg",
    "img/message-random-7.jpg",
    "img/message-random-8.jpg",
    "img/message-random-9.jpg",
    "img/message-random-10.jpg",
];
const dailyPosylImage = "img/message-base-1.png";
const hourlyPosylImage = "img/message-base-2.png";

const outsideMusic = [
    { src: "music/infinitely.mp3", title: "infinitely (Artist 1)" },
    { src: "music/Ithilien.mp3", title: "Ithilien (Artist 2)" },
    { src: "music/MANTRA.mp3", title: "MANTRA (Artist 3)" }
    // Добавьте больше песен по необходимости
];
const dailyPosylMusic = { src: "music/Bolero.mp3", title: "Daily Posyl (Daily Artist)" };
const hourlyPosylMusic = { src: "music/Rachmaninov.mp3", title: "Piano Concerto No. 2 in C Minor, Op. 18: II. Adagio sostenuto от Lang Lang. (Валерий Гергиев и Симфонический оркестр Мариинского театра)" };
const bellSound = { src: "sound_of_a_bell.mp3" }; // Добавляем звук колокола
const notificationSound = { src: "sound_of_notification.mp3" }; // Предполагается, что файл существует

// Глобальные переменные громкости с дефолтными значениями
window.defaultOutsideVolume = 0.25;
window.defaultPosylVolume = 1.0;
window.outsideVolume = localStorage.getItem("outsideVolume") !== null ? parseFloat(localStorage.getItem("outsideVolume")) : window.defaultOutsideVolume;
window.dailyVolume = localStorage.getItem("dailyVolume") !== null ? parseFloat(localStorage.getItem("dailyVolume")) : window.defaultPosylVolume;
window.hourlyVolume = localStorage.getItem("hourlyVolume") !== null ? parseFloat(localStorage.getItem("hourlyVolume")) : window.defaultPosylVolume;

// Глобальные переменные для колокола
window.defaultBellVolume = 0.5;
window.bellEnabled = localStorage.getItem("bellEnabled") === "true"; // true или false
window.bellVolume = localStorage.getItem("bellVolume") !== null ? parseFloat(localStorage.getItem("bellVolume")) : window.defaultBellVolume;
