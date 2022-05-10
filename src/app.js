const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const { port } = require('./config');

app.use(express.json());
const usersRoute = require('./routes/v1/users');

app.use(`/v1/users/`, usersRoute);

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
