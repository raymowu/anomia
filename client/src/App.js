import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import JoinRoom from "./JoinRoom";

// import Game from "./Game";
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:roomid" element={<JoinRoom />} />
      </Routes>
    </div>
  );
};

export default App;
