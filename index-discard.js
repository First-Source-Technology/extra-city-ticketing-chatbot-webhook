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

    //payment
    // var email = agent.context.get("askEmailAddress-followup").parameters.email;
    // var paymentMethod = agent.context.get("askPaymentMethod-followup")
    //   .parameters.paymentMethod;
    // var paymentAccount = agent.context.get("askMobileMoneyNumber-followup")
    //   .parameters.paymentAccount;

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