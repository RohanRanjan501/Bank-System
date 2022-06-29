const router = require('express').Router();
const allUsers = require('../model/allUser');
const historyModel = require('../model/histoyModel');


router.get('/', (req, res) => {
    res.render('home', { title: "Login", msg: '' })
});

router.get('/admin', (req, res) => {
    res.render('admin', { title: "Admin", msg: '', hide: true })
});

router.post('/admin', (req, res) => {
    if (req.body.adminPass === "admin")
        res.render('admin', { title: "Admin", msg: '', hide: false })
    else res.render('admin', { title: "Admin", msg: '', hide: true })
});

router.get('/login', (req, res) => {
    res.render('home', { title: "Login", msg: '' })
});

router.post('/login', (req, res) => {
    const { logemail, logpass } = req.body;
    const query = {
        email: logemail,
        password: logpass
    }
    allUsers.findOne(query, (err, user) => {
        if (!err && user != null)
            res.render('user', { title: "Home", msg: '', user: user })
        else res.send('invalid user');
    })
})

router.post('/signup', (req, res) => {
    const { logname, logcontact, logemail, logpass } = req.body;
    const NewUser = new allUsers({
        name: logname,
        email: logemail,
        contact: logcontact,
        amount: 0,
        password: logpass
    });
    const query = {
        email: logemail,
        password: logpass
    }

    allUsers.findOne(query, (err, user) => {
        if (!err && user != null)
            res.render('user', { title: "Home", msg: '', user: user })
        else {
            NewUser.save().then(() => {
                allUsers.findOne(query, (err, user) => {
                    if (!err && user != null)
                        res.render('user', { title: "Home", msg: '', user: user })
                    else res.send('invalid user');
                })
            }).catch(err => {
                console.log(err);
            })
        }
    })
})

//  ADD USER
router.get('/adduser', (req, res) => {
    res.render('addUser', { title: "Add User", msg: '' })
});

router.post('/adduser', (req, res) => {

    const { userName, userEmail, userNumber, userAmount, password } = req.body;
    const User = new allUsers({
        name: userName,
        email: userEmail,
        contact: userNumber,
        amount: userAmount,
        password: password
    });
    const query = {
        email: userEmail,
        password: password
    }
    allUsers.findOne(query, (err, user) => {
        if (!err && user != null)
            res.render('addUser', { title: "Add User", msg: 'User Already Exists' })
        else {
            User.save().then(() => {
                res.render('addUser', { title: "Add User", msg: 'User Added Successfully' })
            }).catch((err) => {
                console.log(err)
            })
        }
    })
    
})


//- View All User
router.get('/data', (req, res) => {
    const allData = allUsers.find({});
    allData.exec((err, data) => {
        if (err) {
            throw err;
        }
        else {
            res.render('viewUser', { title: "View Users", data: data });
        }
    })

})

//deposit
router.get('/deposit', (req, res)=>{
    res.render('deposit', { title: "Add User", msg: '' })
})

router.post('/deposit', (req, res)=>{
    const { email, amount } = req.body;
    allUsers.findOne({"email":email}, {"amount":1}, (err, user)=>{
        if(!err && user){
            let updateAmount = parseInt(user.amount) + parseInt(amount);
            allUsers.findOneAndUpdate({"email":email}, { "$set": { "amount": updateAmount } }).then(()=>{
                res.render('admin', { title: "Admin", msg: '', hide: false })
            })
        }
    })    
})

//view balance
router.get('/accountDetails/:id', (req, res) => {
    allUsers.findOne({ "_id": req.params.id }, (err, user) => {
        if (!err && user != null)
            res.render('userDetails', { title: "Account Details", msg: '', user: user });
        else res.send('invalid user');
    })
})

router.post('/accountDetails', (req, res) => {
    allUsers.findOne({ "email": req.body.email }, (err, user) => {
        if (!err && user != null)
            res.render('userDetails', { title: "Account Details", msg: '', user: user });
        else res.send('invalid user');
    })
})

// Delete User
router.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    const updateData = allUsers.findByIdAndDelete({ "_id": id });
    updateData.exec((err, data) => {
        if (err) { throw err }
        else {
            res.redirect('/data')
        }
    })
});

router.get("/view/:id", (req, res) => {
    const id = req.params.id;
    const Sender = allUsers.find({ "_id": id });
    const allUser = allUsers.find({});
    Sender.exec((err, uData) => {
        if (err) {
            throw err;
        }
        else {
            allUser.exec((err, rData) => {
                if (err) {
                    throw err;
                }
                else {
                    res.render('view', { title: 'view', data: uData, records: rData })

                }
            })
        }
    })

})

// Transfer
router.post('/transfer', (req, res) => {
    const { SenderID, SenderName, SenderEmail, receiverName, receiverEmail, transferAmount } = req.body;
    console.log(transferAmount)
    const history = new historyModel({
        sName: SenderName,
        sEmail: SenderEmail,
        rName: receiverName,
        rEmail: receiverEmail,
        amount: transferAmount
    })


    if (receiverName === 'Select Receiver Name' || receiverEmail === 'Select Receiver Email') {

        res.render('success', { title: "success", value: "", msg: "", errmsg: "All fields are required!" });
    } else {

        const Sender = allUsers.find({ "_id": SenderID })
        const Receiver = allUsers.find({ "name": receiverName, "email": receiverEmail });


        Promise.all([Sender, Receiver]).then(([senderData, receiverData]) => {
            senderData.forEach(async (c) => {
                if (c.name === receiverName || c.email === receiverEmail || c.amount < transferAmount) {

                    res.render('success', { title: "success", value: "", msg: "", errmsg: "Process Not Complete due to invalid details!" });
                }

                else {
                    let updateAmount = parseInt(c.amount) - parseInt(transferAmount);
                    await allUsers.findOneAndUpdate({ "name": SenderName }, { "$set": { "amount": updateAmount } });
                    history.save().then((r) => {

                    }).catch(err => { console.log(err) });

                    receiverData.forEach(async (e) => {
                        let updateAmount = parseInt(e.amount) + parseInt(transferAmount);

                        await allUsers.findOneAndUpdate({ "name": receiverName }, { "$set": { "amount": updateAmount } })
                    })
                }

                res.render('success', { title: "success", email: SenderEmail, value: "True", msg: "Transfer Successfull" })
            });

        }).catch((err) => {
            console.log(err)
        })

    }



})

// History
router.get('/history', (req, res) => {
    const hist = historyModel.find({});
    hist.exec((err, hdata) => {
        if (err) {
            throw err;
        }
        else {
            res.render('history', { title: 'History', data: hdata })
        }
    });
});

router.get('/history/:email', (req, res) => {
    const hist = historyModel.find({ $or: [{ "sEmail": req.params.email }, { "rEmail": req.params.email }] });
    hist.exec((err, hdata) => {
        if (err) {
            throw err;
        }
        else {
            res.render('history', { title: 'All Transactions', data: hdata })
        }
    });
});

router.get('/remove/:id', (req, res) => {
    const id = req.params.id;
    const updateData = historyModel.findByIdAndDelete({ "_id": id });
    updateData.exec((err, data) => {
        if (err) { throw err }
        else {
            res.redirect('/history')
        }
    })
});

router.post('/remove', (req, res) => {
    const email = req.body.email;
    const updateData = allUsers.findOneAndDelete({ "email": email });
    updateData.exec((err, data) => {
        if (err) { throw err }
        else {
            res.render('admin', { title: "Admin", msg: '', hide: false })
        }
    })
});

module.exports = router;