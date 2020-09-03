//npm install express --save
//npm install body-parser --save
//npm install cookie-parser --save
//npm install express-session --save
//npm install ejs --save
//npm install pg --save

var express = require('express');
var app = express();
var http = require('http').Server(app);
var cookieParser = require('cookie-parser');
var session = require('express-session');
const db = require('db');

//Middleware for handling URL encoded form data
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//View Engine
app.set('view engine', 'ejs');

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser());

// initialize express-session to allow us to track the user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'es_un_secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000*60*60
    }
}));

app.use(express.static(__dirname + '/public'));

app.post('/login', function(req, res){
  let user = req.body.email;
	let userpass = req.body.password;

  //make query to retrieve account info and check if password is correct
  db.query("SELECT * FROM public.account INNER JOIN public.school ON public.account.school_no=public.school.school_id AND public.account.email= $1 AND public.account.password= $2",[user,userpass],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.render('login',{message:"account information could not be retrieved"});
    }
    else {
      //console.log(result.rows);
      if (result.rows.length === 0) {
        res.render('login',{message:"wrong email/password entered"});
      }
      else {
        req.session.user = result.rows[0].member_id;
        req.session.schoolID = result.rows[0].school_id;
        req.session.userType = result.rows[0].acc_type;
    		res.render('index', {userAccID: result.rows[0].member_id, userSchoolID: result.rows[0].school_no, userType: result.rows[0].acc_type, userSchoolName: result.rows[0].school_name, userPhoneNo: result.rows[0].phone_no, userStundentID: result.rows[0].student_id, userEmail: result.rows[0].email, userName: result.rows[0].name});
      }
    }
  });
});

app.get('/', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
		//res.render('index', {userID: req.body.userID, userSchoolID: req.body.userSchoolID});
    db.query("SELECT * FROM public.account INNER JOIN public.school ON public.account.school_no=public.school.school_id AND public.account.member_id= $1",[req.session.user],(err,result)=>{
      if(err){
        //  if there is an error from the sql server
        res.render('login',{message:""});
      }
      else {
        //console.log(result.rows);
        if (result.rows.length === 0) {
          res.render('login',{message:""});
        }
        else {
          req.session.user = result.rows[0].member_id;
          res.render('index', {userAccID: result.rows[0].member_id, userSchoolID: result.rows[0].school_no, userType: result.rows[0].acc_type, userSchoolName: result.rows[0].school_name, userPhoneNo: result.rows[0].phone_no, userStundentID: result.rows[0].student_id, userEmail: result.rows[0].email, userName: result.rows[0].name});
        }
      }
    });
	}
	else {
    res.render('login', {message:""});
  }
});

app.get('/logout', (req, res) => {
  req.session.user = null;
  res.render('login', {message:""});
});


app.get('/register', (req, res) => {
  res.render('register', {message:""});
});

