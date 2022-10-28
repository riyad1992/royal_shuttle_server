const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lvjycge.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization

  if(!authHeader){
    return res.status(401).send({message: 'Unauthorized access'})
  }

  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SCREET, function(err, decoded) {
    if(err){
      return res.status(403).send({message: 'forbidden access'})
    }
    req.decoded = decoded
    next()
  });


}


async function run(){
    try{
        await client.connect();
        const reservationCollection = client.db('royal_shuttle').collection('reservations')
        const userCollection = client.db('royal_shuttle').collection('users')
        const newServiceCollection = client.db('royal_shuttle').collection('newService')
        const airportServiceCollection = client.db('royal_shuttle').collection('airportService')
        const toursCollection = client.db('royal_shuttle').collection('tours')
        const reviewCollection = client.db('royal_shuttle').collection('reviews')

        const verifyAdmin = async(req, res, next) => {
          const requester = req.decoded.email
          const requesterAccount = await userCollection.findOne({email: requester})
          if(requesterAccount.role === 'admin'){
            next()
          }
          else{
            res.status(403).send({message: 'forbidden access'})
          }
        }

        app.get('/user', verifyJWT, async(req, res) => {
          const users = await userCollection.find().toArray()
          res.send(users)
        })

        app.delete('/user/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await userCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.get('/admin/:email', async(req, res) => {
          const email = req.params.email
          const user = await userCollection.findOne({email: email})
          const isAdmin = user.role === 'admin'
          res.send({admin: isAdmin})
        })

        app.put('/user/admin/:email', verifyJWT,verifyAdmin, async(req, res) => {
          const email = req.params.email
          const filter = {email: email}
          const updateDoc = {$set : {role: 'admin'}}
          const result = await userCollection.updateOne(filter, updateDoc)
          res.send(result)
        })

        app.put('/user/:email', async(req, res) => {
          const email = req.params.email
          const user = req.body
          const filter = {email: email}
          const options = {upsert: true}
          const updateDoc = {$set : user}
          const result = await userCollection.updateOne(filter, updateDoc, options)
          const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SCREET, {expiresIn: '1h' })
          res.send({result, token})
        })

        app.get('/bookings', verifyJWT, async(req, res) => {
          const bookings = await reservationCollection.find().toArray()
          res.send(bookings)
        })

        app.delete('/bookings/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await reservationCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.get('/reservations',verifyJWT, async(req, res) =>{
          const passangerEmail = req.query.passangerEmail;
          const decodedEmail = req.decoded.email
          if(passangerEmail === decodedEmail){
            const query = {passangerEmail: passangerEmail};
            const bookings = await reservationCollection.find(query).toArray();
            return res.send(bookings);
          }else{
            return res.status(403).send({message: 'forbidden access'})
          } 
        })

        app.post('/reservations', async (req, res) => {
          const booking = req.body;
          const result = await reservationCollection.insertOne(booking);
          return res.send({ success: true, result });
        })

        app.get('/newservice', async(req, res) => {
          const newService = await newServiceCollection.find().toArray()
          res.send(newService)
        })

        app.get('/newservice/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await newServiceCollection.findOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.delete('/newservice/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await newServiceCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.post('/newservice', verifyJWT,  verifyAdmin, async(req, res) => {
          const newService = req.body
          const result = await newServiceCollection.insertOne(newService)
          res.send(result)
        })

        app.put('/newservice/:id', async(req, res) => {
          const id = req.params.id
          const updateDoc = req.body;
          const filter = {_id: ObjectId(id)}
          const result = await newServiceCollection.updateOne(filter, {$set:{name: updateDoc.name, price: updateDoc.price, details: updateDoc.details}})
          res.send(result)
        })

        app.get('/airportservice', async(req, res) => {
          const airportService = await airportServiceCollection.find().toArray()
          res.send(airportService)
        })

        app.get('/airportservice/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await airportServiceCollection.findOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.post('/airportservice', verifyJWT,  verifyAdmin, async(req, res) => {
          const airportService = req.body
          const result = await airportServiceCollection.insertOne(airportService)
          res.send(result)
        })

        app.delete('/airportservice/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await airportServiceCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.put('/airportservice/:id', async(req, res) => {
          const id = req.params.id
          const updateDoc = req.body;
          const filter = {_id: ObjectId(id)}
          const result = await airportServiceCollection.updateOne(filter, {$set:{name: updateDoc.name, price: updateDoc.price, details: updateDoc.details, addPrice: updateDoc.addPrice}})
          res.send(result)
        })

        app.get('/tours', async(req, res) => {
          const tours = await toursCollection.find().toArray()
          res.send(tours)
        })

        app.get('/tours/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await toursCollection.findOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.post('/tours', verifyJWT,  verifyAdmin, async(req, res) => {
          const tours = req.body
          const result = await toursCollection.insertOne(tours)
          res.send(result)
        })

        app.put('/tours/:id', async(req, res) => {
          const id = req.params.id
          const updateDoc = req.body;
          const filter = {_id: ObjectId(id)}
          const result = await toursCollection.updateOne(filter, {$set:{name: updateDoc.name, price: updateDoc.price, details: updateDoc.details, addPrice: updateDoc.addPrice}})
          res.send(result)
        })

        app.delete('/tours/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await toursCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        app.post('/reviews', verifyJWT, async(req, res) => {
          const review = req.body
          const result = await reviewCollection.insertOne(review)
          res.send(result)
        })

        app.get('/reviews', async(req, res) => {
          const result = await reviewCollection.find().toArray()
          res.send(result)
        })

        app.delete('/reviews/:id', verifyJWT,  verifyAdmin, async(req, res) => { 
          const id = req.params.id
          const result = await reviewCollection.deleteOne({_id: ObjectId(id)})
          res.send(result)
        })

        


    }
    finally{

    }
}

run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(` listening on port ${port}`)
})




// app.get('/available', async(req, res) => {
//   const date = req.query.date 

//   // step 1: get all services

//   const services = await serviceCollection.find().toArray()

//   //step 2: get the booking of that day
//   const query = {date: date}
//   const bookings = await bookingCollection.find(query).toArray()

//   //step 3: for each service, 

//   services.forEach(service => {
//     // step 4: find bookings for that service
//     const serviceBookings = bookings.filter(book => book.serviceName === service.name)
//     // setp 5: select slots for service bookings
//     const bookedSlots = serviceBookings.map(book => book.slot)
//     //step 6: select those slots that are not bookedslots
//     const available = service.slots.filter(slot => !bookedSlots.includes(slot))
//     service.slots = available;
//   })

//   res.send(services)
// })


// app.get('/booking',verifyJWT, async(req, res) =>{
//   const passangerEmail = req.query.passangerEmail;
//   const decodedEmail = req.decoded.email
//   if(passangerEmail === decodedEmail){
//     const query = {passangerEmail: passangerEmail};
//     const bookings = await bookingCollection.find(query).toArray();
//     return res.send(bookings);
//   }else{
//     return res.status(403).send({message: 'forbidden access'})
//   } 
// })

// app.post('/booking', async (req, res) => {
//   const booking = req.body;
//   const query = { serviceName: booking.serviceName, date: booking.date, passangerEmail: booking.passangerEmail }
//   const exists = await bookingCollection.findOne(query);
//   if (exists) {
//     return res.send({ success: false, booking: exists })
//   }
//   const result = await bookingCollection.insertOne(booking);
//   return res.send({ success: true, result });
// })