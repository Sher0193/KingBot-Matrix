const SimpleFsStorageProvider = require("matrix-bot-sdk").SimpleFsStorageProvider;
const MatrixClient = require("matrix-bot-sdk").MatrixClient;
const AutojoinRoomsMixin = require("matrix-bot-sdk").AutojoinRoomsMixin;
const ScoreboardHandler = require('./content/scoreboard/scoreboardhandler.js');
const RichReply = require("matrix-bot-sdk").RichReply;

const config = require("./config.json");

const storage = new SimpleFsStorageProvider("storage.json");

const client = new MatrixClient("https://matrix.org", config.token, storage);
AutojoinRoomsMixin.setupOnClient(client);

const sh = new ScoreboardHandler();

// To listen for room messages (m.room.message) only:
client.on("room.message", async (roomId, event) => {
    if (!event["content"]) return;
    if (event["content"]["msgtype"] !== "m.text") return;
    if (event["sender"] === await client.getUserId()) return;
    
    const message = event["content"]["body"];      
          
    if(message.indexOf(config.prefix) !== 0) return;
    
    const args = message.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    
    if (command === "test") {
        client.sendMessage(roomId, {
            "msgtype": "m.notice",
            "body": "hello!",
        });
    }
    
    if (command === "about") {
        client.sendMessage(roomId, {
            "msgtype": "m.notice",
            "body": "KingBot is created by Dylan Sherwood."
        });
    }
    
    if (command === "scoreboard") {
        if (args[0] === "create") {
            sh.addScoreboard(roomId);
            if (sh.getScoreboardById(roomId) !== null) {
                client.sendText(roomId, "Created a scoreboard for this channel.");
                sh.saveScoreboards();
            } else {
                client.sendText(roomId, "Could not create scoreboard.");
            }
        } else if (args[0] === "clear") {
            if (sh.removeScoreboard(roomId)) {
                client.sendText(roomId, "Removed scoreboard for this channel.");
                sh.saveScoreboards();
            } else {
                client.sendText(roomId, "Could not remove scoreboard.");
            }
        } else {
                var scoreboard = sh.getScoreboardById(roomId);
                if (scoreboard !== null) {
                    client.sendMessage(roomId, {
                        "msgtype": "m.text",
                        "body": scoreboard.buildScoreboard(),
                        "format": "org.matrix.custom.html",
                        "formatted_body": scoreboard.buildScoreboard()
                    });
                } else {
                    client.sendText(roomId, "Could not find scoreboard.");
                }
        }
    }
    
    if (command === "score" || command === "half" || command === "penalty" || command === "penaltyhalf") {
        if (args[0] === undefined) {
            client.sendText(roomId, "Please enter a list of names separated by commas e.g. \"!score Crosby, Stills, Nash, Young\"");
            return;
        } else {
            arrs = new Array();
            amts = new Array();
            for (let i = args.length - 1; i >= 0; i--) {
                if (args[i].charAt(args[i].length - 1) === ":" || !isNaN(args[i])) { // add passed number to amts, number: is legacy
                    if (args[i].charAt(args[i].length - 1) == ":") {
                        amtstring = args[i].slice(0, -1);
                    } else {
                        amtstring = args[i];
                    }
                    if (!isNaN(amtstring) && amtstring !== "") {
                        amts.push(parseFloat(amtstring));
                        arrs.push(args.splice(i + 1, args.length - i));
                        args.splice(i, 1);
                    } else {
                        return;
                    }
                } else if (i === 0) {
                    amts.push(1);
                    arrs.push(args);
                }
            }
        }
        var scoreboard = sh.getScoreboardById(roomId);
        var success = "";
        for (let i = 0; i < arrs.length; i++) {
            var amt = amts[i];
            amt = command === "penalty" ? amt * -1 : command === "half" ? amt * 0.5 : command === "penaltyhalf" ? amt * -0.5 : amt;
            newargs = arrs[i].join(" ").split(",");
            var points = amt === 1 ? "point" : "points";
            var next = "Added " + amt + " " + points + " for ";
            let j, k;
            for (j = 0, k = 0; j < newargs.length; j++) {
                if (newargs[j] === "")
                    continue;
                if (j != 0)
                    next += ", ";
                next += newargs[j].trim();
                k++;
            }
            if (k === 0)
                continue;
            next += ".\n";
            success += next;
                if (scoreboard !== null) {		
                    scoreboard.addScores(newargs, amt);
                    sh.saveScoreboards();

                } else {
                    client.sendText(roomId, "Could not find scoreboard.");
                    return;
                }

        }
        if (success !== "") {
            client.sendMessage(roomId, {
                "msgtype": "m.text",
                "body": scoreboard.buildScoreboard(),
                "format": "org.matrix.custom.html",
                "formatted_body": scoreboard.buildScoreboard()
            });
            client.sendText(roomId, success);
        }
    }

});

client.start().then(() => {
    console.log("Client started!");
    sh.loadScoreboards();
});
