const express = require('express');
const cors = require('cors');
const usersRoute = require('./routes/v1/users');
const petsRoute = require('./routes/v1/pets');
const medsRoute = require('./routes/v1/medications');
const docsRoute = require('./routes/v1/documents');
const { port } = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send({ msg: 'Server is running' }));

app.use('/v1/users/', usersRoute);
app.use('/v1/pets/', petsRoute);
app.use('/v1/medications/', medsRoute);
app.use('/v1/docs/', docsRoute);

app.all('*', (req, res) => res.status(404).send({ err: 'Page not found' }));

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
