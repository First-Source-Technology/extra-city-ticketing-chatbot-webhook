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
// require("dotenv").config();

const { v4: uuidv4 } = require("uuid");

moment().format("LLL");

// We need to require firebase-admin so we can access firebase
var admin = require("firebase-admin");

var serviceAccount = require("./config/extracitywebhook-firebase-adminsdk-1eeft-734192acdb.json");
const { default: paynow } = require("paynow/dist/paynow");
// const { response, response } = require("express");
// const { time } = require("uniqid");

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

//ip
const ip = process.env.IP;

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
    agent.end("");
  }

  function askName(agent) {
    agent.add("I am an AI assistant, you can call me Lynx");
    agent.end("");
  }

  function bitOff(agent) {
    agent.add("That's what I'm trying to figure out...");
    agent.end("");
  }

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

    agent.end("");
  }

  // Get Traveller's Name
  function askTravellersName(agent) {
    agent.add("May I have your first name and surname to finish booking?");

    agent.end("");
  }

  //Get Traveller's Phone
  function askTravellersPhone(agent) {
    var firstname = agent.context.get("capture-fullname").parameters.firstname;
    var lastname = agent.context.get("capture-fullname").parameters.lastname;
    var person = agent.context.get("confirm-booking").parameters.person;

    var name = `${firstname} ${lastname}`;
    if (name === null) {
      agent.add(
        "The name of the one travelling is required. The section cannot be empty."
      );
    } else {
      console.log(name);
      agent.add("May I have your mobile phone number. \n\nFormat: 0776814472");
    }

    agent.end("");
  }

  // ticket id function
  function ticketID() {
    //format: ExC-yymmdd-count

    const date = new Date();
    var dateString = formatDate(date);
    var num = (Math.floor(Math.random() * 1000) + 1).toString();
    num.length == 1 && (num = "0" + num);
    num.length == 2 && (num = "0" + num);

    return `Extra City-${dateString}-${num}`;
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
  //ticket number
  function generateInvoiceNumber() {
    //invoice number format INV-yymmdd-count INV-20210218-009
    //get date
    const date = new Date();
    const dateString = formatDate(date);

    //var newNumber = (lastNumber + 1).toString();
    var newNumber = (Math.floor(Math.random() * 1000) + 1).toString();
    newNumber.length == 1 && (newNumber = "0" + newNumber);
    newNumber.length == 2 && (newNumber = "0" + newNumber);

    return `INV-${dateString}-${newNumber}`;
  }

  function askEmailAddress(agent) {
    agent.add("May I have your email address. \n\nFormat andilem@yahoo.com");
    agent.end("");
  }

  function askPaymentMethod(agent) {
    agent.context.set({
      name: "backend-captured-email",
      lifespan: 6,
      parameters: {
        email: agent.query,
      },
    });

    agent.add("How will you settle this transaction?");
    agent.add(new Suggestion("EcoCash"));
    agent.add(new Suggestion("OneMoney"));
    agent.end("");
  }

  function askMobileMoneyNumber(agent) {
    agent.add(
      "May I have your mobile money account number? example; 07XXXXXXXX"
    );
    agent.end("");
  }

  function paymentConfirmation(agent) {
    //testing
    // const amount = agent.parameters.amount;
    // console.log("Amount: $" + amount.amount);
    agent.add("Confirm payment");
    agent.add(new Suggestion("Yes"));
    agent.add(new Suggestion("No"));
    agent.end("");
  }

  async function checkPaymentStatus(agent) {
    const pollUrl = agent.context.get("capture_payment_status_information")
      .parameters.pollUrl;
    const amount = agent.context.get("capture_payment_status_information")
      .parameters.amount;
    const ticketID = agent.context.get("capture_payment_status_information")
      .parameters.ticketID;
    const trip = agent.context.get("capture_payment_status_information")
      .parameters.trip;
    const date = agent.context.get("capture_payment_status_information")
      .parameters.date;
    const time = agent.context.get("capture_payment_status_information")
      .parameters.time;
    const phone = agent.context.get("capture_payment_status_information")
      .parameters.phone;

    let paynow = new paynow(
      process.env.PAYNOW_INTEGRATION_ID,
      process.env.PAYNOW_INTEGRATION_KEY
    );
    let response = await response.pollTransaction(pollUrl);
    let status = await response.status;
    if (
      status === "paid" ||
      status === "awaiting delivery" ||
      status === "delivered"
    ) {
      agent.add(
        `You have successfully booked your ticket! \r\n` +
          `Poll URL: ${pollUrl} \r\n` +
          `TICKET ID: ${ticketID} \r\n` +
          `AMOUNT: ZWL$${amount.amount} \r\n` +
          `TRIP: ${trip} \r\n` +
          `DATE: ${date} \r\n` +
          `TIME: ${time} \r\n` +
          `PHONE: ${phone} \r\n`
      );
    } else {
      if (
        status === "cancelled" ||
        status === "refunded" ||
        status === "disputed"
      ) {
        agent.add("Booking transaction cancelled!");
      } else if (
        status === "sent" ||
        status === "pending" ||
        status === "created"
      ) {
        agent.add("You have not completed your payment!");
      }
    }
  }

  async function processPayment(agent) {
    var firstname = agent.parameters.firstname;
    var lastname = agent.parameters.lastname;
    var person = agent.parameters.person;
    var phone = agent.parameters.phoneNumber;
    var travelFrom = agent.parameters.travelFrom;
    var travelTo = agent.parameters.travelTo;
    var travelDate = agent.parameters["travel-date"];
    var travelTime = agent.parameters["travel-time"];

    // payment
    var email = agent.parameters.email;
    var paymentMethod = agent.parameters.paymentMethod;
    var paymentAccount = agent.parameters.paymentAccount;

    //invoiceNumber
    var invoiceNumber = generateInvoiceNumber();

    // save human readable date
    const dateObject = new Date();

    //new Uni Timestamp
    var momentTravelDate = moment(travelDate, "YYYY-MM-DD HH:mm:ss").toDate();

    //Let's join firstname and lastname
    var fullname = `${firstname} ${lastname}`;
    var trip = `${travelFrom} to ${travelTo}`; // save trip instead of travelFrom and travelTo
    var tripReverse = `${travelTo} to ${travelFrom}`;

    //ticket // IDEA:
    const id = uuidv4();
    const ticketId = ticketID();

    var amount = 0;
    var possibleTrips = {
      //Departure Bulawayo
      "Bulawayo to Harare": 2500.0,
      "Bulawayo to Gweru": 1000.0,
      "Bulawayo to Kwekwe": 1500.0,
      "Bulawayo to Kadoma": 1800.0,
      "Bulawayo to Hwange": 2000.0,
      "Bulawayo to Victoria Falls": 2500.0,

      //Departure Harare
      "Harare to Bulawayo": 2500.0,
      "Harare to Gweru": 1500.0,
      "Harare to Kadoma": 1500,
      "Harare to Kwekwe": 1300,

      //Departure Gweru
      "Gweru to Bulawayo": 1000.0,
      "Gweru to Kwekwe": 800.0,
      "Gweru to Kadoma": 1000.0,
      "Gweru to Harare": 1500.0,

      //Departure Victoria Falls
      "Victoria Falls to Hwange": 500.0,
      "Victoria Falls to Bulawayo": 2500.0,

      //Departure Kwekwe
      "Kwekwe to Bulawayo": 1500.0,
      "Kwekwe to Gweru": 800.0,
      "Kwekwe to Harare": 1000.0,
      //Departure Chegutu
      //Departure Kadoma
      //Departure Hwange
      "Hwange to Victoria Falls": 500.0,
      "Hwange to Bulawayo": 2000.0,
    };

    if (trip in possibleTrips) {
      amount = possibleTrips[trip];
    } else if (tripReverse in possibleTrips) {
      amount = possibleTrips[tripReverse];
    } else {
      amount = 2000.0;
    }

    // const accessKeyId = process.env.INTEGRATION_ID;
    // const secretAccessKey = process.env.INTEGRATION_KEY;

    //testing
    console.log(
      `Invoice Number: ${invoiceNumber} \nPayment Phone: ${paymentAccount} \nPayment Option: ${paymentMethod} \nEmail: ${email}`
    );

    let paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID,
      process.env.PAYNOW_INTEGRATION_KEY
    );

    let payment = paynow.createPayment(ticketId, email);

    // let cellAccount = payPhone || "0771111111";
    // let option = payOption || "ecocash";

    payment.add(`Booking(${trip})`, amount);

    response = await paynow.sendMobile(
      payment,
      paymentAccount,
      paymentMethod.toLowerCase()
    );

    if (response.success) {
      if (response.success) {
        let paynowReference = response.pollUrl;

        agent.add(
          "A popup will appear, enter your PIN number to complete the payment. After making your payment, click CHECK PAYMENT STATUS"
        );

        agent.add(new Suggestion("CHECK PAYMENT STATUS"));
        agent.context.set("capture_payment_status_information", 5, {
          ID: id,
          "First Name": firstname,
          "Last Name": lastname,
          Person: person,
          pollUrl: paynowReference,
          "Ticket ID": ticketId,
          Amount: amount,
          Trip: trip,
          Date: momentTravelDate,
          "Booking Time": time,
          "Travel Time": travelTime,
          "Phone Number": phone,
          "Date Object": dateObject,
          "Payment Method": paymentMethod,
          "Payment Account Number": paymentAccount,
          Email: email,
        });

        return;

        //save to db
        // return db
        //   .collection("Booking")
        //   .add({
        //     id: id,
        //     invoiceNumber: invoiceNumber,
        //     fullname: fullname,
        //     // person: person,
        //     phone: phone,
        //     payPhone: payPhone || cellAccount,
        //     email: email,
        //     payOption: payOption || option,
        //     date: momentTravelDate,
        //     timestamp: dateObject,
        //     ticketId: ticketId,
        //     trip: trip,
        //     travelTime: travelTime,
        //     paynowReference: paynowReference,
        //   })
        //   .then(
        //     (ref) => console.log("Booking successful"),
        //     agent.add("Booking successful")
        //   );
      } else {
        agent.add("Whoops, something went wrong!");
        console.log(response.error);
      }
      // })
      // .catch((ex) => {
      //   console.log("Something didn't go quite right. Error: ", ex);
      // });
    }

    //finished
    // function done(agent) {
    //   agent.add(
    //     "Thank you for using Extracity Luxury Coaches. We hope to see you again."
    //   );
    // }
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
  // intentMap.set("done", done);
  // intentMap.set("confirmBooking", confirmBooking);
  intentMap.set("confirmationMessage", confirmationMessage);
  // intentMap.set("viewTickets", viewTickets);
  // intentMap.set("issuedTo", issuedTo);
  intentMap.set("somethingNice", somethingNice);
  intentMap.set("somethingCrazy", somethingCrazy);

  //payments
  intentMap.set("askEmailAddress", askEmailAddress);
  intentMap.set("askPaymentMethod", askPaymentMethod);
  intentMap.set("askMobileMoneyNumber", askMobileMoneyNumber);
  // intentMap.set("paymentAmount", paymentAmount);
  intentMap.set("paymentConfirmation", paymentConfirmation);
  intentMap.set("processPayment", processPayment);
  intentMap.set("checkPaymentStatus", checkPaymentStatus);

  agent.handleRequest(intentMap);
});

app.listen(port, ip, () => {
  console.log(`Server is live at port ${port}`);
  console.log("Press Ctrl+C to abort connection");
});
