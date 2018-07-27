const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const socket = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3000;
const PORT_SOCKET = 5000;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json()); // middleware per il parsing del json nelle richieste POST


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Socket

const server_socket = app.listen(PORT_SOCKET, () => {
    console.log(`server in ascolto sulla ${PORT_SOCKET} per le socket`);
});


const io = socket(server_socket);

io.on('connection', (socket) => {
   
});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function esplodeESpaccaTutto(parameters) {
    var request = require('request');
        request(`https://api.telegram.org/bot698041077:AAEJYAbxzx-iYCoGKcsorCyDLH57mHgcl4Q/sendMessage?chat_id=82262321&text=${JSON.stringify(parameters)}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the google web page.
            }
        })
    io.sockets.emit('sfondo', {
        colore: parameters.colore
    })
}


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


const validContextsArray = [
    "modifica_pagina_web",
    "modifica_sfondo"
]

function handleOutputContexts(obj, parameters) {

    let validContexts = [];
    for (let i = 0; i < obj.length; i++) {
        let currentContext = obj[i].name.split('/').reverse()[0];

        // telegram
        var request = require('request');
        request(`https://api.telegram.org/bot698041077:AAEJYAbxzx-iYCoGKcsorCyDLH57mHgcl4Q/sendMessage?chat_id=82262321&text=${currentContext}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // Print the google web page.
            }
        })
        // telegram

        for (let j = 0; j < validContextsArray.length; j++) {
            if (currentContext === validContextsArray[j]) {
                validContexts.push(currentContext);

                if (currentContext === "modifica_sfondo") {
                    esplodeESpaccaTutto(parameters);
                }

            }
        }
    }
    return validContexts;
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


app.get("/", (req, res) => {
    res.send("Hello from jfet!");
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



app.post('/', function (req, res) {

    const response = req.body; // il middlewar trasforma il json presente nel body di req in un oggetto
    const whatToSay = response.queryResult.fulfillmentText;
    const action = response.queryResult.action;
    const allRequiredParamsPresent = response.queryResult.allRequiredParamsPresent;
    const parameters = response.queryResult.parameters;
    const outputContexts = response.queryResult.outputContexts;
    const outputValidContexts = handleOutputContexts(outputContexts, parameters);
    const intent = response.queryResult.intent;
    const responseObject = {
        "fulfillmentText": whatToSay,
        "source": "simomarco.spacchiamotutto.itcomorg",
        "outputContexts": outputValidContexts
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

    

 */

    /*
    // Telegram --------------------------
    var request = require('request');
    request(`https://api.telegram.org/bot698041077:AAEJYAbxzx-iYCoGKcsorCyDLH57mHgcl4Q/sendMessage?chat_id=82262321&text=${JSON.stringify(req.body)}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the google web page.
        }
    })*/


});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


const server = app.listen(PORT, () => {
    console.log(`server in ascolto sulla ${PORT}`);
});


