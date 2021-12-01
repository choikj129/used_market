const express = require("express");
const app = express();
const mysql = require("mysql2");
const session = require("express-session");
const fs = require("fs");
const data = JSON.parse(fs.readFileSync(__dirname + '/db.json'));

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

app.get("/main", function(req, res){
    res.render("index.ejs")
})


