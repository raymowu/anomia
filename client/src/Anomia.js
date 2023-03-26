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

const Anomia = ({ socket, username, room, users, setShowLobby, setShowGame }) => {
  const MOVIESANDTV_DB = "https://www.omdbapi.com/?t=";
  const MOVIESANDTV_APIKEY = "&apikey=b0022818";
  const POKEMON_DB = "https://pokeapi.co/api/v2/pokemon/?limit=9999";
  const SONGS_DB = "https://deezerdevs-deezer.p.rapidapi.com/search?q=";
  const CARS_DB = "https://car-api2.p.rapidapi.com/api/makes?sort=name&make=";

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

  function playFlipCardSound() {
    let audio = new Audio(flipcard);
    audio.volume = 0.3;
    audio.play();
  }
  function playCorrectSound() {
    let audio = new Audio(correct);
    audio.volume = 0.3;
    audio.play();
  }
  function playIncorrectSound() {
    let audio = new Audio(incorrect);
    audio.volume = 0.3;
    audio.play();
  }
  function playUsedWordSound() {
    let audio = new Audio(usedword);
    audio.volume = 0.3;
    audio.play();
  }

  const sendFaceoffInput = async () => {
    if (disableInput) return;
    if (!roomState.faceoff) return;
    setDisableInput(true);
    let validInput = false;
    let category = players
      .find((p) => p.inFaceoff && p.username !== username)
      .deck.at(-1).category;
    if (roomState.usedWords.includes(currentFaceoffInput.toLowerCase())) {
      playUsedWordSound();
    } else {
      switch (category) {
        case 0:
          await fetch(`${MOVIESANDTV_DB}` + currentFaceoffInput + `${MOVIESANDTV_APIKEY}`)
            .then((res) => res.json())
            .then((json) => {
              if (json.Response === "True" && json.Type === "movie") {
                validInput = true;
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
              if (
                json.results.find(
                  (pokemon) =>
                    pokemon.name.toLowerCase() === currentFaceoffInput.toLowerCase()
                )
              ) {
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
              if (
                json.data[0].title.toLowerCase() === currentFaceoffInput.toLowerCase()
              ) {
                validInput = true;
              } else {
                playIncorrectSound();
                validInput = false;
              }
            });
          break;
        case 4:
          await fetch(CARS_DB + currentFaceoffInput, {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": "e15a3578aemshfc8ff97c4a6af8ap17f164jsn84d74d0b4b62",
              "X-RapidAPI-Host": "car-api2.p.rapidapi.com",
            },
          })
            .then((res) => res.json())
            .then((json) => {
              if (
                json.data.length === 0 ||
                json.data[0].name.toLowerCase() !== currentFaceoffInput.toLowerCase()
              ) {
                playIncorrectSound();
                validInput = false;
              } else {
                validInput = true;
              }
            });
          break;
        default:
      }
    }

    const inputData = {
      room: room,
      id: socket.id,
      username: username,
      validInput: validInput,
      input: currentFaceoffInput,
    };
    await socket.emit("faceoff-input", inputData);
    setCurrentFaceoffInput("");
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

    function playFaceoffSound() {
      const FACEOFFSOUNDS = [faceoffsound1, faceoffsound2, faceoffsound3, faceoffsound4];
      let audio = new Audio(FACEOFFSOUNDS[Math.floor(Math.random() * 4)]);
      audio.volume = 0.3;
      audio.play();
    }

    setPlayers(users);
    buildCircle();
    socket.on("update_room", (data) => {
      setNum(data.users.length);
      buildCircle();
    });
    socket.on("started_game", (data) => {
      setShowEndScreen(false);
    });
    socket.on("update_game", (data) => {
      if (data.roomState.faceoff) {
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
        <div className="circle">
          <div className="circle-hold">
            {state.square.map(function (value, index) {
              if (!players[index]) return false;
              return (
                <Square
                  css={value}
                  num={index + 1}
                  user={players[index]}
                  key={room + index}
                />
              );
            })}
          </div>
        </div>
        {roomState.faceoffPeople.includes(username) && !showEndScreen ? (
          <input
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
        ) : (
          <></>
        )}
      </>
    </div>
  );
};

export default Anomia;
