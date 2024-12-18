import "./Home.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Game from "./Game";
const socket = io.connect("https://anomia-35a1c03739bf.herokuapp.com/");
// const socket = io.connect("http://localhost:3001");

function JoinRoom() {
  const [room, setRoom] = useState("");
  const [username, setUsername] = useState("");
  const [showLobby, setShowLobby] = useState(false);
  let navigate = useNavigate();

  const roomId = useParams();
  useEffect(() => {
    setRoom(roomId.roomid);
  }, [roomId]);

  const joinRoom = () => {
    if (username.length > 12) {
      alert("Display name is too long");
      return false;
    }
    if (/[~`!#$%^&*+=\-[\]\\';,/{}|\\":<>?]/g.test(username)) {
      alert("No special characters allowed (!, $, /, etc.)");
      return false;
    }
    if (room !== "" && username !== "") {
      //   navigate(`/${room}`);
      const userData = {
        room: room,
        username: username,
      };
      socket.emit("join_room", userData, (error) => {
        if (error) {
          alert(error);
          navigate("/");
          window.location.reload();
        }
      });
      setShowLobby(true);
    }
  };

  return (
    <div className="App">
      {!showLobby ? (
        <div className="joinChatContainer">
          <p className="home-anomia-logo">ANOMIA</p>
          <h3>Enter Name</h3>
          <input
            placeholder="Hu Tao..."
            onChange={(event) => {
              setUsername(event.target.value);
            }}
            onKeyDown={(event) => {
              event.key === "Enter" && joinRoom();
            }}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <Game socket={socket} username={username} room={room} setShowLobby={setShowLobby} />
      )}
    </div>
  );
}

export default JoinRoom;
