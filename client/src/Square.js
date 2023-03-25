import React from "react";
import Card from "./Card";

const Square = ({ css, num, user }) => {
  return (
    <div
      className="square"
      style={{
        transform:
          "rotate(" +
          css.rotate +
          "deg) translate(" +
          css.radius +
          "px) rotate(" +
          css.rotateReverse +
          "deg)",
      }}
    >
      {user.username}
      {user.deck.length !== 0 ? <Card user={user} /> : <></>}
    </div>
  );
};

export default Square;
