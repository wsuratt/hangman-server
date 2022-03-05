import {Express, Request, Response} from "express";
import { endGame } from "./Transactions";
import { PublicKey } from '@solana/web3.js';

const fs = require('fs');

let userArrayJSON = fs.readFileSync('./app/etc/users.json');
let userArray = JSON.parse(userArrayJSON);

export function getRandomWord(): string {
  var array = fs.readFileSync('./app/words.txt').toString().split("\n");

  let randNum = Math.floor(Math.random() * array.length)

  return array[randNum].toString().toUpperCase();
}

export class User{
  constructor(id: PublicKey){
      this.ID = id;
      this.hasWagered = false;
      this.hasWon = false;
      this.targetWord = getRandomWord();
      this.word = "*****";
      this.numGuesses = 10;
      this.timestamp = 0;
  }
  ID: PublicKey;
  hasWagered: boolean;
  hasWon: boolean;
  targetWord: string;
  word: string;
  numGuesses: number;
  timestamp: number;
}

export function getUsers(){
  let userArrayJSON = fs.readFileSync('./app/etc/users.json');
  let userArray = JSON.parse(userArrayJSON);
  return userArray;
}

export function addUser(ID: PublicKey): void{
  const newUser = new User(ID);
  userArray.push(newUser);
  fs.writeFile('./app/etc/users.json', JSON.stringify(userArray), (err: any) => {
      if (err)
          console.log(err);
      else{
          console.log("User ", String(ID), "successfully added");
      }
  });
}

export function setWagered(userID: string) {
  let user = userArray.find((c: { ID: any; }) => String(c.ID) === userID);
  user.hasWagered = true;
  user.hasWon = false;
  user.targetWord = getRandomWord();
  user.word = "*****";
  user.numGuesses = 10;
  fs.writeFileSync('./app/etc/users.json', JSON.stringify(userArray));
}

export function startGame(userID: string) {
  let user = userArray.find((c: { ID: any; }) => String(c.ID) === userID);
  if (user.timestamp == 0)
  {
    user.timestamp = (Date.now() / 1000) + 3;
  }
}

function setCharAt(str: string, index: number, chr: string) {
  if(index > str.length-1) return str;
  return str.substring(0,index) + chr + str.substring(index+1);
}

export async function updateGuess(userID: string, guess: string): Promise<string>{
  let user = userArray.find((c: { ID: any; }) => String(c.ID) === userID);
  if (user.numGuesses > 0 && !user.hasWon && user.hasWagered)
  {
    let currTime = Date.now() / 1000;
    if ((currTime - user.timestamp) > 15)
    {
      let str = String(user.targetWord);
      var indices = [];
      for (let i = 0; i < str.length; i++) {
          if (str[i] === guess) indices.push(i);
      }
      if (indices.length > 0)
      {
        for (let i = 0; i < indices.length; i++) {
          let temp = setCharAt(user.word, indices[i], guess);
          user.word = temp;
        }
        if (user.word === user.targetWord)
        {
          user.hasWon = true;
          user.timestamp = 0;
          user.hasWagered = false;
          await endGame(new PublicKey(userID), true);
        }
      }
      else
      {
        user.numGuesses -= 1;
      }
      if (user.numGuesses == 0 && !user.hasWon)
      {
        user.word = user.targetWord;
        user.timestamp = 0;
        user.hasWagered = false;
        await endGame(new PublicKey(userID), false);
      }
      user.timestamp = Date.now() / 1000;
      console.log("IN\n")
      fs.writeFileSync('./app/etc/users.json', JSON.stringify(userArray));
    }
  }
  console.log("OUT\n")
  return(user.word);
}
