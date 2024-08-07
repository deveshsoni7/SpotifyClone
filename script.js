let currentsong = new Audio();
let songs = [];
let currfolder;

function mintosec(seconds) {
  var minutes = Math.floor(seconds / 60);
  var remainingSeconds = Math.floor(seconds % 60);
  var formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  var formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
  return formattedMinutes + ':' + formattedSeconds;
}

const pl = () => {
  if (currentsong.paused) {
    currentsong.play();
    document.getElementById("play").src = "pause.svg";
  } else {
    currentsong.pause();
    document.getElementById("play").src = "play.svg";
  }
};

async function getsongs(folder) {
  currfolder = folder;
  try {
    let response = await fetch(`/${folder}/`);
    let text = await response.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let element of as) {
      if (element.href.endsWith(".mp3")) {
        songs.push(element.href.split(`/${folder}/`)[1]);
      }
    }
  } catch (error) {
    console.error('Error fetching songs:', error);
  }
  return songs;
}

const playMusic = (track, pause = false) => {
  currentsong.src = `/${currfolder}/` + track;
  if (!pause) {
    currentsong.play();
    document.getElementById("play").src = "pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = track.replace(/%20/g, " ").replace(".mp3", " ");
  document.querySelector(".songtime").innerHTML = "00:00/00:00";

};

async function displayAlbums() {
  let response = await fetch(`/songs/`);
  let text = await response.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");
  let cardcontainer = document.querySelector(".cardcontainer");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
      let folder = e.href.split("/").slice(-2)[1];
      try {
        let response = await fetch(`/songs/${folder}/info.json`);
        let metadata = await response.json();
        cardcontainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100" height="100">
                <defs>
                  <clipPath id="circleClip">
                    <circle cx="12" cy="12" r="12" />
                  </clipPath>
                </defs>
                <rect width="100%" height="100%" fill="green" clip-path="url(#circleClip)" />
                <filter id="invert">
                  <feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1
                                    0 -1 0 0 1
                                    0 0 -1 0 1
                                    0 0 0 1 0" />
                </filter>
                <g filter="url(#invert)">
                  <path
                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                    stroke="none" />
                </g>
              </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="">
            <h3>${metadata.title}</h3>
            <p>${metadata.des}</p>
          </div>`;
      } catch (error) {
        console.error(`Error fetching metadata for folder ${folder}:`, error);
      }
    }
  }

  document.querySelectorAll(".card").forEach(e => {
    e.addEventListener("click", async event => {
      const folder = event.currentTarget.dataset.folder;
      if (!folder) {
        console.error('No data-folder attribute found on this card.');
        return;
      }
      try {
        songs = await getsongs(`songs/${folder}`);
        displaySongsInLibrary(songs);
        playMusic(songs[0]);
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    });
  });
}

async function main() {
  songs = await getsongs("songs/Devesh");
  playMusic(songs[0], true);
  displayAlbums();

  document.getElementById("play").addEventListener("click", pl);

  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${mintosec(currentsong.currentTime)}/${mintosec(currentsong.duration)}`;
    document.querySelector(".circle").style.left = ((currentsong.currentTime / currentsong.duration) * 100) + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let per = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = per + "%";
    currentsong.currentTime = (currentsong.duration * per) / 100;
  });

  currentsong.addEventListener("ended", () => {
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]);
    }
  });

  document.querySelector(".ham").addEventListener("click", () => {
    let leftDiv = document.querySelector(".left");
    leftDiv.style.left = leftDiv.style.left === "0%" ? "100%" : "0%";
  });

  document.querySelector(".cross").addEventListener("click", () => {
    let leftDiv = document.querySelector(".left");
    leftDiv.style.left = leftDiv.style.left === "-100%" ? "0%" : "-100%";
  });

  document.getElementById("pre").addEventListener("click", () => {
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });
  document.getElementById("next").addEventListener("click", () => {
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index + 1 <= songs.length - 1) {
      playMusic(songs[index + 1]);
    }
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    currentsong.volume = parseInt(e.target.value) / 100;
  });

  document.querySelector(".vol>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = "mute.svg";
      currentsong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    } else {
      e.target.src = "volume.svg";
      currentsong.volume = .1;
      document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }
  });

  document.querySelector(".playbar .cross").addEventListener("click", () => {
    let bot = document.querySelector(".playbar");
    if (bot.style.bottom === "-10%") {
      bot.style.bottom = "45px";
      document.querySelector(".playbar .cross").src = "croxx.svg";
    } else {
      bot.style.bottom = "-10%";
      document.querySelector(".playbar .cross").src = "up.svg";
    }
  });
}

function displaySongsInLibrary(songs) {
  let songUl = document.querySelector(".songlist ul");
  songUl.innerHTML = "";
  for (const song of songs) {
    songUl.innerHTML += `
      <li>
        <img src="music.svg" alt="">
        <div class="info">
          <div class="songname">${song.replace(/%20/g, " ")}</div>
          <div class="songartist"></div>
        </div>
        <div class="playnow">
          <img src="play.svg" alt="">
        </div>
      </li>`;
  }

  document.querySelectorAll(".songlist li").forEach((e) => {
    e.addEventListener("click", () => {
      let songName = e.querySelector(".info .songname").innerHTML.trim();
      playMusic(songName);
    });
  });
}

main();
