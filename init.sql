CREATE TABLE users (
  id VARCHAR (255) UNIQUE NOT NULL,
  has_wagered BOOLEAN,
  has_won BOOLEAN,
  target_word VARCHAR (5) NOT NULL,
  word VARCHAR (5) NOT NULL,
  num_guesses INTEGER,
  timestamp DECIMAL
);

INSERT INTO
  users (
    ID,
    has_wagered,
    has_won,
    target_word,
    word,
    num_guesses,
    timestamp
  )
VALUES
  (
    '512CDVq78BQpKxb6RyPa9pYiqU2Z8jr7XYaUWBQrYwHt',
    FALSE,
    FALSE,
    'WAGER',
    '*****',
    0,
    0
  );

CREATE TABLE transactions (sig VARCHAR (255) UNIQUE NOT NULL);

INSERT INTO
  transactions (sig)
VALUES
  (
    '2ekdaBKR3beTxwQ34xptZ1tFojmKSFv3rd2W55DBvseKLyEQrofczHp4HuBbx4oFPujGWbDheMSp6izTR7kzCSg4'
  );