app.post('/register', (req, res) => {
  //console.log(req.body);
  var emailParts = req.body.email.split('@');
  var emailSuff = "@" + emailParts[1];

//** In order to register, first we get the next available id for the account,
//** the next available id for school (in case it's an admin registering),
//** and school id according to email suffix (if school exists in database)

  db.query("SELECT max(member_id) FROM public.account", [],(err,memIDresult)=>{
    if(err){
      res.render('register',{message:"registration could not be processed"});
    }
    else {
      //console.log(memIDresult.rows);
      var nextAccID = 1;
      if (memIDresult.rows.length > 0) {
        nextAccID = memIDresult.rows[0].max + 1;
      }

      db.query("SELECT max(school_id) FROM public.school", [],(err,schoolIDresult)=>{
        if(err){
          res.render('register',{message:"registration could not be processed"});
        }
        else {
          //console.log(schoolIDresult.rows);
          var nextSchoolID = 1;
          if (schoolIDresult.rows.length > 0) {
            console.log("inside condition");
            nextSchoolID = schoolIDresult.rows[0].max + 1;
          }

          db.query("SELECT school_id FROM public.school WHERE email_suffix = $1", [emailSuff],(err,emailSuffresult)=>{
            if(err){
              res.render('register',{message:"registration could not be processed"});
            }
            else {
              //console.log(emailSuffresult.rows);
              var emailSuffSchoolID;
              if (emailSuffresult.rows.length > 0) {
                emailSuffSchoolID = emailSuffresult.rows[0].school_id;
              }
              //console.log("nextAccID is "+nextAccID+ ", nextSChoolID is "+nextSchoolID+", emailSuffSchoolID is "+emailSuffSchoolID);

//** Then we check if email is already registered,
//** if not, then new account is inserted for student into database if school exists
//** or new admin account is inserted in database if school admin does not exist already

              db.query("SELECT email FROM public.account WHERE email = $1", [req.body.email],(err,result)=>{
                if(err){
                  //  if there is an error from the sql server
                  res.render('register',{message:"registration could not be processed"});
                }
                else {
                  if (result.rows.length > 0) {
                    res.render('register', {message:"email already registered"});
                  }
                  else {
                    if (req.body.accType === "student") {
                      if (emailSuffSchoolID == null) {
                        res.render('register',{message:"school not currently available"});
                      }
                      else {
                        db.query("INSERT INTO public.account(member_id, email, password, acc_type, student_id, school_no, name) VALUES ($1, $2, $3, $4, $5, $6, $7)", [nextAccID,req.body.email,req.body.password,req.body.accType,req.body.sID,emailSuffSchoolID, req.body.name],(err,result)=>{
                          if(err){
                            //  if there is an error from the sql server
                            res.render('register',{message:"registration could not be processed"});
                          }
                          else {
                            res.render('login', {message:""});
                          }
                        });
                      }
                    }
                    else {
                      if (emailSuffSchoolID == null) {
                        db.query("INSERT INTO public.school(school_id, school_name, email_suffix, address) VALUES ($1, $2, $3, $4)", [nextSchoolID,req.body.school,emailSuff,req.body.address],(err,result)=>{
                          if(err){
                            //  if there is an error from the sql server
                            res.render('register',{message:"registration could not be processed"});
                          }
                          else {
                            db.query("INSERT INTO public.account(member_id, email, password, acc_type, phone_no, school_no, name) VALUES ($1, $2, $3, $4, $5, $6, $7)", [nextAccID,req.body.email,req.body.password,req.body.accType,req.body.sID,nextSchoolID,req.body.name],(err,result)=>{
                              if(err){
                                //  if there is an error from the sql server
                                res.render('register',{message:"registration could not be processed"});
                              }
                              else {
                                res.render('login', {message:""});
                              }
                            });
                          }
                        });
                      }
                      else {
                        res.render('register',{message:"school is already registered to an administrator"});
                      }
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
  });
});

app.post('/addFacultyToDB', (req, res) => {
  //console.log(req.body);
  db.query("SELECT MAX(faculty_id) FROM public.faculty;", [],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({message:"faculty could not be added"}));
    }
    else {
      var nextFacID = 1;
      if (result.rows.length > 0) {
        nextFacID = result.rows[0].max + 1;
      }
      db.query("SELECT faculty_id FROM public.faculty WHERE faculty_name= $1 AND school_no= $2", [req.body.faculty, req.body.school],(err,result)=>{
        if(err){
          //  if there is an error from the sql server
          res.send(JSON.stringify({message:"faculty could not be added"}));
        }
        else {
          if (result.rows.length > 0) {
            res.send(JSON.stringify({message:"faculty already exists, to edit go to Faculties"}));
          }
          else {
            db.query("INSERT INTO public.faculty(faculty_id, faculty_name, faculty_img, school_no) VALUES ($1, $2, $3, $4)", [nextFacID, req.body.faculty,req.body.img,req.body.school],(err,result)=>{
              if(err){
                //  if there is an error from the sql server
                res.send(JSON.stringify({message:"faculty could not be added"}));
              }
              else {
                res.send(JSON.stringify({message:"faculty successfully added"}));
              }
            });
          }
        }
      });
    }
  });
});

app.post('/addCourseToDB', (req, res) => {
  //console.log(req.body);
  db.query("SELECT MAX(course_id) FROM public.course;", [],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({message:"course could not be added"}));
    }
    else {
      var nextCourseID = 1;
      if (result.rows.length > 0) {
        nextCourseID = result.rows[0].max + 1;
      }
      db.query("SELECT course_id FROM public.course WHERE dept_code= $1 AND course_level= $2 AND admin_id= $3", [req.body.dept,req.body.level,req.body.admin],(err,result)=>{
        if(err){
          //  if there is an error from the sql server
          res.send(JSON.stringify({message:"course could not be added"}));
        }
        else {
          if (result.rows.length > 0) {
            res.send(JSON.stringify({message:"course already exists, to edit go to All Courses"}));
          }
          else {
            db.query("SELECT faculty_id FROM public.faculty WHERE faculty_name= $1", [req.body.faculty],(err,result)=>{
              if(err){
                //  if there is an error from the sql server
                res.send(JSON.stringify({message:"course could not be added"}));
              }
              else {
                var facultyID = 0;
                if (result.rows.length > 0) {
                  facultyID = result.rows[0].faculty_id;
                }
                if (facultyID === 0) {
                  res.send(JSON.stringify({message:"faculty does not exist"}));
                }
                else {
                  db.query("INSERT INTO public.course(course_id, dept_code, course_level, description, avg_rating, course_name, faculty_no, admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [nextCourseID,req.body.dept,req.body.level,req.body.description,0,req.body.name,facultyID,req.body.admin],(err,result)=>{
                    if(err){
                      //  if there is an error from the sql server
                      res.send(JSON.stringify({message:"course could not be added"}));
                    }
                    else {
                      //insert textbooks
                      if (req.body.isbn1 !== "") {
                        db.query("INSERT INTO public.textbook(\"ISBN\", price, book_name, edition) VALUES ($1, $2, $3, $4)", [req.body.isbn1,req.body.price1,req.body.text1,req.body.edition1],(err,result)=>{
                          if(err){
                            //  if there is an error from the sql server
                            res.send(JSON.stringify({message:"course added successfully, textbook 1 could not be added"}));
                          }
                          else {
                            //insert textbooks
                            db.query("INSERT INTO public.uses_textbook(\"text_ISBN\", course_no) VALUES ($1, $2)", [req.body.isbn1,nextCourseID],(err,result)=>{
                              if(err){
                                //  if there is an error from the sql server
                                res.send(JSON.stringify({message:"course added successfully, textbook 1 could not be added"}));
                              }
                              else {
                                if (req.body.isbn2 !== "") {
                                  db.query("INSERT INTO public.textbook(\"ISBN\", price, book_name, edition) VALUES ($1, $2, $3, $4)", [req.body.isbn2,req.body.price2,req.body.text2,req.body.edition2],(err,result)=>{
                                    if(err){
                                      //  if there is an error from the sql server
                                      res.send(JSON.stringify({message:"course added successfully, textbook 2 could not be added"}));
                                    }
                                    else {
                                      //insert textbooks
                                      db.query("INSERT INTO public.uses_textbook(\"text_ISBN\", course_no) VALUES ($1, $2)", [req.body.isbn2,nextCourseID],(err,result)=>{
                                        if(err){
                                          //  if there is an error from the sql server
                                          res.send(JSON.stringify({message:"course added successfully, textbook 2 could not be added"}));
                                        }
                                        else {
                                          res.send(JSON.stringify({message:"course added successfully"}));
                                        }
                                      });
                                    }
                                  });
                                }
                              }
                            });
                          }
                        });
                      }
                    }
                  });
                }
              }
            });
          }
        }
      });
    }
  });
});

app.post('/getFaculties', (req, res) => {
  var schoolID = req.body.schoolID;
  db.query("SELECT * FROM public.faculty WHERE school_no = $1",[schoolID],(err,result)=>{
    if(err){
      //  if there is an error form the sql server with request
      res.send(JSON.stringify({
        html : "information could not be retrieved"
      }));
    }else{
      var html = "";
      if (result.rows.length === 0) {
        html = "<div class=\"info\">Sorry, no faculties found :(</div>"
      }
      else {
        for(var i=0;i<result.rows.length;i++){
          var facImg = "'"+result.rows[i].faculty_img+"'"
          html +=  '<div class="collectItem">'
          html +=  '  <div id="faculty-card-'+result.rows[i].faculty_id+'" class="collectImage" style="background-image:url('+facImg+');"></div>'
          html +=  '  <div id="faculty-name-'+result.rows[i].faculty_id+'" class="collectName">'+result.rows[i].faculty_name+'</div>'
          html +=  '</div>'
        }
      }
      res.send(JSON.stringify({rows : result.rows, html: html}));
    }

  })
});

app.post('/getOneFac', (req, res) => {
  var facultyID = req.body.facultyID;
  //get faculty info, make html string and send back
  db.query("SELECT * FROM public.faculty WHERE faculty_id = $1",[facultyID],(err,result)=>{
    if(err){
      //  if there is an error form the sql server with request
      res.send(JSON.stringify({
        html : "information could not be retrieved"
      }));
    }else{
      var html = "";
      if (result.rows.length === 0) {
        html = "<div class=\"info\">Sorry, faculty not found :(</div>"
      }
      else {
        html +=  '<div><label class="simpleLabel">Faculty name *</label></div>'
        html +=  '<div><input class="simpleInput" type="text" id="oneFacName"/></div>'
        html +=  '<div><label class="simpleLabel">Image URL *</label></div>'
        html +=  '<div><input class="simpleInput" type="text" id="oneFacImg"/></div>'
        html +=  '<div id="oneFacultyError" class="hiddenDiv errorMsg"></div>'
        html +=  '<div>'
        html +=  '<button class="btn btn-primary btn-sm btn-danger" id="removeOneFaculty">remove</button>'
        html +=  '<button class="btn btn-primary btn-sm btn-success" id="saveOneFaculty">save changes</button>'
        html +=  '</div>'
      }
      res.send(JSON.stringify({rows : result.rows, html: html}));
    }
  })
});

app.post('/saveOneFac', (req, res) => {
  var facultyID = req.body.facultyID;
  //get faculty info, check if new name is already used, update faculty
  db.query("SELECT * FROM public.faculty WHERE faculty_id = $1",[facultyID],(err,result)=>{
    if(err){
      //  if there is an error form the sql server with request
      res.send(JSON.stringify({message : "information could not be updated"}));
    }else{
      if (req.body.faculty !== result.rows[0].faculty_name) {
        db.query("SELECT * FROM public.faculty WHERE faculty_name = $1 AND school_no = $2",[req.body.faculty,req.body.schoolID],(err,result)=>{
          if(err){
            //  if there is an error form the sql server with request
            res.send(JSON.stringify({message : "information could not be updated"}));
          }else{
            if (result.rows.length > 0) {
              res.send(JSON.stringify({message : "name exists for a different faculty"}));
            }
            else {
              //update faculty
              db.query("UPDATE public.faculty SET faculty_name= $1, faculty_img= $2 WHERE faculty_id= $3", [req.body.faculty,req.body.img,facultyID],(err,result)=>{
                if(err){
                  //  if there is an error from the sql server
                  res.send(JSON.stringify({message:"account information could not be updated"}));
                }
                else {
                  res.send(JSON.stringify({message:"faculty successfully updated"}));
                }
              });
            }
          }
        });
      }
      else {
        //update faculty
        db.query("UPDATE public.faculty SET faculty_name= $1, faculty_img= $2 WHERE faculty_id= $3", [req.body.faculty,req.body.img,facultyID],(err,result)=>{
          if(err){
            //  if there is an error from the sql server
            res.send(JSON.stringify({message:"account information could not be updated"}));
          }
          else {
            res.send(JSON.stringify({message:"faculty successfully updated"}));
          }
        });
      }
    }
  });
});

app.post('/removeOneFac', (req, res) => {
  db.query("DELETE FROM public.faculty WHERE faculty_id= $1", [req.body.facultyID],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success: false, message:"faculty could not be removed"}));
    }
    else {
      res.send(JSON.stringify({success: true}));
    }
  });
});

