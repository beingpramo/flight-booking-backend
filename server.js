const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const Amadeus = require('amadeus');


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Sessions
app.use(session({
    secret: 'SECRET_KEY', // replace with your own secret key
    resave: false,
    saveUninitialized: true
  }));


const amadeus = new Amadeus({
  clientId: 'kfAWjvHF1YkfNuTRjhnck1kR5ZuniP4x',
  clientSecret: 'EgAICJAHAjrrKjku'
});


app.get('/', (req, res) => {
    res.render('Home');
  });


// Flights Searching Page
app.get('/bookingpage', (req, res)=>{
    const flightSearchResults = req.session.flightSearchResults;
    console.log("flightSearchResults", flightSearchResults);
    res.render('booking-page', {flightSearchResults: flightSearchResults});
});

app.post('/bookingpage',async(req,res)=>{
    let originLocationCode = req.body.origin;
    let destinationLocationCode = req.body.destination;
    let departureDate = req.body.departureDate;
    let Adults = req.body.adults;

    console.log(originLocationCode, destinationLocationCode, departureDate, Adults);
    let flightSearchResults =  await flightsSearch(originLocationCode, destinationLocationCode,departureDate,Adults);
    req.session.flightSearchResults = flightSearchResults.data;
    res.redirect('/bookingpage');
    
});

// Retrives Flights Information
async function flightsSearch(originLocationCode, destinationLocationCode, departureDate,adults){
 
   return response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: `${originLocationCode}`,
            destinationLocationCode: `${destinationLocationCode}`,
            departureDate: `${departureDate}`,
            adults: `${adults}`,
        })
       
        
}

// flightsSearch('BLR','JAI', '2023-03-13', '2')


// Flight prices Confirmations
app.get('/flightoffersprice/:id', (req,res)=>{

    const flightSearchResults = req.session.flightSearchResults;
    const itemId = req.params.id;
    console.log(itemId);
    const item = flightSearchResults.find(item => item.id === itemId);
    console.log("SELECTED FLIGHT:",item);

    res.render('flightoffersprice', {item})
})


app.post('/flightoffersprice', async(req,res)=>{
    let flightoffersprice = await flightOffersPrice();
    console.log(flightoffersprice);
});


function flightOffersPrice(){

    return response = amadeus.shopping.flightOffersSearch.get({
            originLocationCode: 'SYD',
            destinationLocationCode: 'BKK',
            departureDate: '2023-03-11',
            adults: '1'
            }).then(function(response){
                 return amadeus.shopping.flightOffers.pricing.post(
                 JSON.stringify({
                         'data': {
                         'type': 'flight-offers-pricing',
                         'flightOffers': [response.data[0]]
                            }
             })
             )
             }).then(function(response){
                 console.log(response.data);
             }).catch(function(responseError){
                console.log(responseError);
            });

}

// Creates Booking 

app.get('/bookflight', (req, res)=>{
    res.render('book-flight');

});

app.post('/bookflight', (req, res)=>{
    let response = createFlightOrders();
    // console.log(response);
    res.render('book-flight');
});

function createFlightOrders(){

    amadeus.shopping.flightOffersSearch.get({
            originLocationCode: 'MAD',
            destinationLocationCode: 'ATH',
            departureDate: '2023-04-01',
            adults: '1'
      }).then(function (flightOffersResponse) {
        return amadeus.shopping.flightOffers.pricing.post(
          JSON.stringify({
            "data": {
              "type": "flight-offers-pricing",
              "flightOffers": [
                flightOffersResponse.data[0]
              ]
            }
          })
        );
      }).then(function (pricingResponse) {
        return amadeus.booking.flightOrders.post(
          JSON.stringify({
            'data': {
              'type': 'flight-order',
              'flightOffers': [pricingResponse.data.flightOffers[0]],
              'travelers': [{
                "id": "1",
                "dateOfBirth": "1982-01-16",
                "name": {
                  "firstName": "JORGE",
                  "lastName": "GONZALES"
                },
                "gender": "MALE",
                "contact": {
                  "emailAddress": "jorge.gonzales833@telefonica.es",
                  "phones": [{
                    "deviceType": "MOBILE",
                    "countryCallingCode": "34",
                    "number": "480080076"
                  }]
                },
                "documents": [{
                  "documentType": "PASSPORT",
                  "birthPlace": "Madrid",
                  "issuanceLocation": "Madrid",
                  "issuanceDate": "2015-04-14",
                  "number": "00000000",
                  "expiryDate": "2025-04-14",
                  "issuanceCountry": "ES",
                  "validityCountry": "ES",
                  "nationality": "ES",
                  "holder": true
                }]
              }]
            }
          })
        );
      }).then(function (response) {
        console.log("BOOKED TICKET DETAILS: ",response.data);
      }).catch(function (response) {
        console.error(response);
      });
}
        
// Retrieving the flight Order Details.

app.post('/ordersummary', (req, res)=>{

    let summary =  getBookingDetails();
    console.log(summary);

    res.render('order-summary', {summary})

});


 async function getBookingDetails(){
    const response = await amadeus.booking.flightOrder('eJzTd9cPdA%2FwMDcFAAs1AkI%3D').get();
    // console.log(response);
    return response;
}

// retrieving details 
// getBookingDetails();

app.listen(2000, () => {
    console.log("Live at 2000");
});
