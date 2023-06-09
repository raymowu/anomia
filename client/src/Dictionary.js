import React from "react";
import "./Dictionary.css";

const Dictionary = ({ user, dictionaryCategory, dictionaryImg }) => {
  return (
    <div className="dictionary">
      <div className="dictionary-header">
        <p>Dictionary</p>
      </div>
      <div className="dictionary-body">
        <p className="dictionary-thing">{user ? `${user} won with ` : ``}</p>
        <p className="dictionary-thing">{dictionaryCategory}</p>
        <img
          className="dictionary-img"
          alt=""
          src={dictionaryImg}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = "https://i.imgur.com/5ZZKdnt.png";
          }}
        ></img>
      </div>
    </div>
  );
};

export default Dictionary;
