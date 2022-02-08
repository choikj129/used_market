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
        dir = "public/images/"+req.session.log.nickname
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

const user = require("./routes/user");
const e = require("express");
app.use("/user", user)

app.listen(3000, function(){
    console.log("server start")
})

app.get("/", function(req, res){
    db.query(
        `select A.*, B.image1 
        from post A left join images B on A.post_id=B.post_id
        order by right(A.post_id,14) desc`,
        function(err, result){
            err 
            ? console.log(err) 
            : res.render("main",{
                login : req.session.log,
                post : result
            })    
        }
    )
})

app.get("/regist",function(req, res){
    !req.session.log ? res.redirect("/") : res.render("regist")
})

app.post("/regist/commit", upload.array("images"), function(req,res){
    var title = req.body.title
    var contents = req.body.contents
    var category = req.body.category
    var cost = req.body.cost.length>0 ? req.body.cost : "가격 미정"
    var images = req.files
    var loc = `${req.body.si} ${req.body.gu} ${req.body.dong}`
    var post_id = req.session.log.nickname + moment().format("YYYYMMDDHHmmss")
    db.query(
        `insert into post values (?,?,?,?,?,?,?)`,
        [post_id, title, contents, category, cost, loc, req.session.log.nickname],
        function(err){
            if (err){
                console.log(err)
            }else{
                if(images.length>0){
                    var col = ""
                    var val = "?,"
                    var path = [post_id]
                    for (var i=0; i<images.length; i++){
                        col += `image${i+1},`
                        val += "?,"
                        path.push(images[i].path.slice(6,))
                    }
                    db.query(
                        `insert into images(post_id,${col.slice(0,-1)})
                        values(${val.slice(0,-1)})`,
                        path,
                        function(err){
                            err ? console.log(err) : res.redirect("/")
                        }
                    )
                }else{
                    res.redirect("/")
                }
            }
        }
    )

})

app.get("/post", function(req, res){
    if(!req.session.log){
        res.redirect("/user/login")
    }else{
        var post_id = req.query.id
        var name = req.session.log.nickname
        db.query(
            `select A.*, B.*, (select id from love where post_id=? and nickname=?) love
            from post A left join images B on A.post_id=B.post_id
            where A.post_id=?`,
            [post_id, name, post_id],
            function (err, result) {
                err ? console.log(err) : res.render("post",{
                    login : req.session.log,
                    post : result[0],
                    id : post_id
                })
            }
        )   
    }
})

app.get("/post/love", function(req, res){
    var post_id = req.query.post_id
    var name = req.query.name
    var love = req.query.love
    console.log(post_id, name, love)
    if (love==0){
        var sql = `insert into love(post_id, nickname) values(?,?)`
        love = 1
    }else{
        var sql = `delete from love where post_id=? and nickname=?`
        love = 0
    }
    db.query(
        sql, [post_id, name], function(err){
            err ? console.log(err) : res.json({love : love})
        }
    )

})