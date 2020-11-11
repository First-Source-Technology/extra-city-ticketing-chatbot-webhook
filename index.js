// let's get hacking
// Author: Andile Jaden Mbele
// Program: index.js
// Purpose: webhook for Extra City AI Assistant

const express = require('express');
const app = express();
const dfff = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');


var admin = require("firebase-admin");

var serviceAccount = require("./config/extracitywebhook-firebase-adminsdk-1eeft-734192acdb.json");

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://extracitywebhook.firebaseio.com"
    });

    console.log("Connected to DB");
    
} catch (error) {
    console.log(`Error here ${error}`);
}

var db = admin.firestore();


//Let's define port number
const port = process.env.PORT || 8000

app.get('/', (req, res)=> {
    res.send("We are serving live.")
});

app.post('/dialogflow-fulfillment', express.json(), (req, res)=>{
    const agent = new dfff.WebhookClient({
        request : req,
        response : res
    });

    function demo(agent) {
        agent.add("We are live, sending response from Webhook server as [Version 1.1.11.1]");
        agent.add("Okay lett's see what we can get up to today");
    }

    function somethingNice(agent) {
        agent.add("You are amazing bro. 120 lines of code in 5 hours, 1hr 40mins of actually keystrokes and 18 git commits, not forgetting that you also deployed to Google Cloud Functions and Heroku as well and the whole thing works flawlessly. That's pretty dope to me.");
    }

    function somethingCrazy(agent) {
        agent.add("Let's dismantle all that we have done in the last 30 days and start afresh, this time 10x faster. Simply because I know you can haha");
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
    // Confirming #capture-fullname.firstname #capture-fullname.lastname with phone number $phone-number wishes to travel from #capture-to.travel-from to #capture-date.travel-to on #capture-schedule.travel-date.original in the #confirm-booking.travel-time

    function confirmationMessage(agent){
        var firstname = agent.context.get("capture-fullname").parameters.firstname;
        var lastname = agent.context.get("capture-fullname").parameters.lastname;
        var phone = agent.context.get("confirm-ticket").parameters["phone-number"];
        var travelFrom = agent.context.get("capture-to").parameters["travel-from"];
        var travelTo = agent.context.get("capture-date").parameters["travel-to"];
        var travelDate = agent.context.get("capture-schedule").parameters["travel-date"];
        var travelTime = agent.context.get("confirm-booking").parameters["travel-time"];

        agent.add(`BOOKING CONFIRMATION \nFULL NAME: ${firstname} ${lastname}, \nPHONE NUMBER: ${phone}, \nTRIP: ${travelFrom} to ${travelTo}, \nDATE: ${travelDate}, \nTIME: ${travelTime} \nSafe Travels with City Link`);

        return db.collection('tickets').add({
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
            console.log("Ticket details added")
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
});