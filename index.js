// let's get hacking
// Author: Andile Jaden Mbele
// Program: index.js
// Purpose: webhook for Extra City AI Assistant
//https://extracitywebhook.herokuapp.com/booking

const express = require("express");
const app = express();
const dfff = require("dialogflow-fulfillment");
const { Suggestion } = require("dialogflow-fulfillment");
const moment = require("moment");
const { Paynow } = require("paynow");
const pdf = require("html-pdf");
const HummusRecipe = require("hummus-recipe");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
app.use(express.static("public"));

const { v4: uuidv4 } = require("uuid");

moment().format("LLL");

// We need to require firebase-admin so we can access firebase
const admin = require("firebase-admin");

const serviceAccount = require("./config/extracitywebhook-firebase-adminsdk-1eeft-734192acdb.json");
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
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

//Let's define port number
const port = process.env.PORT || 8000;

//ip
const ip = process.env.IP;

app.get("/", (req, res) => {
  res.send("Your application is running with no issues.");
});

app.get("/downloads/:ticketID/:tk", async (req, res) => {
  let ticketID = decodeURIComponent(req.params.ticketID);
  let tk = decodeURIComponent(req.params.tk);
  let rticketID = ticketID.replace(" ", "");
  let path = __dirname + `/downloads/pdf/${rticketID}.pdf`;
  let pathenc = __dirname + `/downloads/pdf/${rticketID}_encrypted.pdf`;

  //get ticket
  await db
    .collection("reservations")
    .where("TicketID", "==", ticketID)
    .limit(1)
    .get()
    .then((snapshot) => {
      if (snapshot.size == 0) {
        res.send("Ticket not found!");
      } else {
        let ticket = snapshot.docs[0].data();
        //if file does not exist the create a new one
        try {
          if (!fs.existsSync(pathenc)) {
            generatePDF(req, ticket, path, pathenc);
          }
        } catch (err) {
          res.send("Whoops! An error occurred");
          console.error(err);
        }

        //hack

        setTimeout(function () {
          if (snapshot.docs[0].id === tk && tk !== null) {
            //res.download(path);
            fs.readFile(path, function (err, data) {
              res.contentType("application/pdf");
              res.send(data);
            });
          } else {
            res.download(pathenc);
          }
        }, 5000);
      }
    })
    .catch((err) => {
      res.send("Whoops! Something went wrong!");
      console.log(err);
    });
});

async function generatePDF(req, ticket, path, pathenc) {
  const options = { format: "A5" };

  await pdf
    .create(getTicketTemplate(req, ticket), options)
    .toFile(path, function (err, res) {
      if (err) return console.log(err);
      console.log(res);
    });

  //now encrypt
  setTimeout(function () {
    const pdfDoc = new HummusRecipe(path, pathenc);
    pdfDoc
      .encrypt({
        userPassword: ticket.PhoneNumber,
        ownerPassword: ticket.PhoneNumber,
        userProtectionFlag: 4,
      })
      .endPDF();
  }, 2000);
  try {
    if (fs.existsSync(pathenc)) {
      //delete path
      fs.unlinkSync(path);
    }
  } catch (err) {
    console.error(err);
  }
}

