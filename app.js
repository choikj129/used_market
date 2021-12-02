const express = require("express");
const app = express();
const mysql = require("mysql2");
const session = require("express-session");
const fs = require("fs");
const Crypto = require("crypto");
const data = JSON.parse(fs.readFileSync(__dirname + '/db.json'));
const key = data.keypair

const db = mysql.createConnection({
    host : data.host,
    port : data.port,
    user : data.user,
    password : data.password,
    database : data.database    
})

app.set("views", __dirname+"/views");
app.set("view engine", "ejs")

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));

app.use(
    session({
        secret : "dsefssgdfasdfa",
        resave : false,
        saveUninitialized : true,
        maxAge : 360000000
    })
)

app.listen(3000, function(){
    console.log("server start")
})

app.get("/", function(req, res){
    res.render("login")
})

app.get("/signup", function(req, res){
    res.render("signup")
})

app.get("/index", function(req, res){
    res.render("index.ejs")
})

app.get("/main", function(req, res){
    res.render("main.ejs")
})

app.get("/email_check", function(req, res){
    var email = req.query.email
    db.query(
        `select * from user where email=?`,[email],
        function(err, result){
            err ? console.log(err) : res.json({check : result})
        }
    )
})

app.get("/name_check", function(req, res){
    var name = req.query.name
    db.query(
        `select * from user where nickname=?`,[name],
        function(err, result){
            err ? console.log(err) : res.json({check : result})
        }
    )
})

app.post("/signup/appro", function(req, res){
    var email = req.body.e;
    var pw = Crypto.createHmac('sha256', key).update(req.body.p).digest("hex");
    var n = req.body.n;
    db.query(
        `insert into user values(?,?,?)`,
        [email, pw, n],
        function(err){
            err ? console.log(err) : res.send("")
        }
    )
})