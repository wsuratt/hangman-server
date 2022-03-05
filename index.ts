import express from 'express';
import {
  startGame,
  getRandomWord,
  getUsers, 
  addUser,
  updateGuess,
} from "./app/Server";
import { verifyTransaction } from './app/Transactions';
import { PublicKey } from "@solana/web3.js";
import { start } from 'repl';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

var cors=require('cors');
const corsOptions = {
  origin: ["https://hangman-inky.vercel.app"],
  preflightContinue:false,
  credentials: true
}
app.use(cors(corsOptions));


let usersList = getUsers();

app.get('/', (req, res) => {
  res.send('SOLWAGER');
});

// app.get('/api/word', (req, res) => {
//   let word = getRandomWord();
//   res.send(word);
// });

app.get('/api/users', (req, res) => {
  let usersList = getUsers();
  res.send(usersList);
});

app.get('/api/users/word/:id', (req, res) => {
  usersList = getUsers();
  let user = usersList.find((c: { ID: any; }) => String(c.ID) == req.params.id);
  if (!usersList.includes(user)) {res.status(404).send("That user doesn't exist yet"); return;}
  res.send({ word : String(user.word) });
});

app.get('/api/users/guesses/:id', (req, res) => {
  usersList = getUsers();
  let user = usersList.find((c: { ID: any; }) => String(c.ID) == req.params.id);
  if (!usersList.includes(user)) {res.status(404).send("That user doesn't exist yet"); return;}
  res.send(String(user.numGuesses));
});

app.put('/api/users', (req, res) => {
  const userID = new PublicKey(req.body.ID);
  usersList = getUsers();
  let user = usersList.find((c: { ID: any; }) => c.ID === req.body.ID);
  if (!usersList.includes(user)){
    addUser(userID);
    usersList = getUsers();
    user = usersList.find((c: { ID: any; }) => c.ID === req.body.ID);
  }
  res.send(user);
});

app.post('/api/wager', (req, res) => {
  const sig = req.body.sig;
  const userID = req.body.ID;
  async function getTransactionData(signature: string) {
      if (await verifyTransaction(userID, signature)){
          res.send("good");
      }else{
          res.send("bad");
      }
  }
  getTransactionData(sig);
});

app.post('/api/start', (req, res) => {
  const userID = req.body.ID;
  startGame(userID);

});

app.post('/api/guess', (req, res) => {
  const guess = req.body.guess;
  let usersList = getUsers();
  const user = usersList.find((c: { ID: any; }) => String(c.ID) === req.body.ID);
  if(!usersList.includes(user)) {
      res.send("*****");
      return;
  }
  async function guessAsync(userID: string, guess: string) {
    let value = await updateGuess(userID, guess);
    res.send({ word : String(value) });
  }
  guessAsync(user.ID, guess);
});

app.listen(PORT, () => {
  console.log(`Express with Typescript! http://localhost:${PORT}`);
});
