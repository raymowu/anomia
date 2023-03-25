import React from "react";
import { useNavigate } from "react-router-dom";
import "./EndScreen.css";

const EndScreen = ({
  socket,
  room,
  players,
  setShowLobby,
  setShowEndScreen,
  setShowGame,
}) => {
  const navigate = useNavigate();

  const playAgain = () => {
    setShowEndScreen(false);
    setShowGame(false);
    setShowLobby(true);
  };

  const leaveGame = () => {
    navigate("/");
    socket.close();
    window.location.reload();
  };
  return (
    <div className="endscreen">
      <p>Game Over!</p>
      <button className="endscreen-button" onClick={leaveGame}>
        Leave
      </button>
      <button className="endscreen-button" onClick={playAgain}>
        Play again
      </button>
    </div>
  );
};

export default EndScreen;
