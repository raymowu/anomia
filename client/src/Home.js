import "./Home.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [room, setRoom] = useState("");
  let navigate = useNavigate();

  const joinRoom = () => {
    if (room.length > 8) {
      alert("Room name is too long!");
      return false;
    }
    if (/[~`!#$%^&*+=\-[\]\\';,/{}|\\":<>?]/g.test(room)) {
      alert("No special characters allowed (!, $, /, etc.)");
      return false;
    }
    if (room !== "") {
      navigate(`/${room}`);
    }
  };

  return (
    <div className="App">
      <div className="joinChatContainer">
        <p className="home-anomia-logo">ANOMIA</p>
        <h3>Join A Room</h3>
        <input
          placeholder="hutao421..."
          onChange={(event) => {
            setRoom(event.target.value);
          }}
          onKeyDown={(event) => {
            event.key === "Enter" && joinRoom();
          }}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}

export default Home;