app.post('/getAdminMsgList', (req, res) => {
  db.query("SELECT A.member_id, A.name, A.student_id FROM public.account AS A INNER JOIN public.chat AS C ON A.member_id = C.student_id WHERE C.admin_id = $1", [req.body.user],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({html:"message list could not be retrieved"}));
    }
    else {
      var html = "";
      if (result.rows.length === 0) {
        html = "no messages";
      }
      else {
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem" id="msg-item-'+result.rows[i].member_id+'">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName">'
          html +=  '      <span><b id="student-name-'+result.rows[i].member_id+'">From: '+result.rows[i].name+'  ID: '+result.rows[i].student_id+'</b></span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-trash" title="trash" aria-hidden="true" id="trash-msg-'+result.rows[i].member_id+'" ></div>'
          html +=  '  </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html +=  '</div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  });
});

app.post('/sendMsg', (req, res) => {
  var user;
  if (req.body.type === "admin") {
    db.query("UPDATE public.chat SET msg_history = $1 WHERE student_id= $2 AND admin_id= $3", [req.body.chatLog, req.body.chatID, req.body.user],(err,result)=>{
      if(err){
        //  if there is an error from the sql server
        res.send(JSON.stringify({success: false}));
      }
      else {
        res.send(JSON.stringify({success: true}));
      }
    });
  }
  else {
    db.query("SELECT * FROM public.chat WHERE student_id = $1", [req.body.user],(err,result)=>{
      if(err){
        //  if there is an error from the sql server
        res.send(JSON.stringify({success: false}));
      }
      else {
        if (result.rows.length > 0) {
          //update
          db.query("UPDATE public.chat AS CH SET msg_history = $1, admin_id = A.member_id FROM public.account AS A WHERE CH.student_id= $2 AND A.acc_type = 'admin' AND A.school_no = $3", [req.body.chatLog, req.body.user, req.body.school],(err,result)=>{
            if(err){
              //  if there is an error from the sql server
              res.send(JSON.stringify({success: false}));
            }
            else {
              res.send(JSON.stringify({success: true}));
            }
          });
        }
        else {
          db.query("SELECT * FROM public.account WHERE acc_type='admin' AND school_no = $1", [req.body.school],(err,result)=>{
            if(err){
              //  if there is an error from the sql server
              res.send(JSON.stringify({success: false}));
            }
            else {
              if (result.rows.length > 0) {
                db.query("INSERT INTO public.chat(student_id, admin_id, msg_history) VALUES ($1, $2, $3)", [req.body.user, result.rows[0].member_id, req.body.chatLog],(err,result)=>{
                  if(err){
                    //  if there is an error from the sql server
                    res.send(JSON.stringify({success: false}));
                  }
                  else {
                    res.send(JSON.stringify({success: true}));
                  }
                });
              }
            }
          });
        }
      }
    });
  }
});

