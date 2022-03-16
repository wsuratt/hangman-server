import express from 'express';
import {
  startGame,
  getRandomWord,
  getUsers,
  getUserWord,
  getUserGuesses,
  addUser,
  updateGuess,
} from "./app/Server";
import { verifyTransaction, endGame } from './app/Transactions';
import { PublicKey } from "@solana/web3.js";
import { start } from 'repl';

const app = express();
const PORT = process.env.PORT || 4800;
app.use(express.json());

var cors=require('cors');
const corsOptions = {
  origin: ['https://hangman.solwager.io', 'http://localhost:3000'],
  preflightContinue: false,
  credentials: true
}
app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('SOLWAGER');
});

// app.get('/api/word', (req, res) => {
//   let word = getRandomWord();
//   res.send(word);
// });

app.get('/api/users', (req, res) => {
  let usersList = [];
  async function setUsers() {
    usersList = await getUsers();
    res.send(usersList);
  }
  setUsers();
});

app.get('/api/users/word/:id', (req, res) => {
  let word = 'hi';
  async function getWord() {
    word = await getUserWord(req.params.id);
    res.send(word);
  }
  getWord();
});

app.get('/api/users/guesses/:id', (req, res) => {
  let numGuesses = '';
  async function getWord() {
    numGuesses = await getUserGuesses(req.params.id);
    res.send(numGuesses);
  }
  getWord();
});

app.put('/api/users', (req, res) => {
  addUser(req.body.ID);
});

app.post('/api/wager', (req, res) => {
  const sig = req.body.sig;
  const userID = req.body.ID;
  async function getTransactionData(signature: string) {
    if (await verifyTransaction(userID, signature)){
        res.status(200).send({ status: 'OK'});
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
  const userID = req.body.ID;
  const guess = req.body.guess;

  async function guessAsync(userID: string, guess: string) {
    let value = await updateGuess(userID, guess);
    res.send({ word : String(value) });
  }
  guessAsync(userID, guess);
});

app.post('/api/end', (req, res) => {
  const userID = new PublicKey(req.body.ID);
  endGame(userID, false);
});

app.listen(PORT, () => {
  console.log(`Express with Typescript! http://localhost:${PORT}`);
});
