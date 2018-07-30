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

function openMenu() {
    io.sockets.emit('menu', {
        toOpen: true
    })
}

function closeMenu() {
    io.sockets.emit('menu', {
        toOpen: false
    })
}

function swipeCarousel(parameters) {
    io.sockets.emit('carousel', {
        swipe: parameters.direzione
    })
}

function showHideCarousel(parameters) {
    io.sockets.emit('carousel-onoff', {
        what: parameters.carosello_onoff
    })
}

function goToRoute(parameters) {
    let responseObject = {};

    switch (parameters.nome_pagina) {
        case "testo":
            responseObject.goToTesto = true;
            break;
        case "principale":
        default:
            responseObject.goToHome = true;
            break;
    }
    
    io.sockets.emit('change-router', responseObject)
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


const VALID_CONTEXTS = [
    "modifica_pagina_web",
    "modifica_sfondo",
    "apri_menu",
    "chiudi_menu",
    "carosello",
    "carosello_onoff",
    "vai_alla_pagina"
]

function handleOutputContexts(outputContexts) {

    let checkedValidContexts = [];
    for (let i = 0; i < outputContexts.length; i++) {
        let currentContextName = outputContexts[i].name.split('/').reverse()[0];
        // telegram("contesto: " + JSON.stringify(outputContexts[i]));
        // telegram("contesto: " + currentContextName);
        if (VALID_CONTEXTS.includes(currentContextName)) // && typeof outputContexts[i].lifespanCount 
        {
            checkedValidContexts.push(outputContexts[i]);
            // telegram("lifespan: " + (typeof outputContexts[i].lifespanCount));
        }
    }
    return checkedValidContexts;
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function handleCommands(outputValidContexts, parameters) {
    const outputCalidConextsNames = outputValidContexts.map(el => el.name.split('/').reverse()[0]);

    if (outputCalidConextsNames.includes("modifica_sfondo")) {
        executeChangeColorBackground(parameters);
    }
    if (outputCalidConextsNames.includes("apri_menu")) {
        openMenu();
    }
    if (outputCalidConextsNames.includes("chiudi_menu")) {
        closeMenu();
    }
    if (outputCalidConextsNames.includes("carosello")) {
        swipeCarousel(parameters);
    }

    if (outputCalidConextsNames.includes("carosello_onoff")) {
        showHideCarousel(parameters);
    }

    if (outputCalidConextsNames.includes("vai_alla_pagina")) {
        goToRoute(parameters);
    }
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


// Dialogflow, dopo aver ricevuto e analizzato un messaggio, invia
// i dati al server tra i quali sono presenti anche i contesti (proprietà come lifespan incluse e aggiornate)
// nei quali quello specifico messaggio dovrà far ricadere dialogflow stessa. 
// È dialogflow che dice al server cosa il server deve rispondere a dialogflow, per far ricadere 
// l'agent nello stato successivo...i contesti ricevuti dal server non corrispondono a quelli correnti ma a quelli
// immediatamente successivi nei queli l'agent dovrà ricadere...essi vanno rispediti indietro
// Ipotizziamo che lo stato modifica_sfondo sia stato scelto lifespan 1 e che il messaggio parlato sia "imposta lo sfondo di colore blu":
// 1) Dialogflow interpreta il messaggio, riconosce che lo stato successivo sarà modifica_sfondo e informa il server
//    inviandolo come contesto 
// 2) Il server, analizzando il contesto da inviare come risposta, riconosce modifica_sfondo, trova il colore blu ed esegue l'azione
//    per poi rispondere a Dialogflow inviandoli ciò che ha ricevuto: stato = modifica_sfondo e lifespan = 1
// 3) Dialogflow analizza la risposta e imposta lo stato corrente, imponendo l'agent di entrare nello stato modifica_sfondo
// 4) Nuovo messaggio arbitrario, DialogFlow comunica con il server dicendo: "lo stato futuro di modifica_sfondo dovrà essere 0 (oppure undefined)
// 5) Il server, analizzando il contesto da inviare come risposta, riconosce modifica_sfondo, non trova colore quindi si ricade nel caso "bianco" ed esegue l'azione
//    per poi rispondere a Dialogflow inviandoli ciò che ha ricevuto: stato = modifica_sfondo e lifespan = 0/undefined
// 6) Dialogflow analizza la risposta e imposta lo stato corrente, eliminando modifica_sfondo
// Soluzione?
// Facciamo durare a lungo solo lo stato modifica_pagina_web, mentre impostiamo lato dialogflow tutti gli altri stati ad uno
// Quando una frase come "imposta lo sfondo di colore blu" viene detta, dialogflow informa che lo stato futuro dovrà
// essere modifica_sfondo con lifespan 1 ... il server come sempre rileva modifica_sfondo nel contesto FUTURO e il colore ed esegue l'azione
// ma modifica lo stato successivo impostando a zero il lifespan del contesto modifica_sfondo
// dialogflow quindi, sebbene abbia detto al server che il contesto che doveva ricevere in risposta era modifica_sfondo - 1,
// ricevendo modifica_sfondo - 0 nemmeno fa entrare l'agent in quello stato (che quindi sarà stato utile solo lato server) 
// e nel messaggio successivo nemmeno invierà modifica_sfondo - 0, perché inviando i contesti futuri, essendo per dialogflow modifica_sfondo - 0
// il contesto CORRENTE, modifica_sfondo sarà in automatico svanito
function updateLifespanCount(outputValidContexts) {
    outputValidContexts.forEach(element => {
        if (element.name === "modifica_pagina_web") return;
        element.lifespanCount--;
    });
} 1


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
    updateLifespanCount(outputValidContexts);


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