app.post('/trashMsg', (req, res) => {
  db.query("UPDATE public.chat SET admin_id=null WHERE student_id= $1 AND admin_id= $2", [req.body.student, req.body.admin],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success: false}));
    }
    else {
      res.send(JSON.stringify({success: true}));
    }
  });
});

app.post('/getChatHistory', (req, res) => {
  if (req.body.type==="admin") {
    db.query("SELECT msg_history FROM public.chat WHERE student_id= $1 AND admin_id= $2", [req.body.chatID, req.body.user],(err,result)=>{
      if(err){
        //  if there is an error from the sql server
        res.send(JSON.stringify({success: false, message:"failed to load message history"}));
      }
      else {
        res.send(JSON.stringify({success: true, rows: result.rows}));
      }
    });
  }
  else {
    db.query("SELECT C.msg_history FROM public.chat AS C INNER JOIN public.account AS A ON C.admin_id = A.member_id WHERE C.student_id= $1 AND A.school_no= $2", [req.body.user, req.body.school],(err,result)=>{
      if(err){
        //  if there is an error from the sql server
        res.send(JSON.stringify({success: false, message:"failed to load message history"}));
      }
      else {
        res.send(JSON.stringify({success: true, rows: result.rows}));
      }
    });
  }

});

app.post('/saveAccChanges', function(req, res){
  var user = req.body.id;
	var userpass = req.body.oldPass;

  //make query to retrieve account info and check if password is correct
  db.query("SELECT * FROM public.account WHERE member_id = $1 AND password = $2",[user,userpass],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send({success: false, message:"account information could not be updated"});
    }
    else {
      //console.log(result.rows);
      if (result.rows.length === 0) {
        res.send({success: false, message:"wrong password entered"});
      }
      else {
        //update info in db
        if (req.body.newPass !== "") {
          userpass = req.body.newPass;
        }
        if (req.body.email !== result.rows[0].email) {
          //check if email is unique
          db.query("SELECT * FROM public.account WHERE email = $1", [req.body.email],(err,result)=>{
            if(err){
              //  if there is an error from the sql server
              res.send(JSON.stringify({success: false, message:"account information could not be updated"}));
            }
            else {
              if (result.rows.length > 0) {
                res.send({success: false, message:"email registered to different account"});
              }
              else {
                //update account info
                db.query("UPDATE public.account SET email= $1, password= $2, phone_no= $3, student_id= $4, name= $5 WHERE member_id= $6", [req.body.email,userpass,req.body.phone,req.body.studID,req.body.name,req.body.id],(err,result)=>{
                  if(err){
                    //  if there is an error from the sql server
                    res.send(JSON.stringify({success: false, message:"account information could not be updated"}));
                  }
                  else {
                    res.send(JSON.stringify({success: true, message:"account information successfully updated"}));
                  }
                });
              }
            }
          });
        }
        else {
          //update account info
          db.query("UPDATE public.account SET email= $1, password= $2, phone_no= $3, student_id= $4, name= $5 WHERE member_id= $6", [req.body.email,userpass,req.body.phone,req.body.studID,req.body.name,req.body.id],(err,result)=>{
            if(err){
              //  if there is an error from the sql server
              res.send(JSON.stringify({success: false, message:"account information could not be updated"}));
            }
            else {
              res.send(JSON.stringify({success: true, message:"account information successfully updated"}));
            }
          });
        }
      }
    }
  });
});

