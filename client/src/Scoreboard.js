import "./Scoreboard.css";

const Scoreboard = ({ users }) => {
  return (
    <div className="scoreboard">
      <div className="scoreboard-header">
        <p>Scoreboard</p>
      </div>
      <div className="scoreboard-body">
        <table style={{ width: "100%" }}>
          <tbody>
            {users.map((p) => {
              return (
                <tr key={p.id}>
                  <td className="scoreboard-username">{p.username}</td>
                  <td className="scoreboard-points">{p.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Scoreboard;
