# KingBot (Discord)

KingBot is a Discord.js (version 12.2.0) based Discord chat bot, written entirely in Javascript. Commands are abstracted away to a CommandHandler class, including a versatile scoreboard and a customizable trivia game, among other utilities.

## Matrix Adaptation

Here, KingBot has been adapted to connect to the Matrix communication network using the matrix-bot-sdk Node library. Many features are absent from the original implementation of KingBot.

## Initializing And Launching

```
npm install

node index.js
```

You must provide your Matrix Auth Token in config.json before KingBot will connect to Matrix.