//BEGINNING ALL ADMIN COURSES
app.post('/AdminGetAllCourses', (req,res)=>{
  var admin_id = req.body.admin_id;
  db.query("SELECT * FROM public.course WHERE public.course.admin_id = $1", [admin_id], (err, result)=>{
    if(err){
      res.send(JSON.stringify({html: "courses could not be retrieved"
      }));
    }else{
      var html = "";
      if(result.rows.length === 0){
        html = "<div class=\"info\" style=\"color:#4D4D4D;\">Sorry, no courses found</div>"
      }else{
        html += '<div style="color:#008080"><b>List of All Courses Offered in School</b><br></br></div>'
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem" id="course-item-'+result.rows[i].course_id+'">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName" id="course-card-'+result.rows[i].course_id+'">'
          html +=  '      <span><b id="course-card-'+result.rows[i].course_id+'">'+result.rows[i].dept_code+' '+result.rows[i].course_level+': </b></span>'
          html +=  '      <span id="course-card-'+result.rows[i].course_id+'">'+result.rows[i].course_name+'</span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-trash" title="delete" aria-hidden="true" id="admin-trash-course-'+result.rows[i].course_id+'" ></div>'
          html +=  '  </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  })
});

//BEGINNING ALL STUDENT COURSES
app.post('/StudGetAllCourses', (req,res)=>{
  var school_no = req.body.school_no;
  db.query("SELECT * FROM public.course, public.account WHERE public.account.acc_type='admin' AND public.account.school_no= $1 AND public.course.admin_id=public.account.member_id", [school_no], (err, result)=>{
    if(err){
      res.send(JSON.stringify({html: "course could not be retrieved"}));
    }else{
      var html = "";
      if(result.rows.length === 0){
        html = "<div class=\"info\" style=\"color:#4D4D4D;\">Sorry, no courses found</div>"
      }else{
        html += '<div style="color:#008080"><b>List of All Courses Offered in School</b><br></br></div>'
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName" id="course-card-'+result.rows[i].course_id+'">'
          html +=  '      <span><b id="course-card-'+result.rows[i].course_id+'">'+result.rows[i].dept_code+' '+result.rows[i].course_level+': </b></span>'
          html +=  '      <span id="course-card-'+result.rows[i].course_id+'">'+result.rows[i].course_name+'</span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-plus" title="Add to Wish List" aria-hidden="true" id="stud-add-course-'+result.rows[i].course_id+'" ></div>'
          html +=  '   </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  })
});

//BEGIN TRASH ADMIN COURSES
app.post('/adminTrashCourse', (req, res) => {
  var admin_id = req.body.admin_id;
  var course_id = req.body.course_id;
  db.query("DELETE FROM public.course WHERE admin_id= $1 AND course_id =$2", [admin_id, course_id],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success: false}));
    }
    else {
      res.send(JSON.stringify({success: true}));
    }
  });
});

app.post('/studAddCourse', (req, res) => {
  db.query("SELECT * FROM public.wishlist WHERE student_no = $1 AND course_no =$2", [req.body.user, req.body.course_id],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success: false}));
    }
    else {
      //console.log(result);
      if (result.rows.length === 0) {
        db.query("INSERT INTO public.wishlist(student_no, course_no) VALUES ($1, $2)", [req.body.user, req.body.course_id],(err,result)=>{
          if(err){
            //  if there is an error from the sql server
            res.send(JSON.stringify({success: false}));
          }
          else {
            res.send(JSON.stringify({success: true}));
          }
        });
      }
    }
  });
});

