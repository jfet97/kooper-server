const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const socket = require('socket.io');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json()); // middleware per il parsing del json nelle richieste POST
app.use(express.static('build'));

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Socket

const server = app.listen(PORT, () => {
    console.log(`server in ascolto sulla ${PORT}`);
});


const io = socket(server);

io.on('connection', (socket) => {
});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function executeChangeColorBackground(parameters) {
    io.sockets.emit('sfondo', {
        colore: parameters.colore
    })
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


const VALID_CONTEXTS = [
    "modifica_pagina_web",
    "modifica_sfondo"
]

function handleOutputContexts(outputContexts) {

    let checkedValidContexts = [];
    for (let i = 0; i < outputContexts.length; i++)
    {
        let currentContextName = outputContexts[i].name.split('/').reverse()[0];
        telegram("contesto: " + currentContextName);
        if (VALID_CONTEXTS.includes(currentContextName)) 
        {
            checkedValidContexts.push(outputContexts[i]);
            telegram("lifespan: " + outputContexts[i].lifespanCount);
        }
    }
    return checkedValidContexts;
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function handleCommands(outputValidContexts, parameters) {
    if (outputValidContexts.map(el => el.name.split('/').reverse()[0]).includes("modifica_sfondo")) {
        executeChangeColorBackground(parameters);
    }
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/* pare che avvenga in automatico lato dialogflow
function updateLifespanCount(outputValidContexts) {
    outputValidContexts.forEach(element => {
        element.lifespanCount--;
    });
}
*/

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



app.post('/', function (req, res) {

    const response = req.body; // il middlewar trasforma il json presente nel body di req in un oggetto
    const whatToSay = response.queryResult.fulfillmentText;
    const action = response.queryResult.action;
    const allRequiredParamsPresent = response.queryResult.allRequiredParamsPresent;
    const parameters = response.queryResult.parameters;
    const outputContexts = response.queryResult.outputContexts;
    const outputValidContexts = handleOutputContexts(outputContexts);
    const intent = response.queryResult.intent;

    handleCommands(outputValidContexts, parameters);
    // updateLifespanCount(outputValidContexts);


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
        }
    })*/


});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++




function telegram(msg) {
    var request = require('request');
    request(`https://api.telegram.org/bot698041077:AAEJYAbxzx-iYCoGKcsorCyDLH57mHgcl4Q/sendMessage?chat_id=82262321&text=${msg}`, function (error, response, body) {
    })
}