function getTicketTemplate(req, ticket) {
  formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ticket.Currency ?? "ZWL",
  });

  return `
        <html>
          <head>
            <meta http-equiv=Content-Type content="text/html; charset=UTF-8">
            <link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet"> 
              <style type="text/css">
                  <!--
                  body {
                    display: block;
                    position: relative;
                  }
                  
                  body::after {
                    content: "";
                    background: url(${path.join(
                      "file://",
                      __dirname,
                      "/public/imageedit_1_3395706360.png"
                    )});
                    opacity: 0.2;
                    top: 0;
                    left: 0;
                    bottom: 0;
                    right: 0;
                    position: absolute;
                    z-index: -1;   
                  }
              span.cls_003, td{font-family:Roboto,serif;font-size:15px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              div.cls_003{font-family:Roboto,serif;font-size:15px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              cls_004{font-family:Roboto,serif;font-size:12px;color:rgb(81,81,81);font-weight:normal;font-style:normal;text-decoration: none}
              div.cls_004{font-family:Roboto,serif;font-size:12px;color:rgb(81,81,81);font-weight:normal;font-style:normal;text-decoration: none}
              span.cls_005{font-family:Roboto,serif;font-size:13px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              div.cls_005{font-family:Roboto,serif;font-size:13px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              span.cls_006{font-family:Roboto,serif;font-size:13px;color:rgb(81,81,81);font-weight:normal;font-style:normal;text-decoration: none}
              div.cls_006{font-family:Roboto,serif;font-size:13px;color:rgb(81,81,81);font-weight:normal;font-style:normal;text-decoration: none}
              span.cls_007{font-family:Roboto,serif;font-size:16px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              div.cls_007{font-family:Roboto,serif;font-size:16px;color:rgb(81,81,81);font-weight:bold;font-style:normal;text-decoration: none}
              -->
              </style>
          </head>
          <body>
              <div style="position:absolute;left:0px;top:0px">
                  <div style="text-align: center;"><img src="${path.join(
                    "file://",
                    __dirname,
                    "/public/extracity_luxury_1575462058.gif"
                  )}" height="60px"/></div>
                    <table style="border: 2px solid black; margin: 10px">
                      <tbody>
                          <tr>
                              <td><img src="${path.join(
                                "file://",
                                __dirname,
                                "/public/tick.png"
                              )}" height="30px"/></td>
                              <td>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>
                                                TICKET CONFIRMED
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="cls_004">
                                                Congratulations your ticket has been booked.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                              </td>
                          </tr>
                      </tbody>
                    </table>
                    <table style="margin: 10px">
                        <tbody>
                            <tr>
                                <td class="cls_005"><span class="cls_005">Ref No:</span></td>
                                <td class="cls_005"><span class="cls_005">${
                                  ticket.refNo
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Ticket No:</span></td>
                                <td class="cls_006"><span class="cls_006">${
                                  ticket.TicketID
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Seat No:</span></td>
                                <td class="cls_006"><span class="cls_006">${
                                  ticket.seatNo
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Name:</span></td>
                                <td class="cls_006"><span class="cls_006">${
                                  ticket.fullname
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Mobile No:</span></td>
                                <td class="cls_006"><span class="cls_006">${
                                  ticket.PhoneNumber
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Email address:</span></td>
                                <td class="cls_006"><span class="cls_006">${
                                  ticket.Email
                                }</span></td>
                            </tr>
                        </tbody>
                    </table>
   
                    <table style="margin:10px;border: 2px solid black; min-width: 90%">
                        <tbody>
                            <tr>
                                <td class="cls_007"><span class="cls_007">Depart:${
                                  ticket.TravellingFrom
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">(Station)</span></td>
                            </tr>
                            <tr>
                                <td class="cls_005"><span class="cls_005">${moment(
                                  ticket.Date.toDate()
                                ).format("ll")} ${ticket.TravelTime}</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Checkin 1 Hour before Departure</span></td>
                            </tr>
                        </tbody>
                    </table>
   
                    <table style="margin:10px;border: 2px solid black; min-width: 90%">
                        <tbody>
                            <tr>
                                <td class="cls_007"><span class="cls_007">Arrive: ${
                                  ticket.TravellingTo
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">(Station)</span></td>
                            </tr>
                            <tr>
                                <td class="cls_005"><span class="cls_005">--</span></td>
                            </tr>
                        </tbody>
                    </table>
   
                    <table style="margin: 10px">
                        <tbody>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Booked By:</span><span class="cls_005">${
                                  ticket.fullname
                                }</span></td>
                            </tr>
                            <tr>
                                <td class="cls_005"><span class="cls_005">CALLCENTRE </span><span class="cls_006">${moment(
                                  ticket.BookingTime.toDate()
                                ).format("lll")}</span></td>
                            </tr>
                            <tr>
                                <td class="cls_007"><span class="cls_007">Price: ${formatter.format(
                                  ticket.Amount.replace("$", "USD")
                                )}[${ticket.PaymentMethod}]</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">Terms & Conditions Apply  For</span></td>
                            </tr>
                            <tr>
                                <td class="cls_006"><span class="cls_006">For more info call +263</span></td>
                            </tr>
                        </tbody>
                    </table>
                </body>
              </html>`;
}

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

  async function askTrip() {
    console.log("here");
    let travelFrom = agent.context.get("capture-to").parameters.travelFrom;
    let travelTo = agent.context.get("capture-from").parameters.travelTo;

    //check if there is a price
    let fareRef = await db
      .collection("fares")
      .where("possibleTrips", "array-contains", `${travelFrom}-${travelTo}`)
      .limit(1)
      .get();

    if (fareRef.size == 1) {
      const fare = fareRef.docs[0].data();
      //check if it has a ZWL price
      if (fare.prices.ZWL == undefined) {
        //no ecocash or mobile money payments!
        agent.add(
          "Whoops! Mobile money payments are not accepted for the trip you selected!"
        );
        agent.add(new Suggestion("Start over"));
        agent.add(new Suggestion("Cancel"));
      } else {
        //add to context
        agent.context.set("backend_capture_fare", 13, {
          fare: fare,
        });

        //look for the trips that have travelTo and travelFrom stops
        const tripsRef = await db
          .collection("trips")
          .where("possibleTrips", "array-contains", travelFrom + "-" + travelTo)
          .get();

        if (tripsRef.size == 0) {
          agent.add(
            "Whoops! We currently do not have any coaches covering the trip you specified."
          );
          agent.add(new Suggestion("Start over"));
          agent.add(new Suggestion("Cancel"));
        } else {
          agent.add(
            "These are the routes that cover the trip you specified. Please select one."
          );
          tripsRef.forEach((tripRef) => {
            agent.add(new Suggestion(tripRef.data().name));
          });
        }
      }
    } else {
      agent.add(
        "Whoops! We currently do not have coaches covering the trip you specified!"
      );
      agent.add(new Suggestion("Start over"));
      agent.add(new Suggestion("Cancel"));
    }
  }

  //let's get the time right
  async function askBookingDate(agent) {
    let trip = agent.context.get("capture-trip").parameters.trip;
    //get the trip
    const tripRef = await db
      .collection("trips")
      .where("name", "==", trip)
      .limit(1)
      .get();

    if (tripRef.size == 0) {
      agent.add(
        "Whoops! We currently do not have any coaches covering the trip you specified."
      );
      agent.add(new Suggestion("Start over"));
      agent.add(new Suggestion("Cancel"));
    } else {
      //save trip
      agent.context.set("backend_capture_trip", 12, {
        trip: tripRef.docs[0].data(),
      });
      agent.add(
        `On what date would you like to travel? \n\nExample: 30 January 2021 or next week Thursday`
      );
    }

    agent.end("");
  }

  function askBookingTime(agent) {
    let trip = agent.context.get("backend_capture_trip").parameters.trip;

    if (trip === undefined) {
      agent.add("Whoops! An error occurred please start over");
      agent.add(new Suggestion(`Start Over`));
    } else {
      agent.add(
        "The departures times, the time where the bus leaves " +
          trip.from +
          ", are listed below. Please select one:"
      );
      displayTime(agent, trip);
    }
  }

  function displayTime(agent, trip) {
    trip.times.forEach((time) => {
      agent.add(new Suggestion(time));
    });
  }

  // Get Traveller's Name
  function askTravellersName(agent) {
    let trip = agent.context.get("backend_capture_trip").parameters.trip;
    //check time
    const travelTime =
      agent.context.get("capture-schedule").parameters["travel-time"];
    //check if this time is in the times array
    if (trip === undefined) {
      agent.add("Whoops! An error occurred please start over");
      agent.add(new Suggestion(`Start Over`));
    } else {
      console.log(trip.times, travelTime);
      if (trip.times.includes(padNum(travelTime))) {
        agent.add("May I have your first name and surname to finish booking?");
      } else {
        agent.add(
          "Whoops! We do not have any coaches travelling to your destination at the specified time!"
        );
        displayTime(agent, trip);
      }
    }
  }

  function padNum(num) {
    num = num.toString();
    while (num.length < 4) num = "0" + num;
    return num;
  }

  //Get Traveller's Phone
  function askPhoneNumber(agent) {
    const firstname =
      agent.context.get("ask-phone-number").parameters["given-name"];
    const lastname =
      agent.context.get("ask-phone-number").parameters["last-name"];

    const name = `${firstname} ${lastname}`;
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
    const date = new Date();
    const dateString = formatDate(date);
    const num = (Math.floor(Math.random() * 1000) + 1).toString();
    num.length == 1 && (num = "0" + num);
    num.length == 2 && (num = "0" + num);

    return `ExC-${dateString}-${num}`;
  }

  //format date
  function formatDate(date) {
    let str = "";
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString();
    const d = date.getDate().toString();

    d.length == 1 && (d = "0" + d);
    m.length == 1 && (m = "0" + m);

    str = y + m + d;
    return str;
  }

  //payment functions

  function askEmailAddress(agent) {
    agent.add("May I have your email address. \n\nFormat andilem@yahoo.com");
    agent.end("");
  }

  function askPaymentMethod(agent) {
    agent.add("How will you settle this transaction?");
    agent.add(new Suggestion("ecocash"));
    agent.add(new Suggestion("onemoney"));
    agent.end("");
  }

  function askMobileMoneyNumber(agent) {
    agent.add(
      "May I have your mobile money account number? \n\nExample; 07XXXXXXXX"
    );
    agent.end("");
  }

  function confirmBooking(agent) {
    const firstname =
      agent.context.get("ask-phone-number").parameters["given-name"];
    const lastname =
      agent.context.get("ask-phone-number").parameters["last-name"];

    const phone = agent.context.get("ask-email-address").parameters.phoneNumber;
    const travelFrom = agent.context.get("capture-from").parameters.travelFrom;
    const travelTo = agent.context.get("capture-to").parameters.travelTo;
    const travelTime =
      agent.context.get("capture-schedule").parameters["travel-time"];
    const travelDate =
      agent.context.get("capture-date").parameters["travel-date"];

    //payment constiables
    const email = agent.context.get("ask-payment-method").parameters.email;
    const paymentMethod = agent.context.get("ask-mobile-money-number")
      .parameters.paymentMethod;
    const paymentAccount =
      agent.context.get("confirm-ticket").parameters.paymentAccount;
    const momentTravelDate = moment(travelDate, "YYYY-MM-DD HH:mm:ss").toDate();

    const fullname = `${firstname} ${lastname}`;
    const trip = `${travelFrom} to ${travelTo}`; // save trip instead of travelFrom and travelTo
    const ticketId = ticketID();

    agent.add(
      `Name: ${fullname} \nPhone: ${phone} \nDeparture Point: ${travelFrom} \nArrival Point: ${travelTo} \nTrip: ${trip} \nDate: ${momentTravelDate} \nTime: ${travelTime} \nEmail: ${email} \nPayment Method: ${paymentMethod} \nPayment Account: ${paymentAccount} \nTicket ID #: ${ticketId}`
    );

    agent.add("Confirm Ticket Reservation");
    agent.add(new Suggestion("Yes"));
    agent.add(new Suggestion("No"));
    agent.end("");
  }

  function generateRandomReferenceNumber() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  function generateRandomSeatNumber() {
    const letters = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];

    const seat_letter = letters[Math.floor(Math.random() * 25).toString()];

    const seat_number = (Math.floor(Math.random() * 100) + 1).toString();
    seat_number.length == 1 && (seat_number = "0" + seat_number);

    return seat_letter + seat_number;
  }

  // save the user data to the db
  async function confirmationMessage(agent) {
    const firstname =
      agent.context.get("ask-phone-number").parameters["given-name"];
    const lastname =
      agent.context.get("ask-phone-number").parameters["last-name"];
    const phone = agent.context.get("ask-email-address").parameters.phoneNumber;
    const travelFrom = agent.context.get("capture-from").parameters.travelFrom; //capture-to
    const travelTo = agent.context.get("capture-to").parameters.travelTo; //capture-date
    const travelTime =
      agent.context.get("capture-schedule").parameters["travel-time"];
    const travelDate =
      agent.context.get("capture-date").parameters["travel-date"]; //capture-schedule

    //payment constiables
    const email = agent.context.get("ask-payment-method").parameters.email;
    const paymentMethod = agent.context.get("ask-mobile-money-number")
      .parameters.paymentMethod;
    const paymentAccount =
      agent.context.get("confirm-ticket").parameters.paymentAccount;
    const invoiceNumber = ticketID();
    const momentTravelDate = moment(travelDate, "YYYY-MM-DD HH:mm:ss").toDate();
    // save human readable date
    const timestamp = new Date();

    let trip = agent.context.get("backend_capture_trip").parameters.trip;
    let fare = agent.context.get("backend_capture_fare").parameters.fare;

    const id = uuidv4();
    const ticketId = ticketID();
    console.log(
      `Name: ${fullname} \nPhone: ${phone} \nDeparture Point: ${travelFrom} \nArrival Point: ${travelTo} \nDate: ${travelDate} \nTime: ${travelTime} \nEmail: ${email} \nPayment Method: ${paymentMethod} \nPayment Account: ${paymentAccount} \nReceipt #: ${invoiceNumber}`
    );

    const amount = 0;

    const seatNo = generateRandomSeatNumber();
    const refNo = generateRandomReferenceNumber();

    //get number of active tickets
    const paidCount = (
      await db
        .collection("reservations")
        .where("Trip", "==", trip.name)
        .where("status", "==", "paid")
        .where("Date", "==", momentTravelDate)
        .where("TravelTime", "==", travelTime)
        .get()
    ).size;

    const d = new Date();
    d.setMinutes(d.getMinutes() - 5);

    //get number of pending tickets that were created within 5 minutes
    const pendingCount = (
      await db
        .collection("reservations")
        .where("Trip", "==", trip.name)
        .where("status", "==", "pending")
        .where("Date", "==", momentTravelDate)
        .where("TravelTime", "==", travelTime)
        .where("BookingTime", ">=", d)
        .get()
    ).size;

    if (trip.seats - paidCount - pendingCount < 1) {
      if (trip.seats == paidCount) {
        agent.add(
          "There are no more seats available for the trip you selected! Please contact admin for more information."
        );
      } else {
        agent.add(
          "There are no seats available at the moment. Please check after 5 or so minutes"
        );
      }
    } else {
      let paynow = new Paynow(
        process.env.PAYNOW_INTEGRATION_ID,
        process.env.PAYNOW_INTEGRATION_KEY
      );

      let payment = paynow.createPayment(ticketId, email);
      payment.add(`Booking(${trip})`, fare.prices.ZWL);

      let response = await paynow.sendMobile(
        payment,
        paymentAccount,
        paymentMethod
      );

      if (response.success) {
        let paynowReference = response.pollUrl;

        agent.add(
          "A popup will appear, enter your PIN number to complete the payment. After making your payment, click CHECK PAYMENT STATUS"
        );

        agent.add(new Suggestion("CHECK PAYMENT STATUS"));
        //comment started here
        return db
          .collection("reservations")
          .add({
            ID: id,
            firstName: firstname,
            lastName: lastname,
            fullname: fullname,
            pollURL: paynowReference,
            TicketID: ticketId,
            Amount: fare.prices.ZWL,
            status: "pending",
            Trip: trip.name,
            TravellingFrom: travelFrom,
            TravellingTo: travelTo,
            BookingTime: timestamp,
            PhoneNumber: phone,
            PaymentMethod: paymentMethod,
            MobileMoneyAccount: paymentAccount,
            Email: email,
            TravelTime: travelTime,
            Date: momentTravelDate,
            seatNo: seatNo,
            refNo: refNo,
          })
          .then((ref) => {
            agent.context.set("capture_payment_status_information", 5, {
              ID: id,
              fullName: fullname,
              firstName: firstname,
              lastName: lastname,
              pollUrl: paynowReference,
              ticketID: ticketId,
              amount: amount,
              trip: trip.name,
              date: momentTravelDate,
              bookingTime: timestamp,
              time: travelTime,
              phone: phone,
              paymentMethod: paymentMethod,
              paymentAccountNumber: paymentAccount,
              Email: email,
              docID: ref.id,
            });
            console.log(ref.id);
            agent.add("Ticket successfully reserved");
          });
      } else {
        agent.add("Whoops, something went wrong!");
        console.log(response.error);
      }
    }
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
    const docID = agent.context.get("capture_payment_status_information")
      .parameters.docID;

    let paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID,
      process.env.PAYNOW_INTEGRATION_KEY
    );

    let response = await paynow.pollTransaction(pollUrl);
    let status = await response.status;
    if (true) {
      const link =
        req.headers.host +
        "/downloads/" +
        encodeURIComponent(ticketID) +
        "/pdf";
      //create pdf and send link
      agent.add(
        `You have successfully booked your ticket! \r\n` +
          `Poll URL: ${pollUrl} \r\n` +
          `TICKET ID: ${ticketID} \r\n` +
          `AMOUNT: ZWL${amount} \r\n` +
          `TRIP: ${trip} \r\n` +
          `DATE: ${date} \r\n` +
          `TIME: ${time} \r\n` +
          `PHONE: ${phone} \r\n` +
          `\r\n To download your ticket, click the link below \r\n ` +
          link +
          " \r\n" +
          `File password is ${phone}`
      );

      db.collection("reservations")
        .doc(docID)
        .update({
          status: "paid",
        })
        .then((e) => {
          console.log("success");
        });
    }
  }

  // intentMaps are more like a register for all functions
  const intentMap = new Map();
  intentMap.set("webhookDemo", demo);
  intentMap.set("askBookingDate", askBookingDate);
  intentMap.set("askName", askName);
  intentMap.set("bitOff", bitOff);
  intentMap.set("askTravellersName", askTravellersName);
  intentMap.set("askPhoneNumber", askPhoneNumber);
  intentMap.set("somethingNice", somethingNice);
  intentMap.set("somethingCrazy", somethingCrazy);

  //payments
  intentMap.set("askTrip", askTrip);
  intentMap.set("askEmailAddress", askEmailAddress);
  intentMap.set("askPaymentMethod", askPaymentMethod);
  intentMap.set("askMobileMoneyNumber", askMobileMoneyNumber);
  intentMap.set("confirmBooking", confirmBooking);
  intentMap.set("confirmationMessage", confirmationMessage);
  intentMap.set("checkPaymentStatus", checkPaymentStatus);
  intentMap.set("Ask.booking.schedule", askBookingTime);

  agent.handleRequest(intentMap);
});

app.listen(port, ip, () => {
  console.log(`Server is live at port ${port}`);
  console.log("Press Ctrl+C to abort connection");
});
