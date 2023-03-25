import React from "react";
import "./Card.css";
import bolt from "./assets/images/bolt.png";
import circle from "./assets/images/circle.png";
import dots from "./assets/images/dots.png";
import hashtag from "./assets/images/hashtag.png";
import pause from "./assets/images/pause.png";
import plus from "./assets/images/plus.png";
import square from "./assets/images/square.png";
import star from "./assets/images/star.png";

const Card = ({ user }) => {
  const CATEGORIES = ["Movies", "TV Shows", "Pokemon", "Songs", "Car Brands"];
  const SYMBOLS = [circle, hashtag, bolt, dots, square, star, plus, pause];
  return (
    <div className="card">
      <p className="category">{CATEGORIES[user.deck.at(-1).category]}</p>
      <img className="symbol" src={SYMBOLS[user.deck.at(-1).symbol]} />
    </div>
  );
};

export default Card;