app.post('/getStudWishlist', (req,res)=>{
  db.query("SELECT * FROM public.wishlist INNER JOIN public.course ON public.wishlist.course_no = public.course.course_id WHERE public.wishlist.student_no= $1", [req.body.user], (err, result)=>{
    if(err){
      res.send(JSON.stringify({html: "course could not be retrieved"}));
    }else{
      var html = "";
      if(result.rows.length === 0){
        html = "<div class=\"info\" style=\"color:#4D4D4D;\">No courses added yet</div>"
      }else{
        html += '<div style="color:#008080"><b>List of Courses of interest</b><br></br></div>'
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem" id="course-wishItem-'+result.rows[i].course_id+'">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName" id="course-wish-'+result.rows[i].course_id+'">'
          html +=  '      <span><b id="course-wish-'+result.rows[i].course_id+'">'+result.rows[i].dept_code+' '+result.rows[i].course_level+': </b></span>'
          html +=  '      <span id="course-wish-'+result.rows[i].course_id+'">'+result.rows[i].course_name+'</span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-trash" title="Remove From Wish List" aria-hidden="true" id="stud-trash-course-'+result.rows[i].course_id+'" ></div>'
          html +=  '   </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  })
});

app.post('/studTrashCourse', (req, res) => {
  db.query("DELETE FROM public.wishlist WHERE student_no= $1 AND course_no =$2", [req.body.user, req.body.course],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success: false}));
    }
    else {
      res.send(JSON.stringify({success: true}));
    }
  });
});

//BEGIN STUDENT FAC COURSES - Kat (NEW)
app.post('/StudGetFacCourses', (req, res) =>{
  db.query("SELECT * FROM public.course INNER JOIN public.faculty ON public.course.faculty_no = public.faculty.faculty_id AND public.course.faculty_no = $1 AND public.faculty.school_no= $2", [req.body.faculty_no,req.body.school], (err, result)=>{
    if(err){
      res.send(JSON.stringify({html: "course could not be retrieved"}));
    }else{
      var html = "";
      if(result.rows.length === 0){
        html = "<div class=\"info\" style=\"color:#4D4D4D;\">Sorry, no courses found</div>"
      }else{
        html += '<div style="color:#008080"><b>List of All Courses Offered in Faculty of '+result.rows[0].faculty_name+'</b><br></br></div>'
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName" id="course-fac-'+result.rows[i].course_id+'">'
          html +=  '      <span><b id="course-fac-'+result.rows[i].course_id+'">'+result.rows[i].dept_code+' '+result.rows[i].course_level+': </b></span>'
          html +=  '      <span id="course-fac-'+result.rows[i].course_id+'">'+result.rows[i].course_name+'</span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-plus" title="Add to Wish List" aria-hidden="true" id="stud-addFac-course-'+result.rows[i].course_id+'" ></div>'
          html +=  '   </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  });
});

app.post('/getStudOneCourse', (req, res) =>{
  db.query("SELECT * FROM public.course WHERE course_id= $1", [req.body.course], (err, courseResult)=>{
    if(err){
      res.send(JSON.stringify({html: "course could not be retrieved"}));
    }else{
      db.query("SELECT * FROM public.textbook, public.uses_textbook WHERE text_isbn = isbn AND course_no = $1", [req.body.course],(err,bookResult)=>{
        if(err){
          //  if there is an error from the sql server
          res.send(JSON.stringify({success:false, message:"could not retrieve course information"}));
        }
        else {
          console.log(bookResult.rows);
          var html = "";
          if(courseResult.rows.length === 0){
            html = "<div class=\"info\" style=\"color:#4D4D4D;\">Sorry, course information not found</div>"
          }else{
            html +=  '  <div class="itemTopLine">'
            html +=  '    <div class="itemName">'
            html +=  '      <span><b>'+courseResult.rows[0].dept_code+' '+courseResult.rows[0].course_level+': </b></span>'
            html +=  '      <span>'+courseResult.rows[0].course_name+'</span>'
            html +=  '    </div>'
            html +=  '  </div>'
            html +=  '  <div class="itemBottomLine"></div>'
            html +=  '  <div class="info itemDescription">'+courseResult.rows[0].description+'</div>'
            for (var i=0; i<bookResult.rows.length; i++){
              html +=  '  <div class="textInfo"><b>Textbook: </b>'+bookResult.rows[i].book_name+'</div>'
              html +=  '  <div class="textInfo"><b>ISBN: </b>'+bookResult.rows[i].isbn+'</div>'
              html +=  '  <div class="textInfo"><b>Edition: </b>'+bookResult.rows[i].edition+'</div>'
              html +=  '  <div class="textInfo"><b>Price: </b>'+bookResult.rows[i].price+'</div>'
            }
            if (courseResult.rows[0].avg_rating > 0) {
              var avg = courseResult.rows[0].avg_rating.toFixed(2);
              html +=  '  <div class="avgRating">Rating: '+avg+'</div>'
            }
            html +=  '  <div class="itemTopLine">'
            html +=  '    <div class="itemName">'
            html +=  '      <span><b>COMMENTS</b></span>'
            html +=  '    </div>'
            html +=  '    <div class="oi oi-chevron-bottom" title="see comments" aria-hidden="true" id="commentsDownArrow" ></div>'
            html +=  '    <div class="oi oi-chevron-top hiddenDiv" title="hide comments" aria-hidden="true" id="commentsUpArrow" ></div>'
            html +=  '  </div>'
            html +=  '  <div class="itemBottomLine"></div>'
            html +=  '  <div id="courseComments" class="hiddenDiv"></div>'
            html +=  '  <div><button class="btn btn-primary btn-sm btn-success" id="commentFormButton">comment</button></div>'
            html +=  '  <div id="commentFormContent" class="hiddenDiv"></div>'
          }
          res.send(JSON.stringify({rows: courseResult.rows, html: html}));
        }
      });
    }
  });
});

app.post('/getCourseComments', (req, res) =>{
  db.query("SELECT * FROM public.comment WHERE course_no= $1", [req.body.course], (err, result)=>{
    if(err){
      res.send(JSON.stringify({html: "comments could not be retrieved"}));
    }else{
      var html = "";
      if(result.rows.length === 0){
        html = "<div class=\"info\" style=\"color:#4D4D4D;\">no comments yet</div>"
      }else{
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem">'
          html +=  '  <div class="itemName">'
          html +=  '    <span>'+result.rows[i].date+'</span>'
          html +=  '  </div>'
          html +=  '  <div class="info itemDescription">'+result.rows[i].feedback+'</div>'
          if (result.rows[i].student_rating > 0) {
            html +=  '  <div class="itemName">Rating: '+result.rows[i].student_rating+'</div>'
          }
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  });
});

app.post('/submitComment', (req, res) =>{
  db.query("INSERT INTO public.comment(student_rating, feedback, date, course_no) VALUES ($1, $2, $3, $4)", [req.body.rating,req.body.comment,req.body.date,req.body.course], (err, result)=>{
    if(err){
      res.send(JSON.stringify({success: false, message: "comment could not be submmitted"}));
    }else{
      //res.send(JSON.stringify({success: true}));
      var rating = parseInt(req.body.rating);
      if (rating > 0) {
        db.query("UPDATE public.course SET avg_rating = student_rating FROM public.comment WHERE student_rating IN (SELECT AVG(student_rating) FROM public.comment WHERE course_no = $1 AND student_rating > 0) AND course_id = $2", [req.body.course_id,req.body.course_id],(err,result)=>{
          if(err){
            //  if there is an error from the sql server
            res.send(JSON.stringify({success:false, message:"could not retrieve course information"}));
          }
          else {
            res.send(JSON.stringify({success:true, rows:result.rows}));
          }
        });
      }
    }
  });
});

app.post('/AdminGetOneCourse', (req, res)=>{
  db.query("SELECT * FROM public.course INNER JOIN public.faculty ON public.course.faculty_no = public.faculty.faculty_id WHERE public.course.course_id = $1", [req.body.course_id],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success:false, message:"could not retrieve course information"}));
    }
    else {
      res.send(JSON.stringify({success:true, rows:result.rows}));
    }
  });
});

app.post('/AdminGetTextbook', (req, res)=>{
  db.query("SELECT * FROM public.textbook, public.uses_textbook WHERE public.textbook.isbn = public.uses_textbook.text_isbn AND public.uses_textbook.course_no = $1", [req.body.course_id],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success:false, rows:[]}));
    }
    else {
      //console.log(result.rows);
      res.send(JSON.stringify({success:true, rows:result.rows}));
    }
  });
});

