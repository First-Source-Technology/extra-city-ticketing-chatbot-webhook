// let's get hacking
// Author: Andile Jaden Mbele
// Program: index.js
// Purpose: webhook for Extra City AI Assistant

const express = require("express");
const app = express();
const dfff = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");
var moment = require("moment");
const { Paynow } = require("paynow");
require("dotenv").config();

const { v4: uuidv4 } = require("uuid");

moment().format("LLL");

// We need to require firebase-admin so we can access firebase
var admin = require("firebase-admin");

var serviceAccount = require("./config/extracitywebhook-firebase-adminsdk-1eeft-734192acdb.json");

// Use a try catch so we can log errors
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://extracitywebhook.firebaseio.com",
  });

  console.log("Connected to the Firestore Database");
} catch (error) {
  console.log(`Error here ${error}`);
}

// db access using firestore instead of the realtime database
var db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

//Let's define port number
const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Your application is running with no issues.");
});

// whatever we may want to output we will write it in here
app.post("/booking", express.json(), (req, res) => {
  const agent = new dfff.WebhookClient({
    request: req,
    response: res,
  });

  // First function, let's test if we are running live
  function demo(agent) {
    agent.add("We are live, sending response from Webhook server as [v45]");
  }

  // Second function: this is for telling something nice
  function somethingNice(agent) {
    agent.add("You are amazing");
  }

  // this function tells something cute
  function somethingCrazy(agent) {
    agent.add(
      `If you are driving down the road and pass a field with hay bales laying in it, point at the field and yell 'Hey'.`
    );
  }

  function askName(agent) {
    agent.add("I am an AI assistant, you can call me Lynx");
  }

  function bitOff(agent) {
    agent.add("That's what I'm trying to figure out...");
  }

  // Prompt the user for where they're travelling from
  // function askBookingFrom(agent) {
  //   const departure = `Please tell us where you are traveling from? \n\nRoutes covered include Bulawayo, Chegutu, Gweru, Kadoma, Kwekwe, Harare, Hwange and Victoria Falls.`;

  //   agent.add(departure);
  // }

  // // Prompt the user for where they're travelling to
  // function askBookingTo(agent) {
  //   const destination = `What is your travel destination? \n\nRoutes covered include Bulawayo, Chegutu, Gweru, Kadoma, Kwekwe, Harare, Hwange and Victoria Falls.`;

  //   agent.add(destination);
  // }

  //let's get the time right
  function askBookingDate(agent) {
    let travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    let travelTo = agent.context.get("capture-date").parameters.travelTo;

    //simplify
    const trip = `${travelFrom} to ${travelTo}`;

    if (travelFrom == travelTo) {
      console.log(trip);
      agent.add(
        `The trip departure point cannot be the same as the destination.`
      );
      //Quickly replies
      agent.add(new Suggestion("Start Over"));
      agent.add(new Suggestion("Cancel"));

      //this starts here
    } else if (travelFrom == null) {
      console.log("Departure point and Destination cannot be blank");
      agent.add(`The Departure point cannot be empty.`);

      // Suggestions
      agent.add(new Suggestion(`Start Over`));
      agent.add(new Suggestion(`Cancel`));
    } else {
      console.log(trip);
      agent.add(
        `On what date would you like to travel? \n\nExample: 30 January 2021 or next week Thursday`
      );
    }
  }

  // Get Traveller's Name
  function askTravellersName(agent) {
    agent.add("May I have your first name and surname to finish booking?");
  }

  //Get Traveller's Phone
  function askTravellersPhone(agent) {
    var firstname = agent.context.get("capture-fullname").parameters.firstname;
    var lastname = agent.context.get("capture-fullname").parameters.lastname;
    var person = agent.context.get("capture-fullname").parameters.person;

    var name = `${firstname} ${lastname}`;
    if (name == null || name == "" || person == null) {
      agent.add(
        "The name of the one travelling is required. The section cannot be empty."
      );
    } else {
      agent.add("May I have your mobile phone number. \n\nFormat: 0776814472");
    }
  }

  // ticket id function
  function ticketID() {
    //format: ExC-yymmdd-count

    const date = new Date();
    var dateString = formatDate(date);
    var num = (Math.floor(Math.random() * 1000) + 1).toString();
    num.length == 1 && (num = "0" + num);
    num.length == 2 && (num = "0" + num);

    return `ExC-${dateString}-${num}`;
  }

  //format date
  function formatDate(date) {
    let str = "";
    var y = date.getFullYear().toString();
    var m = (date.getMonth() + 1).toString();
    var d = date.getDate().toString();

    d.length == 1 && (d = "0" + d);
    m.length == 1 && (m = "0" + m);

    str = y + m + d;
    return str;
  }

  // save the user data to the db
  function confirmationMessage(agent) {
    var firstname = agent.context.get("capture-fullname").parameters.firstname;
    var lastname = agent.context.get("capture-fullname").parameters.lastname;
    var person = agent.context.get("capture-fullname").parameters.person;
    var phone = agent.context.get("confirm-ticket").parameters.phoneNumber;
    var travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    var travelTo = agent.context.get("capture-date").parameters.travelTo;
    var travelDate = agent.context.get("capture-schedule").parameters[
      "travel-date"
    ];
    var travelTime = agent.context.get("confirm-booking").parameters[
      "travel-time"
    ];

    // save human readable date
    const dateObject = new Date();

    //new Uni Timestamp
    var momentTravelDate = moment(travelDate, "YYYY-MM-DD HH:mm:ss").toDate();

    //Let's join firstname and lastname
    var fullname = `${firstname} ${lastname}`;
    var trip = `${travelFrom} to ${travelTo}`; // save trip instead of travelFrom and travelTo

    //ticket // IDEA:
    var ticketId = ticketID();

    //reservation id
    // var reservationId = uuidV1();

    //testing
    console.log(
      `\n\nNAME: ${
        fullname || person.name
      } \nPHONE NUMBER: ${phone} \nTRIP: ${trip} \nDATE: ${travelDate} \nTIME: ${travelTime} \nTicket ID: ${ticketId} \nMoment Time: ${momentTravelDate}`
    );

    // Telegram
    agent.add(
      `TICKET BOOKING CONFIRMATION \nFULL NAME: ${
        fullname || person.name
      } \nPHONE NUMBER: ${phone} \nTRIP: ${trip} \nTRAVEL DATE: ${momentTravelDate} \nTRAVEL TIME: ${travelTime} \nTICKET ID: ${ticketId} \n\nSafe Travel with Extracity Luxury`
    );

    return db
      .collection("ticketReservation")
      .add({
        // firstname: firstname,
        // lastname: lastname,
        fullname: fullname,
        person: person,
        phone: phone,
        trip: trip,
        travelFrom: travelFrom,
        travelTo: travelTo,
        travelDate: momentTravelDate,
        timeOfTravel: travelTime,
        bookingTime: dateObject,
        ticketId: ticketId,
      })
      .then(
        (ref) =>
          //fetching free slots
          console.log("Ticket successfully reserved"),
        agent.add(new Suggestion(`Proceed to payment`)),
        agent.add(new Suggestion(`Cancel`))
      );
  }

  //payment functions
  function paymentEmail(agent) {
    agent.add("May we have your email address?");
  }

  function paymentMobileNumber(agent) {
    agent.add(
      "May we have your phone number which you'll for mobile transfer. \n\nFormat: 07XXXXXXXX"
    );
  }

  function paymentAmount(agent) {
    agent.add("Please enter the amount you're paying in ZWL e.g 800");
  }

  function generateInvoiceNumber() {
    //invoice number format INV-yymmdd-count INV-20210218-009
    //get date
    const date = new Date();
    const dateString = formatDate(date);
    var lastNumber = 0;

    //var newNumber = (lastNumber + 1).toString();
    var newNumber = (Math.floor(Math.random() * 1000) + 1).toString();
    newNumber.length == 1 && (newNumber = "0" + newNumber);
    newNumber.length == 2 && (newNumber = "0" + newNumber);

    return `INV-${dateString}-${newNumber}`;
  }

  function processPayment(agent) {
    var firstname = agent.parameters.firstname;
    var lastname = agent.parameters.lastname;
    // var person = agent.context.parameters.person;
    var phone = agent.parameters.phoneNumber;
    var travelFrom = agent.parameters.travelFrom;
    var travelTo = agent.parameters.travelTo;
    var travelDate = agent.parameters["travel-date"];
    var travelTime = agent.parameters["travel-time"];

    // save human readable date
    const dateObject = new Date();

    //new Uni Timestamp
    var momentTravelDate = moment(travelDate, "YYYY-MM-DD HH:mm:ss").toDate();

    //Let's join firstname and lastname
    var fullname = `${firstname} ${lastname}`;
    var trip = `${travelFrom} to ${travelTo}`; // save trip instead of travelFrom and travelTo

    //ticket // IDEA:
    var id = uuidv4();
    var ticketId = ticketID();

    //payments
    const invoiceNumber = generateInvoiceNumber();
    var payEmail = agent.context.get("paymentEmail-followup").parameters.email;
    var payPhone = agent.context.get("paymentMobileNumber-followup").parameters[
      "phone-number"
    ];
    var payOption = agent.context.get("paymentChoice-followup").parameters
      .payOption;
    var amount = agent.context.get("paymentAmount-followup").parameters.amount;

    // let paynow_id = process.env.INTEGRATION_ID;
    // let paynow_key = process.env.INTEGRATION_KEY;

    // let server = {
    //   accessKeyId: process.env.INTEGRATION_ID,
    //   secretAccessKey: process.env.INTEGRATION_KEY,
    // };

    let paynow = new Paynow(
      process.env.INTEGRATION_ID,
      process.env.INTEGRATION_KEY
    );

    let payment = paynow.createPayment(invoiceNumber, payEmail);
    payment.add("Booking", amount);
    paynow
      .sendMobile(payment, payPhone, payOption)
      .then(function (response) {
        if (response.success) {
          agent.add(
            "You have successfully paid $" +
              amount.amount +
              ". Your invoice number is " +
              invoiceNumber
          );
          var paynowReference = response.pollUrl;

          //save to db
          return db
            .collection("Booking")
            .add({
              id: id,
              invoiceNumber: invoiceNumber,
              fullname: fullname,
              // person: person,
              phone: phone,
              payPhone: payPhone,
              email: payEmail,
              payOption: payOption,
              date: momentTravelDate,
              timestamp: dateObject,
              ticketId: ticketId,
              trip: trip,
              travelTime: travelTime,
              paynowReference: paynowReference,
            })
            .then((ref) => console.log("Success"), agent.add("Success"));
        } else {
          agent.add("Whoops, something went wrong!");
          console.log(response.error);
        }
      })
      .catch((ex) => {
        agent.add("Whoops, something went wrong!");
        console.log("Something is really wrong", ex);
      });
  }

  //finished
  function done(agent) {
    agent.add(
      "Thank you for using Extracity Luxury Coaches. We hope to see you again."
    );
  }

  // view all ordered tickets
  function viewTickets() {
    agent.add(`We're yet to work on this function`);
  }

  // reading data from db
  function issuedTo(agent) {
    // name
    var name = agent.context.get("viewTicket").parameters.person;
    // var surname = agent.context.get("viewTicket").parameters["last-name"];
    // const phone = agent.context.get("viewTicket").parameters.phone;
    const docRef = db.collection("tickets").doc(sessionId);

    return docRef
      .get()
      .then((doc) => {
        if (!doc.exists) {
          agent.add("No data found in the database!");
          console.log(doc);
        } else {
          agent.add(doc.data().name);
        }
        return Promise.resolve("Read Complete");
      })
      .catch(() => {
        agent.add(
          "Could not retrieve your ticket information from the database"
        );
      });
  }

  // intentMaps are more like a register for all functions
  var intentMap = new Map();
  intentMap.set("webhookDemo", demo);
  // intentMap.set("askBookingFrom", askBookingFrom);
  // intentMap.set("askBookingTo", askBookingTo);
  intentMap.set("askBookingDate", askBookingDate);
  intentMap.set("askName", askName);
  intentMap.set("bitOff", bitOff);
  intentMap.set("askTravellersName", askTravellersName);
  intentMap.set("askTravellersPhone", askTravellersPhone);
  intentMap.set("done", done);
  // intentMap.set("confirmBooking", confirmBooking);
  intentMap.set("confirmationMessage", confirmationMessage);
  intentMap.set("viewTickets", viewTickets);
  intentMap.set("issuedTo", issuedTo);
  intentMap.set("somethingNice", somethingNice);
  intentMap.set("somethingCrazy", somethingCrazy);

  //payments
  intentMap.set("paymentEmail", paymentEmail);
  intentMap.set("paymentMobileNumber", paymentMobileNumber);
  intentMap.set("paymentAmount", paymentAmount);
  intentMap.set("paymentConfirmation - yes", processPayment);

  agent.handleRequest(intentMap);
});

app.listen(port, () => {
  console.log(`Server is live at port ${port}`);
  console.log("Press Ctrl+C to abort connection");
});
