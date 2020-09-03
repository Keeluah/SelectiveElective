//client side
var currentUSer;
var currentSchool;
var userType;
var phoneNo;
var schoolName;
var studID;
var userEmail;
var userName;
var currentFacultyID;
var currentCourseID;
var currentChatID;
var currentChatLog=[];
var currentPage;
var courseAttributes;
var courseTextbooks;
var pages =["faculties-page","adminOneFac-page","adminAddFac-page","adminOneCourse-page","adminAllCourse-page","adminAddCourse-page","adminMsgList-page","chat-page","adminPostNews-page","adminSearchCourse-page","studFacCourse-page","studOneCourse-page","studAllCourse-page","studWishlist-page","account-page","studSearchCourse-page"];

function gotoPage(page){
  for(var i=0;i<pages.length;i++){
    if(page != pages[i]){
      $("#"+pages[i]).hide();
    }else{
      $("#"+pages[i]).show();
      currentPage = page;
    }
  }
  if(page==="faculties-page") {
    renderFacultyGrid();
  }
  else if (page==="adminOneFac-page") {
    $('#oneFacultyError').hide();
    renderOneFac();
  }
  else if (page==="adminMsgList-page"){
    renderAdminMsgList();
  }
  else if (page==="chat-page") {
    renderChat();
  }
  else if (page==="adminAllCourse-page") {
    renderAdminAllCourseGrid();
  }
  else if (page==="studAllCourse-page") {
    renderStudAllCourseGrid();
  }
  else if (page==="studWishlist-page") {
    renderWishlist();
  }
  else if (page==="studFacCourse-page") {
    renderStudFacCourseGrid();
  }
  else if (page==="studOneCourse-page") {
    renderStudOneCourse();
  }

};

function renderFacultyGrid(){
  //console.log(currentSchool);
  $.post("/getFaculties",{schoolID: currentSchool}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    var html = data.html;
    $("#faculties-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#faculty-card-"+data.rows[i].faculty_id).click(()=>{
        //reload page with departments
        var idStr = event.target.id;
        var idParts = idStr.split('-', 3);
        currentFacultyID = idParts[2];
        if (userType === "admin") {
          gotoPage("adminOneFac-page");
        }
        else {
          gotoPage("studFacCourse-page");
        }
      });
    };
  });
}

function renderOneFac(){
  //console.log(currentSchool);
  $.post('/getOneFac',{facultyID: currentFacultyID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    var html = data.html;
    var oldFac = data.rows[0].faculty_name;
    var oldImg = data.rows[0].faculty_img;
    $("#adminOneFac-page").html(html);
    $('#oneFacName').val(oldFac);
    $('#oneFacImg').val(oldImg);

    $("#saveOneFaculty").click(()=>{
      var newFac = $('#oneFacName').val();
      var newImg = $('#oneFacImg').val();

      if ((oldFac!==newFac) || (oldImg!==newImg)) {
        $.post('/saveOneFac',{facultyID: currentFacultyID,faculty: newFac,img: newImg,schoolID: currentSchool}).done((data)=>{
          data= JSON.parse(data);
          //console.log(data);
          $('#oneFacultyError').html(data.message);
          $('#oneFacultyError').show();
        });
      }
    });

    $("#removeOneFaculty").click(()=>{
      $("#removeFac-confirm").dialog({resizable: false, height: 180, width: 300, modal: true,
        buttons: {
          "remove": function() {
            removeFac();
            $(this).dialog( "close" );
          },
          cancel: function() {
            $(this).dialog( "close" );
          }
        }
      });
    });
  });
}

function removeFac() {
  $.post('/removeOneFac',{facultyID: currentFacultyID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    if (data.success) {
      gotoPage("faculties-page");
    }
    else {
      $('#oneFacultyError').html(data.message);
      $('#oneFacultyError').show();
    }
  });
}

