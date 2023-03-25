import "./Home.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [room, setRoom] = useState("");
  let navigate = useNavigate();

  const joinRoom = () => {
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
        <h3>Join A Room</h3>
        <input
          placeholder="Room Number..."
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
