console.log("Lets write JavaScript");

let currentSong = new Audio();
let songs;
let currfolder;

function secondsToMinutesSecond(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "Invalid input";
    }

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currfolder = folder;
    let a = await fetch(`http://127.0.0.1:5500/${folder}`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let songsList = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songsList.push(element.href.split(`/${folder}/`)[1]);
        }
    }
    songs = songsList;
    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5500/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    Array.from(anchors).forEach(async e => {
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
           let folder = e.getAttribute("href").split("/").filter(Boolean).pop();



            try {
                let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                let response = await a.json();

                cardContainer.innerHTML += `
                <div class="card" data-folder="songs/${folder}">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${response.title}</h2>
                    <p>${response.description}</p>
                </div>`;
            } catch (err) {
                console.error(`Error loading info.json for folder ${folder}:`, err);
            }
        }
    });

    document.addEventListener("click", async e => {
        if (e.target.closest(".card")) {
            let folder = e.target.closest(".card").dataset.folder;
            songs = await getSongs(folder);
            updateSongListUI(songs);
            playMusic(songs[0]);
        }
    });
}

function updateSongListUI(songs) {
    let songUl = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUl.innerHTML = "";
    for (const song of songs) {
        songUl.innerHTML += `
        <li><img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div class="artist">Artist: Ziyad Khan</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div> </li>`;
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
}

async function main() {
    const play = document.getElementById("play");
    const prev = document.getElementById("prev");
    const next = document.getElementById("next");

    songs = await getSongs("songs/ncs");
    updateSongListUI(songs);
    playMusic(songs[0], true);

    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSecond(currentSong.currentTime)}:${secondsToMinutesSecond(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    prev.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(currentTrack);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(currentTrack);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    currentSong.addEventListener("ended", () => {
        let currentTrack = currentSong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(currentTrack);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    const volumeSlider = document.getElementById("volumeSlider");
    const volumeIcon = document.querySelector(".volume>img");

    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            currentSong.volume = parseFloat(volumeSlider.value);
            if (currentSong.volume > 0 && volumeIcon) {
                volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
            }
        });
    }

    if (volumeIcon) {
        volumeIcon.addEventListener("click", () => {
            if (volumeIcon.src.includes("volume.svg")) {
                volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                if (volumeSlider) volumeSlider.value = 0;
            } else {
                volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                currentSong.volume = 0.1;
                if (volumeSlider) volumeSlider.value = 0.1;
            }
        });
    }
}


main();