// BEGINNING OF ADMIN ALL Courses
function renderAdminAllCourseGrid(){
  $.post("/AdminGetAllCourses", {admin_id: currentUSer}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#adminAllCourse-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#course-card-"+data.rows[i].course_id).click(()=>{
        //console.log(event.target.id);
        var idStr = event.target.id;
        var idParts = idStr.split('-',3);
        currentCourseID = idParts[2];
        renderAdminOneCourseGrid();
      });

      $("#admin-trash-course-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-', 4);
        currentCourseID = idParts[3];
        $("#adminTrashCourse-confirm").dialog({resizable: false, height: 180, width: 300, modal: true,
          buttons: {
            "delete": function() {
              adminTrashCourse();
              $(this).dialog( "close" );
            },
            cancel: function() {
              $(this).dialog( "close" );
            }
          }
        });
      });
    };
  });
}

//BEGIN ADMIN TRASH All COURSES
function adminTrashCourse() {
  $.post('/adminTrashCourse',{admin_id: currentUSer, course_id: currentCourseID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    if (data.success) {
      $("#course-item-"+currentCourseID).hide();
    }
  });
}

//BEGIN STUDENT ADD COURSE TO WISLIST
function studAddCourse() {
  $.post("/studAddCourse",{user: currentUSer, course_id: currentCourseID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
  });
}

function renderAdminMsgList() {
  $.post('/getAdminMsgList',{user: currentUSer}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    var html = data.html;
    $("#adminMsgList-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#student-name-"+data.rows[i].member_id).click(()=>{
        //reload page with departments
        var idStr = event.target.id;
        var idParts = idStr.split('-', 3);
        currentChatID = idParts[2];
        gotoPage("chat-page");
      });
      $("#trash-msg-"+data.rows[i].member_id).click(()=>{
        //reload page with departments
        var idStr = event.target.id;
        var idParts = idStr.split('-', 3);
        currentChatID = idParts[2];
        $("#trashMsg-confirm").dialog({resizable: false, height: 180, width: 300, modal: true,
          buttons: {
            "delete": function() {
              trashMsg();
              $(this).dialog( "close" );
            },
            cancel: function() {
              $(this).dialog( "close" );
            }
          }
        });
      });

    };
  });
}

function renderAdminOneCourseGrid(){
  $('#editCourseError').hide();
  $.post("/AdminGetOneCourse", {course_id: currentCourseID}).done((data)=>{
    data=JSON.parse(data);
    if(data.success){
      courseAttributes = {faculty_id: data.rows[0].faculty_id, course_id: currentCourseID, faculty: data.rows[0].faculty_name, dept: data.rows[0].dept_code, level: ""+data.rows[0].course_level, name: data.rows[0].course_name, description: data.rows[0].description};
      $.post("/AdminGetTextbook", {course_id: currentCourseID}).done((data)=>{
        data=JSON.parse(data);
        if(data.rows.length===0){
          courseTextbooks = {course_id: currentCourseID, isbn1: "", text1: "", edition1: "", price1: "", isbn2: "", text2: "", edition2: "", price2: ""};
          $('#editISBN1').val("");
          $('#editTextbook1').val("");
          $('#editEdition1').val("");
          $('#editPrice1').val("");
          $('#editISBN2').val("");
          $('#editTextbook2').val("");
          $('#editEdition2').val("");
          $('#editPrice2').val("");
        }
        else if (data.rows.length === 1){
            courseTextbooks = {course_id: currentCourseID, isbn1: data.rows[0].isbn, text1: data.rows[0].book_name, edition1: data.rows[0].edition, price1: data.rows[0].price, isbn2: "", text2: "", edition2: "", price2: ""};
            $('#editISBN1').val(courseTextbooks.isbn1);
            $('#editTextbook1').val(courseTextbooks.text1);
            $('#editEdition1').val(courseTextbooks.edition1);
            $('#editPrice1').val(courseTextbooks.price1);
            $('#editISBN2').val("");
            $('#editTextbook2').val("");
            $('#editEdition2').val("");
            $('#editPrice2').val("");
        }
        else if (data.rows.length === 2){
            courseTextbooks = {course_id: currentCourseID, isbn1: data.rows[0].isbn, text1: data.rows[0].book_name, edition1: data.rows[0].edition, price1: data.rows[0].price, isbn2: data.rows[1].ISBN, text2: data.rows[1].text, edition2: data.rows[1].edition, price2: data.rows[1].price};
            $('#editISBN1').val(courseTextbooks.isbn1);
            $('#editTextbook1').val(courseTextbooks.text1);
            $('#editEdition1').val(courseTextbooks.edition1);
            $('#editPrice1').val(courseTextbooks.price1);
            $('#editISBN2').val(courseTextbooks.isbn2);
            $('#editTextbook2').val(courseTextbooks.text2);
            $('#editEdition2').val(courseTextbooks.edition2);
            $('#editPrice2').val(courseTextbooks.price2);
        }

        $('#editFaculty').val(courseAttributes.faculty);
        $('#editDeptCode').val(courseAttributes.dept);
        $('#editCourseLevel').val(courseAttributes.level);
        $('#editCourseName').val(courseAttributes.name);
        $('#editDescription').val(courseAttributes.description);

        gotoPage("adminOneCourse-page");

      });
    }
    else{
      $('#editCourseError').html(data.message);
      $('#editCourseError').show();
    }
  });
}

