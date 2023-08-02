import "./Anomia.css";
import Square from "./Square";
import { useState, useEffect } from "react";
import Scoreboard from "./Scoreboard";
import flipcard from "./assets/audio/flipcard.mp3";
import correct from "./assets/audio/correct.wav";
import incorrect from "./assets/audio/incorrect.wav";
import usedword from "./assets/audio/usedword.mp3";
import faceoffsound1 from "./assets/audio/faceoffsound1.mp3";
import faceoffsound2 from "./assets/audio/faceoffsound2.mp3";
import faceoffsound3 from "./assets/audio/faceoffsound3.mp3";
import faceoffsound4 from "./assets/audio/faceoffsound4.mp3";
import EndScreen from "./EndScreen";
import Dictionary from "./Dictionary";

const Anomia = ({ socket, username, room, users, setShowLobby, setShowGame }) => {
  const MOVIESANDTV_DB = "https://www.omdbapi.com/?t="; // 1000 per day, need key
  const MOVIESANDTV_APIKEY = "&apikey=b0022818";
  const POKEMON_DB = "https://pokeapi.co/api/v2/pokemon/?limit=9999"; // FREE TO PUBLIC
  const POKEMON_DB_IMGS =
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"; // FREE TO PUBLIC
  const SONGS_DB = "https://deezerdevs-deezer.p.rapidapi.com/search?q="; // no pricing, need key
  const CARS_DB = "https://api.api-ninjas.com/v1/cars?make="; // 50,000 a month (api ninja)
  const COUNTRIES_DB = "https://restcountries.com/v3.1/all?fields=name,flags"; // FREE TO PUBLIC
  const BOOKS_DB = "https://www.googleapis.com/books/v1/volumes?q="; // FREE TO PUBLIC
  const LEAGUE_DB = "https://ddragon.leagueoflegends.com/cdn/13.6.1/data/en_US/champion.json"; // FREE TO PUBLIC
  const LEAGUE_DB_IMGS = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/";

  const VIDEOGAMES_DB =
    "https://api.rawg.io/api/games?key=f2f0e308394b42c887a93d0c0276f6c2&search="; // 20,000 per month, need key
  const HISTORICAL_FIGURES_DB = "https://api.api-ninjas.com/v1/historicalfigures?name="; // 50,000 a month (api ninja)

  const [state, setState] = useState({
    square: [],
  });
  const [players, setPlayers] = useState([]);
  const [roomState, setRoomState] = useState({
    room: 0,
    inProgress: false,
    numPlayers: 0,
    _turn: 0,
    currentTurn: 0,
    faceoff: false,
    faceoffPeople: [],
    cardsLeft: 0,
    usedWords: [],
  });
  const [currentFaceoffInput, setCurrentFaceoffInput] = useState("");
  const [disableInput, setDisableInput] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [num, setNum] = useState(users.length); //Number of Square to be generate
  const [dictionaryUser, setDictionaryUser] = useState("");
  const [dictionaryCategory, setDictionaryCategory] = useState("");
  const [dictionaryImg, setDictionaryImg] = useState("");
  const [showInvalidWordMsg, setShowInvalidWordMsg] = useState(false);
  const [invalidWordMsg, setInvalidWordMsg] = useState("");

  function playIncorrectSound() {
    let audio = new Audio(incorrect);
    audio.volume = 0.15;
    audio.play();
  }
  function playUsedWordSound() {
    let audio = new Audio(usedword);
    audio.volume = 0.15;
    audio.play();
  }

  function playFaceoffSound() {
    const FACEOFFSOUNDS = [faceoffsound1, faceoffsound2, faceoffsound3, faceoffsound4];
    let audio = new Audio(FACEOFFSOUNDS[Math.floor(Math.random() * 4)]);
    audio.volume = 0.15;
    audio.play();
  }

  function playFlipCardSound() {
    let audio = new Audio(flipcard);
    audio.volume = 0.15;
    audio.play();
  }
  function playCorrectSound() {
    let audio = new Audio(correct);
    audio.volume = 0.15;
    audio.play();
  }

  const sendFaceoffInput = async () => {
    if (disableInput || currentFaceoffInput === "") return;
    if (!roomState.faceoff) return;
    setDisableInput(true);
    let validInput = false;
    let dictCat = "";
    let dictImg = "";
    let category = players.find((p) => p.inFaceoff && p.username !== username).deck.at(-1).category;
    // let category = 3;
    if (roomState.usedWords.includes(currentFaceoffInput.toLowerCase())) {
      playUsedWordSound();
      setShowInvalidWordMsg(true);
      setInvalidWordMsg("Duplicate word!");
    } else {
      switch (category) {
        case 0:
          await fetch(`${MOVIESANDTV_DB}` + currentFaceoffInput + `${MOVIESANDTV_APIKEY}`)
            .then((res) => res.json())
            .then((json) => {
              if (json.Response === "True" && json.Type === "movie") {
                validInput = true;
                dictCat = `${json.Title} - ${json.Year}`;
                dictImg = json.Poster;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        //TODO validate input is tv show type
        case 1:
          await fetch(`${MOVIESANDTV_DB}` + currentFaceoffInput + `${MOVIESANDTV_APIKEY}`)
            .then((res) => res.json())
            .then((json) => {
              if (json.Response === "True" && json.Type === "series") {
                dictCat = `${json.Title} - ${json.Year}`;
                dictImg = json.Poster;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        //TODO implement pokemon category
        case 2:
          await fetch(`${POKEMON_DB}`)
            .then((res) => res.json())
            .then((json) => {
              const pokemonName = json.results.find(
                (pokemon) => pokemon.name.toLowerCase() === currentFaceoffInput.toLowerCase()
              );
              if (pokemonName) {
                dictCat = pokemonName.name;
                dictImg =
                  POKEMON_DB_IMGS +
                  pokemonName.url.substring(34, pokemonName.url.length - 1) +
                  ".png";
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 3:
          await fetch(SONGS_DB + currentFaceoffInput, {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": "e15a3578aemshfc8ff97c4a6af8ap17f164jsn84d74d0b4b62",
              "X-RapidAPI-Host": "deezerdevs-deezer.p.rapidapi.com",
            },
          })
            .then((res) => res.json())
            .then((json) => {
              const songName = json.data.find(
                (s) => s.title.toLowerCase() === currentFaceoffInput.toLowerCase()
              );
              if (json.data.length !== 0 && songName) {
                dictCat = `${songName.title} - ${songName.artist.name}`;
                dictImg = songName.album.cover;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 4:
          await fetch(CARS_DB + currentFaceoffInput.replace(/\s+/g, "-"), {
            method: "GET",
            headers: {
              "X-Api-Key": "mfdXq8CkXP8k8dbb1O+JMg==LNXBEpjRU3XcU4I7",
            },
          })
            .then((res) => res.json())
            .then((json) => {
              if (
                json.length === 0 ||
                json[0].make.toLowerCase() !==
                  currentFaceoffInput.replace(/\s+/g, "-").toLowerCase()
              ) {
                playIncorrectSound();
                validInput = false;
              } else {
                dictCat = `${json[0].make}`;
                dictImg = "";
                validInput = true;
              }
            });
          break;
        case 5:
          await fetch(`${MOVIESANDTV_DB}` + currentFaceoffInput + `${MOVIESANDTV_APIKEY}`)
            .then((res) => res.json())
            .then((json) => {
              if (
                json.Response === "True" &&
                json.Country === "Japan" &&
                json.Genre.includes("Animation")
              ) {
                dictCat = `${json.Title} - ${json.Year}`;
                dictImg = json.Poster;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 6:
          await fetch(`${COUNTRIES_DB}`)
            .then((res) => res.json())
            .then((json) => {
              const c = json.find(
                (country) => country.name.common.toLowerCase() === currentFaceoffInput.toLowerCase()
              );
              if (c) {
                dictCat = c.name.common;
                dictImg = c.flags.png;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 7:
          await fetch(`${BOOKS_DB}` + currentFaceoffInput + '"')
            .then((res) => res.json())
            .then((json) => {
              if (
                json.totalItems !== 0 &&
                json.items.find(
                  (book) =>
                    book.volumeInfo.title.toLowerCase() === currentFaceoffInput.toLowerCase()
                )
              ) {
                const b = json.items.find(
                  (book) =>
                    book.volumeInfo.title.toLowerCase() === currentFaceoffInput.toLowerCase()
                );
                dictCat = `${b.volumeInfo.title} - ${b.volumeInfo.authors[0]}`;
                dictImg = b.volumeInfo.imageLinks.thumbnail;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 8:
          await fetch(`${LEAGUE_DB}`)
            .then((res) => res.json())
            .then((json) => {
              const input = `${currentFaceoffInput.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
              })}`;
              console.log(input.replace(/\s/g, ""));
              if (json.data.hasOwnProperty(input.replace(/\s/g, ""))) {
                dictCat = input;
                dictImg = LEAGUE_DB_IMGS + input.replace(/\s/g, "") + "_0.jpg";
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 9:
          await fetch(`${VIDEOGAMES_DB}` + currentFaceoffInput)
            .then((res) => res.json())
            .then((json) => {
              if (
                json.count !== 0 &&
                json.results[0].name.toLowerCase() === currentFaceoffInput.toLowerCase()
              ) {
                dictCat = `${json.results[0].name}`;
                dictImg = `${json.results[0].background_image}`;
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 10:
          await fetch(HISTORICAL_FIGURES_DB + currentFaceoffInput, {
            method: "GET",
            headers: {
              "X-Api-Key": "mfdXq8CkXP8k8dbb1O+JMg==LNXBEpjRU3XcU4I7",
            },
          })
            .then((res) => res.json())
            .then((json) => {
              if (
                json.length !== 0 &&
                json.find(
                  (figure) => figure.name.toLowerCase() === currentFaceoffInput.toLowerCase()
                )
              ) {
                const figure = json.find(
                  (figure) => figure.name.toLowerCase() === currentFaceoffInput.toLowerCase()
                );
                dictCat = `${figure.name} - ${figure.title}`;
                dictImg = "";
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        default:
      }
    }

    if (!roomState.usedWords.includes(currentFaceoffInput.toLowerCase()) && !validInput) {
      setShowInvalidWordMsg(true);
      setInvalidWordMsg("Invalid word!");
    }

    const inputData = {
      room: room,
      id: socket.id,
      username: username,
      validInput: validInput,
      input: currentFaceoffInput,
      dictCat: dictCat,
      dictImg: dictImg,
    };
    await socket.emit("faceoff_input", inputData);
    setCurrentFaceoffInput("");
  };

  const forceSkip = async () => {
    const data = {
      room: room,
    };
    await socket.emit("force_skip", data);
  };

  useEffect(() => {
    const buildCircle = () => {
      const type = 1;
      let radius = "160"; //distance from center
      let start = -90; //shift start from 0
      let slice = (360 * type) / num;

      let items = [];
      let i;
      for (i = 0; i < num; i++) {
        let rotate = slice * i + start;
        let rotateReverse = rotate * -1;

        items.push({
          radius: radius,
          rotate: rotate,
          rotateReverse: rotateReverse,
        });
      }
      setState({ square: items });
    };

    const endGame = async () => {
      setShowEndScreen(true);
      const endGameData = { room: room };
      await socket.emit("end_game", endGameData);
    };

    setPlayers(users);
    buildCircle();
    socket.on("update_room", (data) => {
      setNum(data.users.length);
      buildCircle();
    });
    socket.on("started_game", (data) => {
      setDictionaryCategory("");
      setDictionaryImg("");
      setDictionaryUser("");
      setShowEndScreen(false);
    });
    socket.on("update_game", (data) => {
      if (data.roomState.faceoff) {
        setDisableInput(false);
        playFaceoffSound();
      }
      playFlipCardSound();
      setPlayers(data.users);
      setRoomState(data.roomState);
      if (data.roomState.cardsLeft === 0) {
        endGame();
      }
    });
    socket.on("post_faceoff", (data) => {
      setCurrentFaceoffInput("");
      playCorrectSound();
      if (data.roomState.faceoff) {
        playFaceoffSound();
      }
      setPlayers(data.users);
      setRoomState(data.roomState);
      setDictionaryCategory(data.dictCat);
      setDictionaryImg(data.dictImg);
      setDictionaryUser(data.dictUser);
      setShowInvalidWordMsg(false);
      setInvalidWordMsg("");
    });
    socket.on("finish_validation", () => {
      setDisableInput(false);
    });
  }, [socket, num, room, users]);

  return (
    <div className="game-window">
      {showEndScreen ? (
        <EndScreen
          socket={socket}
          room={room}
          players={players}
          setShowLobby={setShowLobby}
          setShowEndScreen={setShowEndScreen}
          setShowGame={setShowGame}
        />
      ) : (
        <></>
      )}

      <>
        <Scoreboard users={players} />
        <Dictionary
          user={dictionaryUser}
          dictionaryCategory={dictionaryCategory}
          dictionaryImg={dictionaryImg}
        />
        <div className="circle">
          <div className="circle-hold">
            {state.square.map(function (value, index) {
              if (!players[index]) return false;
              return (
                <Square css={value} num={index + 1} user={players[index]} key={room + index} />
              );
            })}
          </div>
        </div>
        {roomState.faceoffPeople.includes(username) && !showEndScreen ? (
          <div>
            <p className={showInvalidWordMsg ? "invalid-message" : "invalid-message-hide"}>
              {invalidWordMsg}
            </p>
            <input
              ref={(input) => input && input.focus()}
              className="faceoff-input"
              value={currentFaceoffInput}
              type="text"
              onChange={(event) => {
                setCurrentFaceoffInput(event.target.value);
              }}
              onKeyDown={(event) => {
                event.key === "Enter" && sendFaceoffInput();
              }}
              disabled={disableInput}
              placeholder={disableInput ? "Validating answer..." : "Faceoff!"}
            ></input>
          </div>
        ) : (
          <></>
        )}
        {roomState.faceoff && (users.length === 0 || username === users[0].username) ? (
          <button
            className="force-skip-button"
            onClick={() => {
              forceSkip();
            }}
          >
            Force skip
          </button>
        ) : (
          <></>
        )}
      </>
    </div>
  );
};

export default Anomia;
