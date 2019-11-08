const express = require('express');
const session = require('express-session');
const HazelcastStore = require('connect-hazelcast')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require("path");
const os = require("os");
const router = express.Router();

const app = express();

app.set('views', path.join(__dirname,'/','views'));
app.engine('html', require('ejs').renderFile);

if (process.env.HZ_STORE_ENABLED) {
    app.use(session({
        secret: 'session_secret',
        saveUninitialized: false,
        resave: false,
        name: 'hazelcast_cloud',
        store: new HazelcastStore({
            discoveryEnabled: true,
            discoveryToken: process.env.HZ_CLOUD_DISCOVERY_TOKEN,
            groupName: process.env.HZ_CLOUD_GROUP_NAME,
            groupPassword: process.env.HZ_CLOUD_PASSWORD,
            prefix: "hz_sessions"
        })
    }));
} else {
    app.use(session({
        secret: 'session_secret',
        name: 'hazelcast_cloud',
        saveUninitialized: false,
        resave: false,
    }));
}

app.use(cookieParser("cookie_secret"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.locals.user = req.session.user;
    res.locals.host = os.hostname();
    next();
});

router.get('/',function(req,res){
    res.render('index.html');
});

router.get('/logout',function(req,res){
    if(req.session.user) {
        req.session.destroy(function(){
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

router.post('/login',function(req,res){
    console.log(req.body);
    req.session.user = req.body;
    res.redirect('/');
});

const port = process.env.PORT || 3000;
app.use('/',router);
app.listen(port, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.info(`App is running on port: ${port}`);
    }
});