// BEGINNING OF STUDENT ALL Courses
function renderStudAllCourseGrid(){
  $.post("/StudGetAllCourses", {school_no: currentSchool}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#studAllCourse-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#course-card-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-',3);
        currentCourseID = idParts[2];
        gotoPage("studOneCourse-page");
      });

      $("#stud-add-course-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-', 4);
        currentCourseID = idParts[3];
        studAddCourse();
      });

    };
  });
}

//BEGIN OF STUDENT FAC COURSE LIST - Kat (NEW)
function renderStudFacCourseGrid(){
  $.post("/StudGetFacCourses", {faculty_no: currentFacultyID, school: currentSchool}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#studFacCourse-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#course-fac-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-',3);
        currentCourseID = idParts[2];
        gotoPage("studOneCourse-page");
      });

      $("#stud-addFac-course-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-', 4);
        currentCourseID = idParts[3];
        studAddCourse();
      });
    };
  });
}

function renderStudOneCourse(){
  $.post("/getStudOneCourse", {course: currentCourseID}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#studOneCourse-page").html(html);
    if (data.rows.length > 0) {
      $("#commentsDownArrow").click(()=>{
        renderCourseComments();
      });
      $("#commentFormButton").click(()=>{
        renderCommentsForm();
      });
    }
  });
}

function renderCourseComments(){
  $.post("/getCourseComments", {course: currentCourseID}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#courseComments").html(html);
    $("#courseComments").show();
    $("#commentsDownArrow").hide();
    $("#commentsUpArrow").show();
    $("#commentsUpArrow").click(()=>{
      $("#courseComments").hide();
      $("#commentsUpArrow").hide();
      $("#commentsDownArrow").show();
    });
  });
}

