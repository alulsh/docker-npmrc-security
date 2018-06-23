const express = require('express');
// you will not be able to install this private npm package :)
// replace with your own private npm module
const privatePackage = require('@alulsh/private-package');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.listen(3000, () => {
  console.log('Hey! I\'m running on port 3000!')
});