app.post('/editCourseToDB', (req,res)=>{
  db.query("SELECT * FROM public.course INNER JOIN public.faculty ON public.course.faculty_no = public.faculty.faculty_id WHERE public.course.course_id = $1 AND public.faculty.faculty_name = $2 ", [req.body.course_id, req.body.faculty],(err,result)=>{
    //console.log(req.body);
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({success:false, message: "could not update course information"}));
    }
    else {
      //console.log(result.rows);
      if(result.rows.length === 0){
        res.send(JSON.stringify({success:false, message: "faculty does not exist"}));
      }
      else{
        var newFacID = result.rows[0].faculty_no;
        db.query("SELECT * FROM public.course WHERE public.course.course_id = $1", [req.body.course_id],(err,result)=>{
          if(err){
            //  if there is an error from the sql server
            res.send(JSON.stringify({success:false, message: "could not update course information"}));
          }
          else{
            var oldLevel = "" + result.rows[0].course_level;
            if((result.rows[0].dept_code !== req.body.dept) || (oldLevel !== req.body.level)){
              db.query("SELECT * FROM public.course WHERE public.course.dept_code = $1 AND public.course.course_level = $2", [req.body.dept, req.body.level],(err,result)=>{
                if(err){
                  //  if there is an error from the sql server
                  res.send(JSON.stringify({success:false, message: "could not update course information"}));
                }
                else{
                  if(result.rows.length > 0){
                    res.send(JSON.stringify({success:false, message: "course already exists"}));
                  }
                  else{
                    var newLevel = parseInt(req.body.level);
                    db.query("UPDATE public.course SET dept_code=$1, course_level=$2, description=$3, course_name=$4, faculty_no=$5 WHERE course_id = $6", [req.body.dept, newLevel, req.body.description, req.body.name, newFacID, req.body.course_id],(err,result)=>{
                      res.send(JSON.stringify({success:true, message: "course information successfully updated"}));
                    });
                  }
                }
              });
            }
            var newLevel = parseInt(req.body.level);
            db.query("UPDATE public.course SET dept_code=$1, course_level=$2, description=$3, course_name=$4, faculty_no=$5 WHERE course_id = $6", [req.body.dept, newLevel, req.body.description, req.body.name, newFacID, req.body.course_id],(err,result)=>{
              res.send(JSON.stringify({success:true, message: "course information successfully updated"}));
            });
          }
        });
      }
    }
  });
});