function renderCommentsForm(){
  $("#commentFormButton").hide();
  $("#commentError").hide();
  var content = "";
  content += '<div><label class="simpleLabel">Comment</label></div>'
  content += '<div><textarea class="addCourseTextarea" id="commentInput"></textarea></div>'
  content += '<div><label class="simpleLabel">Rating</label>'
  content += '  <select id="studentRating">'
  content += '    <option value="--">--</option>'
  content += '    <option value="1">1</option>'
  content += '    <option value="2">2</option>'
  content += '    <option value="3">3</option>'
  content += '    <option value="4">4</option>'
  content += '    <option value="5">5</option>'
  content += '  </select>'
  content += '</div>'
  content += '<div class="errorMsg hiddenDiv" id="commentError"></div>'
  content += '<div><button class="btn btn-primary btn-sm btn-success" id="submitCommentButton">submit</button></div>'
  $("#commentFormContent").html(content);
  $("#commentFormContent").show();
  $("#submitCommentButton").click(()=>{
    var time = new Date().toLocaleTimeString();
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + '/' + dd + '/' + yyyy + " " + time;
    var comment = userName + ": " + $("#commentInput").val();
    var rating = $("#studentRating").val();

    if (rating==="--") {
      rating = 0;
    }
    else {
      rating = parseInt(rating);
    }
    $.post("/submitComment", {course: currentCourseID,comment: comment,rating: rating,date: today}).done((data)=>{
      data=JSON.parse(data);
      if (data.success){
        $("#commentFormButton").show();
        $("#commentFormContent").hide();
        var newComment = "";
        newComment +=  '<div class="listItem">'
        newComment +=  '  <div class="itemName">'
        newComment +=  '    <span>'+today+'</span>'
        newComment +=  '  </div>'
        newComment +=  '  <div class="info itemDescription">'+comment+'</div>'
        if (rating > 0) {
          newComment +=  '  <div class="itemName">Rating: '+rating+'</div>'
        }
        newComment +=  '  <div class="itemBottomLine"></div>'
        newComment += ' </div>'
        $("#courseComments").append(newComment);
      }
      else {
        $("#commentError").html(data.message);
        $("#commentError").show();
      }
    });
  });
}

function renderWishlist(){
  $.post("/getStudWishlist", {user: currentUSer}).done((data)=>{
    data=JSON.parse(data);
    var html = data.html;
    $("#studWishlist-page").html(html);
    for(var i=0;i<data.rows.length;i++){
      $("#course-wish-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-',3);
        currentCourseID = idParts[2];
        gotoPage("studOneCourse-page");
      });

      $("#stud-trash-course-"+data.rows[i].course_id).click(()=>{
        var idStr = event.target.id;
        var idParts = idStr.split('-', 4);
        currentCourseID = idParts[3];
        $("#studTrashCourse-confirm").dialog({resizable: false, height: 180, width: 300, modal: true,
          buttons: {
            "remove": function() {
              studTrashCourse();
              $(this).dialog( "close" );
            },
            cancel: function() {
              $(this).dialog( "close" );
            }
          }
        });
      });
    }
  });
};

function studTrashCourse() {
  $.post('/studTrashCourse',{user: currentUSer, course: currentCourseID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    if (data.success) {
      $("#course-wishItem-"+currentCourseID).hide();
    }
  });
}

function trashMsg() {
  $.post('/trashMsg',{admin: currentUSer, student: currentChatID}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    if (data.success) {
      $("#msg-item-"+currentChatID).hide();
    }
  });
}

function renderChat() {
  $.post('/getChatHistory',{user: currentUSer, type: userType, chatID: currentChatID, school: currentSchool}).done((data)=>{
    data= JSON.parse(data);
    //console.log(data);
    var html = "";
    if (!data.success) {
      html = data.message;
    }
    else if (data.rows.length > 0){
      currentChatLog = data.rows[0].msg_history;
      for (var i=0; i<data.rows[0].msg_history.length; i++){
        var msg = data.rows[0].msg_history[i];
        if (msg.includes(userName)) {
          html += "<li style=\"color: green;\">" + msg + "</li>";
        }
        else {
          html += "<li style=\"color: navy;\">" + msg + "</li>";
        }
      }
    }
    $('#msgList').html(html);
  });
}

