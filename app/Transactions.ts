import * as anchor from "@project-serum/anchor";
import { web3 } from '@project-serum/anchor';
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, Keypair } from "@solana/web3.js";
import { setWagered } from "./Server";
// const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
const fs = require('fs');
const idl = require('./etc/hangman_program.json');
const { pool } = require('../config');

const FEE_TOTAL = 0.0011; //remove two 0s

const FEE_WALLET = "8WnqfBUM4L13fBUudvjstHBEmUcxTPPX7DGkg3iyMmc8";
const POOL_PDA = "6N4dfkqdTFsdJuu6gvvKCUhUX4swWqeTRvt4zonJGgW4";
export const SOLWAGER_PROGRAM = new PublicKey(
  "8VxWJzmYtVrC755tFjQGMLhAN3hgPfCNPReEtN3wBzYz"
);

const serverWallet = loadWalletKey('./app/etc/my_keypair.json');

let tsxArray: any[] = [];

function loadWalletKey(keypairPath: string): Keypair {
  if (!keypairPath || keypairPath == '') {
      throw new Error('Keypair is required!');
  }
  const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath).toString())),
  );
  return loaded;
}

export async function verifyTransaction(userID: string, tSig: string): Promise<boolean>{
  const text = 'SELECT COUNT(1) FROM transactions WHERE sig = $1';
  const values = [tSig];
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

  if (exists > 0) return false;

  const transactionData = await connection.getParsedTransaction(tSig, "confirmed");

  if (!transactionData) return false;
  if (!transactionData.meta) return false;

  const amount = (transactionData.meta.preBalances[0] - transactionData.meta.postBalances[0]) / LAMPORTS_PER_SOL;
  if (amount < FEE_TOTAL) return false;
  
  const wallOne = transactionData.transaction.message.accountKeys[1].pubkey.toString();
  const wallTwo = transactionData.transaction.message.accountKeys[2].pubkey.toString();

  if (wallOne != FEE_WALLET && wallOne != POOL_PDA) return false;

  if (wallTwo != POOL_PDA && wallTwo != FEE_WALLET) return false;

  const text2 = 'INSERT INTO transactions (sig) VALUES($1)';
  const values2 = [tSig];
  await pool.query(text2, values2, (error: any, results: { rows: any; }) => {
    if (error) {
      throw error
    }
  })

  await setWagered(userID);

  return true;
}

const getWagerProgram = (): anchor.Program => {
  const programId = SOLWAGER_PROGRAM;
  const wallet = new anchor.Wallet(serverWallet);
  const provider = new anchor.Provider(connection, wallet, {
    preflightCommitment: "recent",
  });

  return new anchor.Program(idl, programId, provider)
};

export const endGame = async (owner: anchor.web3.PublicKey, hasWon: boolean) => {
  const program = getWagerProgram();
  if (hasWon)
  {
    await program.rpc.endGame(true, {
        accounts: {
            owner: owner,
            server: serverWallet.publicKey,
            pool: POOL_PDA,
            systemProgram: web3.SystemProgram.programId,
        }
    });
  }
  else
  {
    await program.rpc.endGame(false, {
      accounts: {
          owner: owner,
          server: serverWallet.publicKey,
          pool: POOL_PDA,
          systemProgram: web3.SystemProgram.programId,
      }
    });
  }
}
