const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

const users = [];

let gameState = [];

const MAX_WAITING = 1000;
const MAX_WAITING_AFTER_FACEOFF = 1000;
const MAX_CATEGORIES = 10;
const MAX_SYMBOLS = 8;
const DEF_DECK_SIZE = 92;

const deleteGame = (room) => {
  gameState.splice(getRoomIndex(room), 1);
};

const restartGame = (room) => {
  gameState[getRoomIndex(room)] = {
    room: room,
    inProgress: false,
    numPlayers: getUsersInRoom(room).length,
    _turn: 0,
    currentTurn: 0,
    faceoff: false,
    faceoffPeople: [],
    cardsLeft: DEF_DECK_SIZE,
    usedWords: [],
  };
  for (let i = 0; i < getUsersInRoom(room).length; i++) {
    getUsersInRoom(room)[i].points = 0;
    getUsersInRoom(room)[i].deck = [];
    getUsersInRoom(room)[i].inFaceoff = false;
  }
};

const addUser = ({ id, username, room }) => {
  const existingUser = users.find(
    (user) => user.room === room && user.username === username
  );
  if (existingUser) {
    return { error: "Username is taken" };
  } else if (gameState[getRoomIndex(room)].inProgress) {
    return { error: "Game in progress " };
  } else if (getUsersInRoom(room).length >= 6) {
    return { error: "Lobby is full" };
  }

  const user = { id, username, room, points: 0, deck: [], inFaceoff: false };
  users.push(user);

  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};

const nextTurn = (room) => {
  if (
    getRoomIndex(room) !== -1 &&
    gameState[getRoomIndex(room)].inProgress &&
    !gameState[getRoomIndex(room)].faceoff &&
    gameState[getRoomIndex(room)].cardsLeft > 0
  ) {
    console.log(gameState[getRoomIndex(room)]);
    gameState[getRoomIndex(room)]._turn =
      gameState[getRoomIndex(room)].currentTurn++ %
      gameState[getRoomIndex(room)].numPlayers;
    let category = getRandomInt(MAX_CATEGORIES);
    let symbol = getRandomInt(MAX_SYMBOLS);
    let card = { category, symbol };
    getUsersInRoom(room)[gameState[getRoomIndex(room)]._turn].deck.push(card);
    gameState[getRoomIndex(room)].cardsLeft--;

    //TODO add check for face off here

    for (let i = 0; i < gameState[getRoomIndex(room)].numPlayers; i++) {
      for (let j = i + 1; j < gameState[getRoomIndex(room)].numPlayers; j++) {
        let user1 = getUsersInRoom(room)[i];
        let user2 = getUsersInRoom(room)[j];
        if (
          user1.deck.length !== 0 &&
          user2.deck.length !== 0 &&
          user1.deck.at(-1).symbol === user2.deck.at(-1).symbol
        ) {
          gameState[getRoomIndex(room)].faceoffPeople = [user1.username, user2.username];
          gameState[getRoomIndex(room)].faceoff = true;
          user1.inFaceoff = true;
          user2.inFaceoff = true;
          break;
        }
      }
    }
    io.to(room).emit("update_game", {
      room: room,
      roomState: gameState[getRoomIndex(room)],
      users: getUsersInRoom(room),
    });
    console.log(
      `next turn triggered in room ${room}: `,
      gameState[getRoomIndex(room)]._turn
    );
    triggerTimeout(room);
  }
};

