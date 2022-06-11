const router = require('express').Router();
const newUser = require('../model/newUser');
const allUsers = require('../model/allUser');
const historyModel = require('../model/histoyModel');


router.get('/', (req,res)=> {
    res.render('home')
});



router.get('/login', (req,res)=> {
    res.render('login', {title: "Login", msg:''})
});

router.post('/login', (req, res)=>{
    const {logemail, logpass} = req.body;
    const query = {
        email: logemail,
        password: logpass
    }
    newUser.findOne(query, (err, user)=>{
        if(!err && user!=null)
            res.send('valid user');
        else res.send('invalid user');
    })
})

router.post('/signup', (req, res)=>{
    const {logname, logemail, logpass} = req.body;
    const NewUser = new newUser({
        name: logname,
        email: logemail,
        password: logpass
    });
    NewUser.save().then(()=>{
        res.send(`${logname} is successfully registered`);
    }).catch(err=>{
        console.log(err);
    })
})

//  ADD USER
router.get('/adduser', (req, res) => {
    res.render('addUser', {title: "Add User", msg:''})
});

router.post('/adduser',(req, res) =>{
    
    const {userName, userEmail, userNumber, userAmount} = req.body;
    const User = new allUsers({
        name: userName,
        email: userEmail,
        contact: userNumber,
        amount: userAmount,
    });
    User.save().then(()=>{
        res.render('addUser', {title: "Add User", msg:'User Added Successfully'})
    }).catch((err)=>{
        console.log(err)
    })
})


//- View All User
router.get('/data',(req,res) => {
    const allData = allUsers.find({});
    allData.exec((err, data) => {
        if(err){
            throw err;
        }
        else{
            res.render('viewUser',{title: "View Users", data:data});
        }
    })
   
})

// Delete User
router.get('/delete/:id',(req,res)=> {
 const id = req.params.id;
 const updateData = allUsers.findByIdAndDelete({"_id":id});
 updateData.exec((err,data) => {
     if(err){throw err}
     else{
         res.redirect('/data')
     }
 })
});

router.get("/view/:id",(req,res) => {
    const id = req.params.id;
    const Sender = allUsers.find({"_id": id});
    const allUser = allUsers.find({});
    Sender.exec((err,uData)=>{
        if(err)
        {
            throw err;
        }
        else{
            allUser.exec((err, rData) => {
                if(err){
                    throw err;
                }
                else{
                    res.render('view',{title: 'view', data: uData, records: rData})

                }
            })
        }
    })
   
})

// Transfer
router.post('/transfer',(req,res) => {
    const {SenderID, SenderName,SenderEmail, reciverName, reciverEmail,transferAmount} = req.body;
    console.log(transferAmount)
    const history = new historyModel({
        sName: SenderName,
        sEmail: SenderEmail,
        rName: reciverName,
        rEmail:reciverEmail,
        amount: transferAmount
    })

    
    if(reciverName === 'Select Reciver Name' || reciverEmail === 'Select Reciver Email'){
       
        res.render('sucess',{title: "sucess", value:"", msg: "", errmsg: "All fields are require!"});
    }else{
    
        const Sender = allUsers.find({"_id": SenderID})
        const Reciver = allUsers.find({"name": reciverName, "email": reciverEmail});
  

        Promise.all([Sender,Reciver]).then(([senderData,reciverData]) => {
            senderData.forEach( async (c) => {
                if(c.name === reciverName || c.email === reciverEmail || c.amount < transferAmount){
                    
                    res.render('sucess',{title: "sucess", value:"", msg: "", errmsg: "Process Not Complete due to incorrect reciver details!"});
                }
               
                else{
                let updateAmount = parseInt(c.amount) - parseInt(transferAmount);
                await allUsers.findOneAndUpdate({"name" : SenderName}, {"$set": {"amount": updateAmount}});
                history.save().then((r)=>{
                   
                }).catch(err => {console.log(err)});
                
                reciverData.forEach( async (e) => {
                    let updateAmount = parseInt(e.amount) + parseInt(transferAmount);
                  
                    await allUsers.findOneAndUpdate({"name": reciverName}, {"$set": {"amount": updateAmount }})
                })
                }

                res.render('sucess',{title: "sucess", value:"True", msg: "Transfer Sucessfull"})
            });
         
        }).catch((err)=>{
            console.log(err)
        })

    }
    
    

})

// History
router.get('/history',(req,res)=>{
const hist = historyModel.find({});
hist.exec((err, hdata) => {
    if(err){
        throw err;
    }
    else{
        res.render('history',{title: 'History', data: hdata})
    }
});
});

router.get('/remove/:id',(req,res)=> {
    const id = req.params.id;
    const updateData = historyModel.findByIdAndDelete({"_id":id});
    updateData.exec((err,data) => {
        if(err){throw err}
        else{
            res.redirect('/history')
        }
    })
});


module.exports = router;