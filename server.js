const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const socket = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3000;






app.use(helmet());
app.use(cors());
app.use(express.json()); // middleware per il parsing del json nelle richieste POST



function handleOutputContexts(obj) {

    for (let i = 0; i < obj.length; i++) {
        if ("lifespanCount" in obj[i]) return obj[i];
    }
    return null;
}


app.get("/", (req, res) => {
    res.send("Hello from jfet!");
});


app.post('/', function (req, res) {

    const response = req.body; // il middlewar trasforma il json presente nel body di req in un oggetto
    const whatToSay = response.queryResult.fulfillmentText;
    const action = response.queryResult.action;
    const allRequiredParamsPresent = response.queryResult.allRequiredParamsPresent;
    const outputContexts = response.queryResult.outputContexts;
    const outputValidContext = handleOutputContexts(outputContexts);
    const intent = response.queryResult.intent;
    const responseObject = {
        "fulfillmentText": whatToSay,
        "source": "simomarco.spacchiamotutto.itcomorg",
        "outputContexts": [outputValidContext]
    }
    res.json(responseObject);

    /* Modello risposta --------------------------
    const responseObject =
    {
        "fulfillmentText": "ciao",
        "fulfillmentMessages": [
            {
                "card": {
                    "title": "card title",
                    "subtitle": "card text",
                    "imageUri": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",
                    "buttons": [
                        {
                            "text": "button text",
                            "postback": "https://assistant.google.com/"
                        }
                    ]
                }
            }
        ],
        "source": "example.com",
        "payload": {
            "google": {
                "expectUserResponse": true,
                "richResponse": {
                    "items": [
                        {
                            "simpleResponse": {
                                "textToSpeech": "this is a simple response"
                            }
                        }
                    ]
                }
            },
            "telegram": {
                "text": `${JSON.stringify(req.body)}`
            }
        },
        "outputContexts": [
            {
                "name": "projects/${PROJECT_ID}/agent/sessions/${SESSION_ID}/contexts/modifica_pagina_web",
                "lifespanCount": 5,
                "parameters": {
                    "param": "param value"
                }
            }
        ]
    }

    // Telegram --------------------------
    var request = require('request');
    request(`https://api.telegram.org/bot698041077:AAEJYAbxzx-iYCoGKcsorCyDLH57mHgcl4Q/sendMessage?chat_id=82262321&text=${JSON.stringify(req.body)}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the google web page.
        }
    })

 */
});

 

const server = app.listen(PORT, () => {
    console.log(`server in ascolto sulla ${PORT}`);
});


// Socket
const io = socket(server);

io.on('connection', (socket) => {
    console.log("made socket connection", socket.id);

    
    socket.on('test', (data) => {
    });


    socket.on('test', (data) => {
    });
});