'use strict';

// server
const express = require('express');
// const path = require('path');
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express();
// const router = express.Router();
// const publicDir = __dirname + '/public/';
// const routes = require('./api/index');
const getAutomation = require('./automation/automateBinance');


//Disabling public Directory
// app.use('/profiles', express.static('public'));
// app.use('/pub_assets', express.static('public/assets'));
// app.use(express.static('public'));

// app.use( bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '100mb'
}));
app.use(bodyParser.json({
    limit: '100mb'
}));


//enable all request. from third party sites, apps, and so on.
app.use(cors());
app.use(() => getAutomation);

// app.use('/api', routes);


// root
app.get('/', function (req, res) {
    // res.sendFile(publicDir + 'index.html');
    res.json({
        status: 'success',
        message: 'You are at the home page of our APP'
    })
});


app.listen(process.env.PORT || 4090, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});

module.exports = app;
