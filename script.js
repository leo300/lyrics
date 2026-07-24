/* =========================================
   SCRIPT.JS
========================================= */
const API = "https://lrclib.net/api";
const artistInput = document.getElementById("artistInput");
const searchBtn = document.getElementById("searchBtn");
const songsContainer = document.getElementById("songsContainer");
const template = document.getElementById("songTemplate");
const statusArea = document.getElementById("statusArea");
const themeToggle = document.getElementById("themeToggle");
let searchTimer;
let currentSongs = [];
/* =========================
   INITIAL LOAD
========================= */
document.addEventListener("DOMContentLoaded",
    () => {
        loadTheme();
        loadHistory();
    });
/* =========================
   SEARCH EVENTS
========================= */
searchBtn.addEventListener("click",
    () => {
        const artist = artistInput.value.trim();
        if (artist) {
            searchArtist(artist);
        }
    });
artistInput.addEventListener("keyup",
    (e) => {
        if (e.key === "Enter") {
            searchBtn.click();
        }
    });
/* =========================
 DEBOUNCE SEARCH
========================= */
artistInput.addEventListener("input",
    () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const value = artistInput.value.trim();
            if (value.length > 2) {
                searchArtist(value);
            }
        }, 700);
    });
/* =========================
 SEARCH ARTIST
========================= */
async function searchArtist(artist) {
    showLoading();
    saveHistory(artist);
    try {
        const url = `${API}/search?q=${encodeURIComponent(artist)}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Search failed");
        }
        const songs = await response.json();
        currentSongs = songs;
        renderSongs(songs);
    } catch (error) {
        showError("Unable to load songs. Try again.");
    }
}
/* =========================
 RENDER SONGS
========================= */
function renderSongs(songs) {
    songsContainer.innerHTML = "";
    if (!songs.length) {
        songsContainer.innerHTML = `

<div class="empty-state">

<h2>No Songs Found</h2>

<p>Try another artist</p>

</div>

`;
        return;
    }
    songs.forEach(
        (song, index) => {
            const card = template.content.cloneNode(true);
            const box = card.querySelector(".song-card");
            const title = card.querySelector(".song-title");
            const album = card.querySelector(".song-album");
            const badge = card.querySelector(".badge");
            title.textContent = song.trackName || "Unknown";
            album.textContent = song.albumName || "Unknown Album";
            badge.textContent = song.syncedLyrics ? "SYNCED" : "LYRICS";
            box.style.animationDelay = `${index*0.05}s`;
            setupSongCard(box, song);
            songsContainer.appendChild(card);
        });
}
/* =========================
 SONG CARD LOGIC
========================= */
function setupSongCard(card, song) {
    card.addEventListener("click", async () => {
        const opened = card.classList.contains("active");
        document.querySelectorAll(".song-card.active").forEach(item => {
            item.classList.remove("active");
        });
        if (opened) return;
        card.classList.add("active");
        const lyrics = card.querySelector(".lyrics");
        const artist = card.querySelector(".artist");
        const album = card.querySelector(".album");
        const duration = card.querySelector(".duration");
        artist.textContent = song.artistName || "-";
        album.textContent = song.albumName || "-";
        duration.textContent = formatDuration(song.duration);
        lyrics.textContent = "Loading lyrics...";
        const data = await getLyrics(song);
        lyrics.textContent = data || "No lyrics available";
    });
}
/* =========================
 FETCH LYRICS
========================= */
async function getLyrics(song) {
    const cacheKey = "lyrics_" + song.id;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(`${API}/get/${song.id}`);
        const data = await response.json();
        let lyrics = data.syncedLyrics || data.plainLyrics;
        if (!lyrics) {
            lyrics = "No lyrics found";
        }
        localStorage.setItem(cacheKey, lyrics);
        return lyrics;
    } catch {
        return "Lyrics unavailable";
    }
}
/* =========================
 COPY LYRICS
========================= */
document.addEventListener("click",
    (e) => {
        if (e.target.classList.contains("copy")) {
            const lyrics = e.target.closest(".song-card").querySelector(".lyrics").textContent;
            navigator.clipboard.writeText(lyrics);
            e.target.textContent = "Copied ✓";
            setTimeout(() => {
                e.target.textContent = "Copy";
            }, 2000);
        }
    });
/* =========================
 DOWNLOAD LYRICS
========================= */
document.addEventListener("click",
    (e) => {
        if (e.target.classList.contains("download")) {
            const lyrics = e.target.closest(".song-card").querySelector(".lyrics").textContent;
            const blob = new Blob(
                [lyrics], {
                    type: "text/plain"
                });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "lyrics.txt";
            a.click();
            URL.revokeObjectURL(url);
        }
    });
/* =========================
 LOADING UI
========================= */
function showLoading() {
    songsContainer.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        songsContainer.innerHTML += `

<div class="song-card glass skeleton"
style="height:90px">

</div>

`;
    }
}
/* =========================
 ERROR UI
========================= */
function showError(message) {
    songsContainer.innerHTML = `

<div class="empty-state">

<h2>⚠️ Error</h2>

<p>${message}</p>

</div>

`;
}
/* =========================
 DARK MODE
========================= */
themeToggle.onclick = () => {
    document.body.classList.toggle("light");
    const mode = document.body.classList.contains("light") ? "light" : "dark";
    localStorage.setItem("theme", mode);
    themeToggle.textContent = mode === "light" ? "☀️" : "🌙";
};

function loadTheme() {
    const theme = localStorage.getItem("theme");
    if (theme === "light") {
        document.body.classList.add("light");
        themeToggle.textContent = "☀️";
    }
}
/* =========================
 SEARCH HISTORY
========================= */
function saveHistory(value) {
    let history = JSON.parse(localStorage.getItem("history") || "[]");
    history = [
        value, ...history.filter(x => x !== value)
    ].slice(0, 10);
    localStorage.setItem("history", JSON.stringify(history));
}

function loadHistory() {}
/* =========================
 RIPPLE EFFECT
========================= */
document.addEventListener("click", function(e) {
    const button = e.target.closest(".ripple");
    if (!button) return;
    const circle = document.createElement("span");
    circle.className = "ripple-effect";
    const rect = button.getBoundingClientRect();
    circle.style.left = `${e.clientX-rect.left}px`;
    circle.style.top = `${e.clientY-rect.top}px`;
    button.appendChild(circle);
    setTimeout(
        () => circle.remove(), 600);
});
/* =========================
 HELPERS
========================= */
function formatDuration(sec) {
    if (!sec) return "-";
    const min = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${min}:${seconds}`;
}
