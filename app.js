const express = require("express");
const app = express();
const mysql = require("mysql2");
const session = require("express-session");
const moment = require("moment")
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
        dir = "public/img/"+req.session.log.nickname
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir)
        }
        callback(null, dir)
    },
    filename : function(req, file, callback){
        const ext = path.extname(file.originalname)
        callback(null, path.basename(file.originalname, ext)+"-" +Date.now()+ext)
    }
})
var upload = multer({
    storage : storage})

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
    var title = req.body.title
    var contents = req.body.contents
    var category = req.body.category
    var cost = req.body.cost
    var images = req.files
    var post_id = req.session.log.nickname + moment().format("YYYYMMDDHHmmss")
    db.query(
        `insert into post values (?,?,?,?,?,?)`,
        [post_id, title, contents, category, cost, req.session.log.email],
        function(err){
            if (err){
                console.log(err)
            }else{
                if(images){
                    var col = ""
                    var val = "?,"
                    var path = [post_id]
                    for (var i=0; i<images.length; i++){
                        col += `image${i+1},`
                        val += "?,"
                        path.push(images[i].path)
                    }
                    db.query(
                        `insert into images(post_id,${col.slice(0,-1)})
                        values(${val.slice(0,-1)})`,
                        path,
                        function(err){
                            err ? console.log(err) : res.redirect("/")
                        }
                    )
                }
            }
        }
    )
})
