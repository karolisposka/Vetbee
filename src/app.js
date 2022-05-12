const express = require('express');
const cors = require('cors');
const usersRoute = require('./routes/v1/users');
const { port } = require('./config');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => res.send({ msg: 'Server is running' }));

app.use('/v1/users/', usersRoute);

app.all('*', (req, res) => res.status(404).send({ err: 'Page not found' }));

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