app.post('/editTextbookToDB', (req,res)=>{
  db.query("SELECT * FROM public.textbook WHERE isbn= $1", [req.body.isbn],(err,result)=>{
    if(err){
      res.send(JSON.stringify({message: "could not update textbooks"}));
    }
    else {
      if (result.rows.length === 0) {
        db.query("INSERT INTO public.textbook (isbn, price, book_name, edition) VALUES($1,$2,$3,$4)", [req.body.isbn, req.body.price, req.body.name, req.body.edition],(err,result)=>{
          if(err){
            res.send(JSON.stringify({success: false, message: "could not update textbooks"}));
          }
          else {
            db.query("INSERT INTO public.uses_textbook (text_isbn, course_no) VALUES($1,$2)", [req.body.isbn, req.body.course],(err,result)=>{
              if(err){
                res.send(JSON.stringify({success: false, message: "could not update textbooks"}));
              }
              else {
                res.send(JSON.stringify({message: "course information successfully updated"}));
              }
            });
          }
        });
      }
      else {
        db.query("UPDATE public.textbook SET price= $1, book_name= $2, edition= $3 WHERE isbn= $4", [req.body.price, req.body.name, req.body.edition, req.body.isbn],(err,result)=>{
          if(err){
            res.send(JSON.stringify({success: false, message: "could not update textbooks"}));
          }
          else {
            db.query("INSERT INTO public.uses_textbook (text_isbn, course_no) SELECT $1, $2  WHERE NOT EXISTS (SELECT * FROM public.uses_textbook WHERE text_isbn= $3)", [req.body.isbn, req.body.course, req.body.isbn],(err,result)=>{
              if(err){
                res.send(JSON.stringify({success: false, message: "could not update textbooks"}));
              }
              else {
                res.send(JSON.stringify({message: "course information successfully updated"}));
              }
            });
          }
        });
      }
    }
  });
});

app.post('/getNewsContent', (req,res)=>{
  db.query("SELECT * FROM public.news AS N, public.account AS A WHERE A.school_no = $1 AND N.admin_id = A.member_id AND A.acc_type = 'admin'", [req.body.school_no],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({html:"news could not be retrieved"}));
    }
    else {
      var html = "";
      if (result.rows.length === 0) {
        html = "This is where news from your school administrator will be posted.";
      }
      else {
        for(var i=0;i<result.rows.length;i++){
          html +=  '<div class="listItem">'
          html +=  '  <div>'
          html +=  '    <span><b>'+result.rows[i].title+'</b></span>'
          html +=  '  </div>'
          html +=  '  <div>'+result.rows[i].info+'</div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html +=  '</div>'
        }
      }
      res.send(JSON.stringify({rows: result.rows, html: html}));
    }
  });
});

app.post('/searchCourse', (req,res)=>{
  db.query("SELECT * FROM public.course AS C, public.account AS A WHERE A.school_no = $1 AND C.admin_id = A.member_id AND A.acc_type = 'admin'", [req.body.school],(err,result)=>{
    if(err){
      //  if there is an error from the sql server
      res.send(JSON.stringify({html:"search failed :("}));
    }
    else {
      var html = "";
      var type = req.body.type;
      var typeID = "adminSearch";
      var typeIcon = "trash";
      var coursesFound = [];
      var keyword = req.body.key.toLowerCase();
      for(var i=0;i<result.rows.length;i++){
        var dept = result.rows[i].dept_code.toLowerCase();
        var deptnlevel = dept + result.rows[i].course_level;
        var name = result.rows[i].course_name.toLowerCase();
        var descript = result.rows[i].description.toLowerCase();

        if ((dept.includes(keyword)) || (name.includes(keyword)) || (descript.includes(keyword)) || (deptnlevel.includes(keyword))) {
          coursesFound.push(result.rows[i]);
        }
      }
      if (type === "student") {
        typeID = "studSearch";
        typeIcon = "plus";
      }
      if (coursesFound.length === 0) {
        html = "no courses found :(";
      }
      else{
        for (var i=0;i<coursesFound.length;i++) {
          html +=  '<div class="listItem">'
          html +=  '  <div class="itemTopLine">'
          html +=  '    <div class="itemName" id="course-'+typeID+'-'+coursesFound[i].course_id+'">'
          html +=  '      <span><b id="course-'+typeID+'-'+coursesFound[i].course_id+'">'+coursesFound[i].dept_code+' '+coursesFound[i].course_level+': </b></span>'
          html +=  '      <span id="course-'+typeID+'-'+coursesFound[i].course_id+'">'+coursesFound[i].course_name+'</span>'
          html +=  '    </div>'
          html +=  '    <div class="oi oi-'+typeIcon+'" title="Add to Wish List" aria-hidden="true" id="'+typeID+'-course-'+coursesFound[i].course_id+'" ></div>'
          html +=  '   </div>'
          html +=  '  <div class="itemBottomLine"></div>'
          html += ' </div>'
        }
      }
      res.send(JSON.stringify({rows: coursesFound, html: html}));
    }
  });
});

app.post('/postNewsToDB', (req, res) => {
  db.query("INSERT INTO public.news (info, title, admin_id) VALUES($1,$2,$3)", [req.body.info, req.body.title, req.body.admin_id],(err,result)=>{
    if(err){
      res.send(JSON.stringify({success: false, message: "could not post news"}));
    }
    else {
      res.send(JSON.stringify({success: true, message: "news posted successfully"}));
    }
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
