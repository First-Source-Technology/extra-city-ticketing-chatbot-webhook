// let's get hacking
// Author: Andile Jaden Mbele
// Program: index.js
// Purpose: webhook for Extra City AI Assistant

const express = require('express');
const app = express();
const dfff = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

// We need to require firebase-admin so we can access firebase
var admin = require("firebase-admin");

var serviceAccount = require("./config/extracitywebhook-firebase-adminsdk-1eeft-734192acdb.json");

// Use a try catch so we can log errors
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://extracitywebhook.firebaseio.com"
    });

    console.log("Connected to the Firestore Database");
    
} catch (error) {
    console.log(`Error here ${error}`);
}

// db access using firestore instead of the realtime database
var db = admin.firestore();


//Let's define port number
const port = process.env.PORT || 8000

app.get('/', (req, res)=> {
    res.send("Your application is running with no issues.")
});


// whatever we may want to output we will write it in here
app.post('/dialogflow-fulfillment', express.json(), (req, res)=>{
    const agent = new dfff.WebhookClient({
        request : req,
        response : res
    });

    function demo(agent) {
        agent.add("We are live, sending response from Webhook server as [Version 1.1.11.1]");
    }

    function somethingNice(agent) {
        agent.add("You are amazing");
    }

    function somethingCrazy(agent) {
        agent.add("If you are driving down the road and pass a field with hay bales laying in it, point at the field and yell 'Hey'.");
    }

    function customPayloadDemo(agent){
        var payloadData = {
            "richContent": [
                [
                    {
                        "type": "accordion",
                        "title": "Accordion title",
                        "subtitle": "Accordion subtitle",
                        "image": {
                        "src": {
                            "rawUrl": "https://example.com/images/logo.png"
                            }
                        },
                        "text": "Accordion text"
                    }
                ]
            ]
        }

        agent.add( new dfff.Payload(agent.UNSPECIFIED, payloadData, {sendAsMessage: true, rawPayload: true }) )
        //agent.add("This is the custom payload function")
    }

    function confirmationMessage(agent){
        var firstname = agent.context.get("capture-fullname").parameters.firstname;
        var lastname = agent.context.get("capture-fullname").parameters.lastname;
        var phone = agent.context.get("confirm-ticket").parameters["phone-number"];
        var travelFrom = agent.context.get("capture-to").parameters["travel-from"];
        var travelTo = agent.context.get("capture-date").parameters["travel-to"];
        var travelDate = agent.context.get("capture-schedule").parameters["travel-date"];
        var travelTime = agent.context.get("confirm-booking").parameters["travel-time"];

        agent.add(`BOOKING CONFIRMATION \nFULL NAME: ${firstname} ${lastname} \nPHONE NUMBER: ${phone} \nTRIP: ${travelFrom} to ${travelTo} \nDATE: ${travelDate} \nTIME: ${travelTime} \n\nSafe Travels with Extra City Luxury Coaches`);

        return db.collection('ticketReservation').add({
            firstname: firstname,
            lastname: lastname,
            phone: phone,
            travelFrom: travelFrom,
            travelTo: travelTo,
            travelDate: travelDate,
            travelTime: travelTime,
            time: Date.now()

        }).then(ref =>
            //fetching free slots
            console.log("Ticket successfully reserved")
            )
    }

    var intentMap = new Map();
    intentMap.set('webhookDemo', demo)
    intentMap.set('customPayloadDemo', customPayloadDemo)
    intentMap.set('confirmationMessage', confirmationMessage)
    intentMap.set('somethingNice', somethingNice)
    intentMap.set('somethingCrazy', somethingCrazy)

    agent.handleRequest(intentMap);
});

app.listen(port, () => {
    console.log(`Server is live at port ${port}`)
    console.log('Press Ctrl+C')
});