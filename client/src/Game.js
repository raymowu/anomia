import React from "react";
import { useState, useEffect } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import Anomia from "./Anomia";
import "./Game.css";
import chatsound from "./assets/audio/chatsound.wav";
import startgamesound from "./assets/audio/startgamesound.wav";
import { useNavigate } from "react-router-dom";

function Game({ socket, username, room, setShowLobby }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [users, setUsers] = useState([]);
  const [showGame, setShowGame] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [deckSize, setDeckSize] = useState(92);

  let navigate = useNavigate();

  const leaveGame = () => {
    navigate("/");
    socket.close();
    window.location.reload();
  };

  function isNumeric(value) {
    return /^-?\d+$/.test(value);
  }

  const startGame = async () => {
    if (users.length === 1 || users.length > 6) {
      alert("Must have 2-6 players to start!");
      return false;
    }
    if (!isNumeric(deckSize) || deckSize > 9999 || deckSize < 10) {
      alert("Please input deck size of 10-9999");
      return false;
    }
    const userData = {
      room: room,
      user: username,
      deckSize: deckSize,
    };
    await socket.emit("start_game", userData);
    setShowGame(true);
    playStartGameSound();
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
      };

      await socket.emit("send_message", messageData, () => setCurrentMessage(""));
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
      playChatSound();
    }
  };

  function playChatSound() {
    let audio = new Audio(chatsound);
    audio.volume = 0.1;
    audio.play();
  }

  function playStartGameSound() {
    let audio = new Audio(startgamesound);
    audio.volume = 0.1;
    audio.play();
  }

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
      playChatSound();
    });
    socket.on("update_room", ({ users }) => {
      setUsers(users);
    });
    socket.on("started_game", (data) => {
      setShowGame(true);
      playStartGameSound();
    });
  }, [socket]);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  return (
    <>
      <div className="window">
        {!showGame ? (
          <div className="game-window">
            <div className="lobby-header">
              <h1>Room {room}</h1>
              <p>
                Invite your friends!{" "}
                <input
                  readOnly
                  className="copy-lobby-link"
                  type="text"
                  onMouseOver={handleMouseOver}
                  onMouseOut={handleMouseOut}
                  value={
                    isHovering
                      ? `https://hutaofunbox.netlify.app/${room}`
                      : "Hover over me to see the invite link!"
                  }
                ></input>
                <button
                  className="copy-lobby-link-button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://hutaofunbox.netlify.app/${room}`
                    );
                  }}
                >
                  Copy
                </button>
              </p>
            </div>

            <div className="left-container">
              <div className="player-display">
                <div className="player-display-header">
                  <p>Players</p>
                </div>
                <div className="player-display-list">
                  {users.map((p) => {
                    return <p key={p.id}>{p.username}</p>;
                  })}
                </div>
              </div>
              {users.length === 0 || username === users[0].username ? (
                <>
                  <div className="cards-setting">
                    <p>Game Settings </p>Deck size:{" "}
                    <input
                      type="text"
                      value={deckSize}
                      onChange={(event) => {
                        setDeckSize(event.target.value);
                      }}
                    ></input>
                  </div>
                  <button className="lobby-button" onClick={leaveGame}>
                    Leave
                  </button>
                  <button className="lobby-button" onClick={startGame}>
                    Start game
                  </button>
                </>
              ) : (
                <>
                  <div className="cards-setting">
                    <p>Waiting for {users[0].username} to start the game...</p>
                    <input style={{ visibility: "hidden" }}></input>
                  </div>
                  <button className="lobby-button" style={{ visibility: "hidden" }}>
                    Leave
                  </button>
                  <button className="lobby-button" style={{ visibility: "hidden" }}>
                    Start game
                  </button>
                </>
              )}
            </div>
            <div className="rules-container">
              <div className="rules-header">
                <h2>Anomia</h2>
                <p>
                  Original card game designed by Andrew Innes. This online version
                  developed by Raymond Wu.
                </p>
                <h2>Object of the Game</h2>
                <p>To win the most cards by facing-off with other players.</p>
                <h2>Play Piles</h2>
                <p>
                  One at a time, players continue drawing cards from either pile, in
                  clockwise order, until the symbols on two players' cards match. If you
                  draw a card and there is no match, the next player draws.
                </p>
                <h2>Face-offs & Winning Piles</h2>
                <p>
                  When the symbols on two players' cards match, they must Face-Off with
                  one another. This is the heart of the game. A Face-Off consists of
                  giving a correct example of the person, place, or thing on your
                  opponent's card, before they can do the same for your card. The player
                  who finishes typinga correct answer when prompted first wins the
                  Face-Off. The winner takes the loser's top card and scores a point. The
                  winner's top card stays where it is.
                </p>
                <h2>Cascades</h2>
                <p>
                  The loser's Play Pile may now reveal a new top card. Watch out! A new
                  Face-Off may now occur between the loser and any other player! Please
                  note, play is structured so that there can be only one Face-Off at a
                  time, though there may be many in quick succession. This is called a
                  Cascade.
                </p>
                <h2>After a Face-Off/Cascade</h2>
                <p>
                  Drawing continues with the next player in the clockwise drawing
                  sequence. You may find it helpful to pass a small token around to
                  indicate whose turn it is. A salt shaker or coin will do nicely.
                </p>
                .
              </div>
            </div>
          </div>
        ) : (
          <Anomia
            socket={socket}
            username={username}
            room={room}
            users={users}
            setShowLobby={setShowLobby}
            setShowGame={setShowGame}
          />
        )}
        <div className="chat-window">
          <div className="chat-header">
            <p>Live Chat</p>
          </div>
          <div className="chat-body">
            <ScrollToBottom className="message-container">
              {messageList.map((messageContent, index) => {
                return (
                  <div className="message" key={room + index}>
                    <div>
                      <div className="message-content">
                        <p
                          className={
                            messageContent.author.length === 0 ? "admin-message" : ""
                          }
                        >
                          <span className="message-meta">{messageContent.author}</span>{" "}
                          {messageContent.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollToBottom>
          </div>
          <div className="chat-footer">
            <input
              type="text"
              value={currentMessage}
              placeholder="Hey..."
              onChange={(event) => {
                setCurrentMessage(event.target.value);
              }}
              onKeyDown={(event) => {
                event.key === "Enter" && sendMessage();
              }}
            />
            <button onClick={sendMessage}>&#9658;</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Game;
