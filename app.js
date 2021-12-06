const express = require("express");
const app = express();
const mysql = require("mysql2");
const session = require("express-session");
const fs = require("fs");
const Crypto = require("crypto");
const data = JSON.parse(fs.readFileSync(__dirname + '/db.json'));
const key = data.keypair
const bodyParser = require("body-parser")
const multer = require("multer")
const path = require("path")

const db = mysql.createConnection({
    host : data.host,
    port : data.port,
    user : data.user,
    password : data.password,
    database : data.database    
})

// 이미지 업로드
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
var storage = multer.diskStorage({
    destination : function (req, file, callback){
        callback(null, "public/img")
    },
    filename : function(req, file, callback){
        const ext = path.extname(file.originalname)
        callback(null, path.basename(file.originalname, ext)+"-" +Date.now()+ext)
    }
})
var upload = multer({storage : storage})

app.set("views", __dirname+"/views");
app.set("view engine", "ejs")

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));

app.use(
    session({
        secret : data.secret,
        resave : false,
        saveUninitialized : true,
        maxAge : 43200000
    })
)

const user = require("./routes/user")
app.use("/user", user)

app.listen(3000, function(){
    console.log("server start")
})

app.get("/", function(req, res){
    res.render("main",{login : req.session.log})
})

app.get("/index", function(req, res){
    res.render("index")
})

app.get("/main", function(req, res){
    res.render("main")
})

app.get("/regist",function(req, res){
    !req.session.log ? res.redirect("/") : res.render("regist")
})

app.post("/regist/commit", upload.array("images"), function(req,res){
    console.log(req.files)
})