// runs after the page has been loaded
$(()=>{
  currentUSer = $('#userAccID').html();
  currentSchool = $('#userSchoolID').html();
  userType = $('#userType').html();
  phoneNo = $('#userPhoneNo').html();
  schoolName = $('#userSchoolName').html();
  studID = $('#userStundentID').html();
  userEmail = $('#userEmail').html();
  userName = $('#userName').html();

  if (userType === "admin") {
    //hide student menu items
    $('#studentNavButtons').hide();
    $('#newsSection').hide();
    $('#accStudenID').hide();
    $('#studIDLabel').hide();
  }
  else {
    //hide admin menu items
    $('#adminNavButtons').hide();
    $('#accPhone').hide();
    $('#phoneLabel').hide();
  }
  gotoPage("faculties-page");

  $.post('/getNewsContent',{school_no: currentSchool}).done((data)=>{
    data= JSON.parse(data);
    var html = data.html;
    $("#newsContent").html(html);
  });

  $('#accountType').change(function(){
    var accType = $(this).val();
    $('#accType').val(accType);
    if (accType === "student") {
      $('#sidField').show();
      $('#schoolField').show();
      $('#phoneField').hide();
      $('#addressField').hide();
    }
    else if (accType === "admin") {
      $('#schoolField').show();
      $('#phoneField').show();
      $('#addressField').show();
      $('#sidField').hide();
    }
    else {
      $('#schoolField').hide();
      $('#sidField').hide();
      $('#phoneField').hide();
      $('#addressField').hide();
      $('#accType').val('');
    }
  });

  $('#facultiesButton').click(()=>{
    gotoPage("faculties-page");
  });

  $('#addFacultyButton').click(()=>{
    $('#addFacultyError').hide();
    gotoPage("adminAddFac-page");
  });

  $('#adminAllCourseButton').click(()=>{
    gotoPage("adminAllCourse-page");
  });

  $('#addCourseButton').click(()=>{
    $('#addCourseError').hide();
    gotoPage("adminAddCourse-page");
  });

  $('#adminChatButton').click(()=>{
    gotoPage("adminMsgList-page");
  });

  $('#postNewsButton').click(()=>{
    gotoPage("adminPostNews-page");
  });

  $('#studAllCourseButton').click(()=>{
    gotoPage("studAllCourse-page");
  });

  $('#userWishlistButton').click(()=>{
    gotoPage("studWishlist-page");
  });

  $('#studentChatButton').click(()=>{
    gotoPage("chat-page");
  });

  $('#accInfoButton').click(()=>{
    $('#accName').val(userName);
    $('#accEmail').val(userEmail);
    $('#accSchool').val(schoolName);
    $('#accPhone').val(phoneNo);
    $('#accStudenID').val(studID);
    $('#accOldPass').val("");
    $('#accNewPass').val("");
    $('#accInfoError').hide();
    gotoPage("account-page");
  });

  $('#addFacultyToDB').click(()=>{
    //check required inputs, call post method to insert course in DB
    var fName = $('#facName').val();
    var fImg = $('#facImg').val();

    if ((fName === "") || (fImg === "")) {
      $('#addFacultyError').html("missing required* fields");
      $('#addFacultyError').show();
    }
    else {
      $('#addFacultyError').hide();

      $.post("/addFacultyToDB",{faculty: fName, img: fImg, school: currentSchool}).done((data)=>{
        //console.log(data);
        data= JSON.parse(data);
        $('#addFacultyError').html(data.message);
        $('#addFacultyError').show();
      });
    }
  });

  $('#addCourseToDB').click(()=>{
    //check required inputs, call post method to insert course in DB
    var cFaculty = $('#addFaculty').val();
    var cDept = $('#addDeptCode').val();
    var cLevel = $('#addCourseLevel').val();
    var cName = $('#addCourseName').val();

    if ((cFaculty === "") || (cDept === "") || (cLevel === "") || (cName ==="")) {
      $('#addCourseError').html("missing required* fields");
      $('#addCourseError').show();
    }
    else {
      $('#addCourseError').hide();
      var cDescription = $('#addDescription').val();
      var cISBN1 = $('#ISBN1').val();
      var cText1 = $('#textbook1').val();
      var cEdition1 = $('#edition1').val();
      var cprice1 = $('#price1').val();
      var cISBN2 = $('#ISBN2').val();
      var cText2 = $('#textbook2').val();
      var cEdition2 = $('#edition2').val();
      var cprice2 = $('#price2').val();

      $.post("/addCourseToDB",{
          faculty: cFaculty, dept: cDept, level: cLevel, name: cName, description: cDescription, admin: currentUSer,
          isbn1: cISBN1, text1: cText1, edition1: cEdition1, price1: cprice1, isbn2: cISBN2, text2: cText2, edition2: cEdition2, price2: cprice2
        }).done((data)=>{
        //console.log(data);
        data= JSON.parse(data);
        $('#addCourseError').html(data.message);
        $('#addCourseError').show();
      });
    }
  });

  $('#sendMsg').submit((e)=>{
    e.preventDefault();
    if ($('#chatInput').val() !== "") {
      var newMsg = userName + ": " + $('#chatInput').val();
      currentChatLog.push(newMsg);
      $('#msgList').append("<li style=\"color: green;\">" + newMsg + "</li>");
      $('#chatInput').val("");
      //call post method to store new msg in db
      $.post("/sendMsg",{user: currentUSer, type: userType, chatID: currentChatID, chatLog: currentChatLog, school: currentSchool}).done((data)=>{
        //console.log(data);
      });
    }
  });

  $('#searchForm').submit((e)=>{
    e.preventDefault();
    //console.log($('#searchCoursesText').val());
    if ($('#searchCoursesText').val() !== "") {
      //call post method to search db
      $.post("/searchCourse",{key: $('#searchCoursesText').val(), type: userType, school: currentSchool}).done((data)=>{
        //console.log(data);
        data= JSON.parse(data);
        var html = data.html;
        var pagetype = "adminSearch";
        if (userType === "student") {
          pagetype = "studSearch"
        }
        var pageID = pagetype + "Course-page";
        $("#"+pageID).html(html);
        gotoPage(pageID);
        for(var i=0;i<data.rows.length;i++){
          $("#course-"+pagetype+"-"+data.rows[i].course_id).click(()=>{
            var idStr = event.target.id;
            var idParts = idStr.split('-',3);
            currentCourseID = idParts[2];
            if (userType === "admin"){
              renderAdminOneCourseGrid();
            }
            else {
              gotoPage("studOneCourse-page");
            }
          });

          $("#"+pagetype+"-course-"+data.rows[i].course_id).click(()=>{
            var idStr = event.target.id;
            var idParts = idStr.split('-', 3);
            currentCourseID = idParts[2];
            if (userType === "admin") {
              $("#adminTrashCourse-confirm").dialog({resizable: false, height: 180, width: 300, modal: true,
                buttons: {
                  "delete": function() {
                    adminTrashCourse();
                    $(this).dialog( "close" );
                  },
                  cancel: function() {
                    $(this).dialog( "close" );
                  }
                }
              });
            }
            else {
              studAddCourse();
            }
          });

        };

      });
    }
  });

  $('#editCourseToDB').click(()=>{
    if (($('#editFaculty').val()==="") || ($('#editDeptCode').val()==="") || ($('#editCourseLevel').val()==="") || ($('#editCourseName').val()==="")) {
      $('#editCourseError').html("missing required* fields");
      $('#editCourseError').show();
    }
    else {
      var newCourseAttributes = {faculty_id: courseAttributes.faculty_id, course_id: currentCourseID, faculty: $('#editFaculty').val(), dept: $('#editDeptCode').val(), level: $('#editCourseLevel').val(), name: $('#editCourseName').val(), description: $('#editDescription').val()};
      var newCourseTextbooks = {course_id: currentCourseID, isbn1: $('#editISBN1').val(), text1:$('#editTextbook1').val(), edition1: $('#editEdition1').val(), price1: $('#editPrice1').val(), isbn2: $('#editISBN2').val(), text2: $('#editTextbook2').val(), edition2: $('#editEdition2').val(), price2: $('#editPrice2').val()};

      if((courseAttributes.faculty !== newCourseAttributes.faculty) || (courseAttributes.dept !== newCourseAttributes.dept) || (courseAttributes.level !== newCourseAttributes.level) || (courseAttributes.name !== newCourseAttributes.name) || (courseAttributes.description !== newCourseAttributes.description)){
        $.post("/editCourseToDB", newCourseAttributes).done((data)=>{
          data= JSON.parse(data);
          $('#editCourseError').html(data.message);
          $('#editCourseError').show();
        });
      }
      if(courseTextbooks !== newCourseTextbooks){
        if (newCourseTextbooks.isbn1 !== null) {
          $.post("/editTextbookToDB", {course: currentCourseID, isbn: newCourseTextbooks.isbn1, name: newCourseTextbooks.text1, price: newCourseTextbooks.price1, edition: newCourseTextbooks.edition1}).done((data)=>{
            data= JSON.parse(data);
            if (data.success && (newCourseTextbooks.isbn2 !== null)) {
              $.post("/editTextbookToDB", {course: currentCourseID, isbn: newCourseTextbooks.isbn2, name: newCourseTextbooks.text2, price: newCourseTextbooks.price2, edition: newCourseTextbooks.edition2}).done((data)=>{
                $('#editCourseError').html(data.message);
                $('#editCourseError').show();
              });
            }
            else {
              $('#editCourseError').html(data.message);
              $('#editCourseError').show();
            }
          });
        }
        else if (newCourseTextbooks.isbn2 !== null) {
          $.post("/editTextbookToDB", {course: currentCourseID, isbn: newCourseTextbooks.isbn2, name: newCourseTextbooks.text2, price: newCourseTextbooks.price2, edition: newCourseTextbooks.edition2}).done((data)=>{
            $('#editCourseError').html(data.message);
            $('#editCourseError').show();
          });
        }
      }
    }
  });

  $('#postNewsToDB').click(()=>{
    //check required inputs, call post method to insert course in DB
    var newsName = $('#postNewsName').val();
    var newsInfo = $('#postNewsInfo').val();

    if ((newsName === "") || (newsInfo === "")) {
      $('#addPostNewsError').html("missing required* fields");
      $('#addPostNewsError').show();
    }
    else {
      $('#addPostNewsError').hide();

      $.post("/postNewsToDB",{title: newsName, info: newsInfo, admin_id: currentUSer}).done((data)=>{
        //console.log(data);
        data= JSON.parse(data);
        $('#addPostNewsError').html(data.message);
        $('#addPostNewsError').show();
      });
    }
  });

  $('#saveAccChanges').click(()=>{
    //check required inputs, call post method to update DB
    var uName = $('#accName').val();
    var uEmail = $('#accEmail').val();
    var uSchool = $('#accSchool').val();
    var uPhone = $('#accPhone').val();
    var uStudID = $('#accStudenID').val();
    var uOldPass = $('#accOldPass').val();
    var uNewPass = $('#accNewPass').val();

    if ((uName === "") || (uEmail === "") || (uSchool === "") || (uOldPass === "")) {
      $('#accInfoError').html("missing required* fields");
      $('#accInfoError').show();
    }
    else {
      $.post("/saveAccChanges",{name: uName, email: uEmail, school: uSchool, id: currentUSer, accType: userType,
        phone: uPhone, studID: uStudID, oldPass: uOldPass, newPass: uNewPass}).done((data)=>{
        //console.log(data);
        data= JSON.parse(data);
        $('#accInfoError').html(data.message);
        $('#accInfoError').show();
        if (data.success){
          userName = uName;
          userEmail = uEmail;
          phoneNo = uPhone;
          studID = uStudID;
        }
      });
    }
  });

});
