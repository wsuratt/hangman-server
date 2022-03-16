import {Express, Request, Response} from "express";
import { endGame } from "./Transactions";
import { PublicKey } from '@solana/web3.js';
const { pool } = require('../config');

const fs = require('fs');

let userArray: any[] = [];

export function getRandomWord(): string {
  var array = fs.readFileSync('./app/words.txt').toString().split("\n");

  let randNum = Math.floor(Math.random() * array.length)

  return array[randNum].toString().toUpperCase();
}

export class User{
  constructor(id: string){
      this.id = id;
      this.has_wagered = false;
      this.has_won = false;
      this.target_word = getRandomWord();
      this.word = "*****";
      this.num_guesses = 8;
      this.timestamp = 0;
  }
  id: string;
  has_wagered: boolean;
  has_won: boolean;
  target_word: string;
  word: string;
  num_guesses: number;
  timestamp: number;
}

export async function getUsers(): Promise<any[]>{
  return new Promise<any[]>(resolve => {
    pool.query('SELECT * FROM users', (error: any, results: { rows: any; }) => {
      if (error) {
        console.log(error);
      }
      userArray = results.rows;
      resolve(userArray);
    })
  });
}

export async function getUserWord(ID: string): Promise<string>{
  const text = 'SELECT word FROM users WHERE id = $1';
  const values = [ID];
  return new Promise<string>(resolve => {
    pool.query(text, values, (error: any, results: { rows: any; }) => {
      if (error) {
        console.log(error);
      }
      let wordJSON = results.rows[0];
      let word = wordJSON.word;
      resolve(word);
    })
  });
}

export async function getUserGuesses(ID: string): Promise<string>{
  const text = 'SELECT num_guesses FROM users WHERE id = $1';
  const values = [ID];
  return new Promise<string>(resolve => {
    pool.query(text, values, (error: any, results: { rows: any; }) => {
      if (error) {
        console.log(error);
      }
      let numGuessesJSON = results.rows[0];
      let numGuesses = numGuessesJSON.num_guesses;
      resolve(String(numGuesses));
    })
  });
}

export async function addUser(ID: PublicKey): Promise<void>{
  const text = 'SELECT COUNT(1) FROM users WHERE id = $1';
  const values = [ID];
  const exists =  await new Promise<number>(resolve => {
    pool.query(text, values, (error: any, results: { rows: any; }) => {
      if (error) {
        throw error
      }
      let countJSON = results.rows[0];
      let count = countJSON.count;
      resolve(count);
    })
  });

  if (exists > 0) return;

  const word = getRandomWord();
  const text2 =`INSERT INTO users (id, has_wagered, has_won, target_word, word, num_guesses, timestamp)
               VALUES($1, FALSE, FALSE, $2, '*****', 0, 0)`;
  const values2 = [ID, word];
  await pool.query(text2, values2, (error: any, results: { rows: any; }) => {
    if (error) {
      console.log(error);
    }
  })
}

export async function setWagered(userID: string) {
  let word = getRandomWord();
  const text = `UPDATE users 
                SET has_wagered = true, 
                    has_won = false, 
                    target_word = $1,
                    word = '*****',
                    timestamp = 0,
                    num_guesses = 8
                WHERE id = $2`;
  const values = [word, userID];
  await pool.query(text, values, (error: any, results: { rows: any; }) => {
    if (error) {
      console.log(error);
    }
  })
}

export async function startGame(userID: string) {
  const text = 'SELECT timestamp FROM users WHERE id = $1';
  const values = [userID];
  
  pool.query(text, values, (error: any, results: { rows: any; }) => {
    if (error) {
      console.log(error);
    }
    let timestampJSON = results.rows[0];
    let timestamp = timestampJSON.timestamp;
    if (timestamp == 0)
    {
      const currTime = (Date.now() / 1000) + 3;
      const text = 'UPDATE users SET timestamp = $1 WHERE id = $2';
      const values = [currTime, userID];
      pool.query(text, values, (error: any, results: { rows: any; }) => {
      if (error) {
        console.log(error);
      }
    })
    }
  });
}

function setCharAt(str: string, index: number, chr: string) {
  if(index > str.length-1) return str;
  return str.substring(0,index) + chr + str.substring(index+1);
}

export async function updateGuess(userID: string, guess: string): Promise<string>{
  const text = 'SELECT * FROM users WHERE id = $1';
  const values = [userID];
  let user = new User(userID);
  return new Promise<string>(resolve => {
    pool.query(text, values, (error: any, results: { rows: any; }) => {
      if (error) {
        console.log(error);
      }
      user = results.rows[0];
      if (user.num_guesses > 0 && !user.has_won && user.has_wagered)
      {
        let currTime = Date.now() / 1000;
        if ((currTime - user.timestamp) <= 15)
        {
          let str = String(user.target_word);
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
            if (user.word === user.target_word)
            {
              user.has_won = true;
              user.timestamp = 0;
              user.has_wagered = false;
              endGame(new PublicKey(userID), true);
            }
          }
          else
          {
            user.num_guesses -= 1;
          }
          if (user.num_guesses == 0 && !user.has_won)
          {
            user.word = user.target_word;
            user.timestamp = 0;
            user.has_wagered = false;
            endGame(new PublicKey(userID), false);
          }
          if (user.has_wagered)
            user.timestamp = Date.now() / 1000;
          const text = `UPDATE users 
                        SET has_wagered = $1, 
                          has_won = $2, 
                          target_word = $3,
                          word = $4,
                          timestamp = $5,
                          num_guesses = $6
                        WHERE id = $7`;
          const values = [user.has_wagered, 
                          user.has_won,
                          user.target_word,
                          user.word,
                          user.timestamp,
                          user.num_guesses,
                          user.id
                        ];
          pool.query(text, values, (error: any, results: { rows: any; }) => {
            if (error) {
              console.log(error);
            }
          })
        }
      }
      resolve(user.word);
    })
  });
  // if (!user) return '*****';
}
