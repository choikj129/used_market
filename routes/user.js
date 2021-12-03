const path = require('path');
const express = require("express");
const router = express.Router();
const mysql = require("mysql2");
const Crypto = require("crypto");
const fs = require("fs");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../db.json")));
const key = data.keypair

const db = mysql.createConnection({
    host : data.host,
    port : data.port,
    user : data.user,
    password : data.password,
    database : data.database    
})


router.get("/login", function(req, res){
    res.render("login")
})

router.post("/login/check", function(req, res){
    var email = req.body.email
    var pw = Crypto.createHmac('sha256', key).update(req.body.pw).digest("hex");
    db.query(
        `select email from user where email=? and password=?`,
        [email, pw],
        function(err, result){
            if (err){
                console.log(err)
            }else{
                if(result[0]){
                    req.session.log = result[0]
                    res.send({check:"Y"})
                }else{
                    res.send({check:null})
                }
            }
        }
    )
})

router.get("/logout", function(req, res){
    req.session.destroy(function(err){
        if(err){
            console.log(err)
        }else{
            res.redirect("/")
        }
    })
})

router.get("/signup", function(req, res){
    res.render("signup")
})

router.get("/signup/email_check", function(req, res){
    var email = req.query.email
    db.query(
        `select * from user where email=?`,[email],
        function(err, result){
            err ? console.log(err) : res.json({check : result})
        }
    )
})

router.get("/signup/name_check", function(req, res){
    var name = req.query.name
    db.query(
        `select * from user where nickname=?`,[name],
        function(err, result){
            err ? console.log(err) : res.json({check : result})
        }
    )
})

router.post("/signup/appro", function(req, res){
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

module.exports = router;