const triggerTimeout = (room) => {
  timeOut = setTimeout(() => {
    nextTurn(room);
  }, MAX_WAITING);
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

const getRoomIndex = (room) => {
  const index = gameState.findIndex((r) => r.room === room);
  return index;
};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data, callback) => {
    const roomState = {
      room: data.room,
      inProgress: false,
      numPlayers: 0,
      _turn: 0,
      currentTurn: 0,
      faceoff: false,
      faceoffPeople: [],
      cardsLeft: DEF_DECK_SIZE,
      usedWords: [],
    };

    if (getRoomIndex(data.room) === -1) {
      gameState.push(roomState);
    }

    const { error, user } = addUser({
      id: socket.id,
      username: data.username,
      room: data.room,
    });
    if (error) {
      return callback(error);
    }

    gameState[getRoomIndex(data.room)].numPlayers++;

    socket.to(data.room).emit("receive_message", {
      room: data.room,
      author: "",
      message: `${user.username} joined`,
    });
    socket.join(user.room);

    io.to(user.room).emit("update_room", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
    console.log(`User with ID: ${socket.id} joined room: ${data.room}`);
  });

  socket.on("send_message", (data, callback) => {
    socket.to(data.room).emit("receive_message", data);
    callback();
  });

  socket.on("faceoff_input", (data) => {
    if (gameState[getRoomIndex(data.room)].faceoff) {
      if (data.validInput === true) {
        io.to(data.room).emit("receive_message", {
          room: data.room,
          author: "",
          message: `${data.username} won the faceoff with the word: ${data.input}`,
        });
        // proceed game when theres a winner
        gameState[getRoomIndex(data.room)].usedWords.push(data.input.toLowerCase());
        getUser(data.id).points++;
        // TODO make more efficient by storing id in faceoffPeople and accessing users from there
        for (let i = 0; i < gameState[getRoomIndex(data.room)].numPlayers; i++) {
          let user1 = getUsersInRoom(data.room)[i];
          if (
            user1.username === gameState[getRoomIndex(data.room)].faceoffPeople[0] ||
            user1.username === gameState[getRoomIndex(data.room)].faceoffPeople[1]
          ) {
            if (user1.username !== data.username) {
              user1.deck.splice(-1);
            }
            user1.inFaceoff = false;
          }
        }
        gameState[getRoomIndex(data.room)].faceoffPeople = [];
        gameState[getRoomIndex(data.room)].faceoff = false;

        // check for chain face offs and set statuses accordingly
        let canContinue = true;
        for (let i = 0; i < gameState[getRoomIndex(data.room)].numPlayers; i++) {
          for (let j = i + 1; j < gameState[getRoomIndex(data.room)].numPlayers; j++) {
            let user1 = getUsersInRoom(data.room)[i];
            let user2 = getUsersInRoom(data.room)[j];
            if (
              user1.deck.length !== 0 &&
              user2.deck.length !== 0 &&
              user1.deck.at(-1).symbol === user2.deck.at(-1).symbol
            ) {
              canContinue = false;
              gameState[getRoomIndex(data.room)].faceoffPeople = [
                user1.username,
                user2.username,
              ];
              gameState[getRoomIndex(data.room)].faceoff = true;
              user1.inFaceoff = true;
              user2.inFaceoff = true;
              break;
            }
            users;
          }
        }

        io.to(data.room).emit("post_faceoff", {
          users: getUsersInRoom(data.room),
          roomState: gameState[getRoomIndex(data.room)],
          dictUser: data.username,
          dictCat: data.dictCat,
          dictImg: data.dictImg,
        });
        //prevent drawing card for next turn during a chain faceoff
        if (canContinue) {
          setTimeout(() => {
            nextTurn(data.room);
          }, MAX_WAITING);
        }
      } else {
        io.to(data.room).emit("receive_message", {
          room: data.room,
          author: "",
          message: `${data.username} guessed "${data.input}"`,
        });
      }
    }
    io.to(data.id).emit("finish_validation");
  });

  socket.on("start_game", (data) => {
    gameState[getRoomIndex(data.room)].inProgress = true;
    gameState[getRoomIndex(data.room)].cardsLeft = data.deckSize;
    setTimeout(() => {
      nextTurn(data.room);
    }, MAX_WAITING);
    io.to(data.room).emit("started_game", getUsersInRoom(data.room));
    io.to(data.room).emit("receive_message", {
      room: data.room,
      author: data.user,
      message: `started the game`,
    });
  });

  socket.on("end_game", (data) => {
    restartGame(data.room);
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user && gameState[getRoomIndex(user.room)]) {
      gameState[getRoomIndex(user.room)].numPlayers--;
      // skip faceoff, move on to next turn
      let user1;
      for (let i = 0; i < gameState[getRoomIndex(user.room)].numPlayers; i++) {
        user1 = getUsersInRoom(user.room)[i];
        if (
          user1.username === gameState[getRoomIndex(user.room)].faceoffPeople[0] ||
          user1.username === gameState[getRoomIndex(user.room)].faceoffPeople[1]
        ) {
          user1.inFaceoff = false;
        }
      }
      gameState[getRoomIndex(user.room)].faceoffPeople = [];
      gameState[getRoomIndex(user.room)].faceoff = false;
      io.to(user.room).emit("post_faceoff", {
        users: getUsersInRoom(user.room),
        roomState: gameState[getRoomIndex(user.room)],
        dictUser: "No one",
        dictCat: "Opponent left the game!",
        dictImg: "",
      });
      setTimeout(() => {
        nextTurn(user.room);
      }, MAX_WAITING);
      if (gameState[getRoomIndex(user.room)].numPlayers === 0) deleteGame(user.room);
      socket.to(user.room).emit("receive_message", {
        room: user.room,
        author: "",
        message: `${user.username} left`,
      });
      io.to(user.room).emit("update_room", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
    console.log("User Disconnected", socket.id);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("SERVER IS RUNNING");
});
