var validator = require('validator');
var validate = require('../utils/validate');
var util = require('../utils/util');
var constant = require('../utils/constant');
var emailVerifyTemplate = require('../utils/templates/emailVerify');
var activationTemplate = require('../utils/templates/activation');

var REALM = 'school';


module.exports = function(School) {
    util.disableAllMethodsBut(School);

    School.register = function(data, cb){
        var currentTime = new Date();
        var validatedData = {};
        validatedData.address = {};
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }
        if(!data.email || !validate.isEmail(data.email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }
        validatedData.email = data.email;
        if(!data.schoolName || !validator.isLength(data.schoolName, {min:2, max: 100})){
            cb(util.getGenericError("Error", 400, "Invalid School Name"));
            return;
        }
        validatedData.schoolName = data.schoolName;
        if(!data.name || !validator.isLength(data.name, {min:2, max: 100})){
            cb(util.getGenericError("Error", 400, "Invalid Name"));
            return;
        }
        validatedData.name = data.name;
        if(data.mobile && !validator.isNumeric(data.mobile) && !validator.isLength(data.mobile, {min:10, max: 10})){
            cb(util.getGenericError("Error", 400, "Invalid Phone number"));
            return;
        }
        validatedData.mobile = data.mobile;
        if(!data.address.street || !validate.isStreet(data.address.street)){
            cb(util.getGenericError("Error", 400, "Invalid Street"));
            return;
        }
        validatedData.address.street = data.address.street;
        if(!data.address.city || !validate.isCity(data.address.city)){
            cb(util.getGenericError("Error", 400, "Invalid city"));
            return;
        }
        validatedData.address.city = data.address.city;
        if(!data.address.state || !validate.isState(data.address.state)){
            cb(util.getGenericError("Error", 400, "Invalid state"));
            return;
        }
        validatedData.address.state = data.address.state;
        if(!data.address.pincode || !validate.isPincode(data.address.pincode)){
            cb(util.getGenericError("Error", 400, "Invalid pincode"));
            return;
        }
        validatedData.address.pincode = data.address.pincode;
        if(data.schoolBranch)
            validatedData.SchoolBranch = data.schoolBranch;

        School.findOne({where: {email: validatedData.email}}, function(err, schoolInstance){
            if(err){
                cb(err);
                return;
            }
            if(schoolInstance){
                cb(util.getGenericError('Error', 400, 'Email is already registered'));
                return;
            }
            School.findOne({where: {schoolName: validatedData.schoolName}}, function(err, schoolInstance){
                if(err){
                    cb(err);
                    return;
                }
                if(schoolInstance && schoolInstance.email){
                    cb(util.getGenericError('Error', 400, 'School name is already registered'));
                    return;
                }else{
                    validatedData.verificationToken = util.getToken(constant.EMAIL_VERIFICATION_TOKEN_LENGTH, function(err, token){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        validatedData.emailVerified = false;
                        validatedData.activated = false;
                        validatedData.created = currentTime;
                        validatedData.lastUpdate = currentTime;
                        validatedData.emailVerificationTokenTtl = util.addTime(currentTime, constant.EMAIL_VERIFICATION_TOKEN_TIME);
                        validatedData.emailVerificationToken = token;

                        School.create(validatedData, function(err, newInstance){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            var link = constant.EMAIL_VERIFICATION_TOKEN_LINK.replace('TOKEN_HERE', newInstance.emailVerificationToken);
                            link = link.replace('ID_HERE', newInstance.id);
                            var html = emailVerifyTemplate.replace('LINK_HERE', link);
                            util.sendEmail(newInstance.email, constant.VERIFY_EMAIL_SUBJECT, html, constant.FROM_NO_REPLY);
                            util.sendSMS(newInstance.mobile, constant.SCHOOL_REG_SMS.replace("SCHOOLNAME", newInstance.schoolName));
                            var response = {};
                            response.data = {
                                "name": newInstance.name,
                                "email": newInstance.email
                            };
                            response.status = 200;
                            response.message = 'School is successfully registered';
                            cb(null, response);
                            return;
                        });
                    });
                }
            });
        });
    };

    School.remoteMethod(
		'register',
		{
			description: "Registration of School",
			accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
			returns: {arg:'response',type:'object'},
            http: {path: '/register', verb: 'post'}
		}
	);



    School.verifyEmail = function(token, id, cb){
        var currentTime = new Date();
        if(!token || !id || !typeof token == 'string' || !typeof id == 'string'){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }

        School.findOne({where: {id: id, emailVerificationToken: token}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(schoolInstance && schoolInstance.emailVerificationTokenTtl > currentTime){
                schoolInstance.emailVerified = true;
                schoolInstance.emailVerificationToken = "";
                schoolInstance.save(function(err, newSchoolInstance){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
                    response.status = "200";
                    response.title = 'Successfully registered';
                    response.message = "Your account has been verified, We will go for manual activation and then will let you know.";
                    response.data = {
                        "name": newSchoolInstance.name,
                        "email": newSchoolInstance.email
                    };
                    cb(null, response);
                });
            }else{
                cb(util.getGenericError("Error", 400, "Invalid attempt to verify"));
                return;
            }
        });
    }

    School.remoteMethod(
		'verifyEmail',
		{
			description: "verifies email",
			accepts: [{arg: 'token', type: 'string'},
                        {arg: 'id', type: 'string'}],
			returns: {arg:'response',type:'object'},
            http: {path: '/verify_email', verb: 'get'}
		}
	);



    School.activateAccount = function(id, token, data, cb){
        var currentTime = new Date();
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }
        if(!validate.isPassword(data.password)){
            cb(util.getGenericError("Error", 400, "Invalid Password"));
            return;
        }
        School.findOne({where: {id: id, activationToken: token}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(schoolInstance && schoolInstance.activationTokenTtl > currentTime){
                schoolInstance.activated = true;
                schoolInstance.activationToken = "";
                util.cryptPassword(data.password , function(err , hashPassword){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    schoolInstance.password = hashPassword;
                    schoolInstance.save(function(err, newSchoolInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        accessToken = util.getAuthData(newSchoolInstance.id);
                        newSchoolInstance.accessToken = accessToken.secret;
                        newSchoolInstance.accessTokenTtl = util.addTime(currentTime,  constant.ACCESSTOKEN_TTL);
                        newSchoolInstance.save(function(err, updatedSchoolInstance){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            var response = {};
                            response.data = {};
                            response.status = 'SUCCESS';
                            response.data.teacher = updatedSchoolInstance;
                            response.message = "Your account has been Activated, now Redirecting to Dashboard";
                            response.data.secret = accessToken;
                            cb(null, response);
                            return;
                        });

                    });
                });
            }else{
                cb(util.getGenericError("Error", 400, "Invalid attempt to activate"));
                return;
            }
        });
    }
    School.remoteMethod(
		'activateAccount',
		{
			description: "activates account",
            accepts: [{arg: 'id', type: 'string'}, {arg: 'token', type: 'string'},{arg: 'data', type: 'object', http: {source: 'body'}}],
			returns: {arg:'response',type:'object', http: { source: 'res'}},
            http: {path: '/activate_account', verb: 'post'}
		}
	);

    School.sendActivationLink = function(data, cb){
        var currentTime = new Date();
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }
        School.findOne({where: {id: data.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError('Error', 400, 'Invalid Request'));
                return;
            }
            if(schoolInstance.emailVerified == false){
                cb(util.getGenericError('Error', 400, 'Email is not verified yet'));
                return;
            }
            util.getToken(constant.ACTIVATION_TOKEN_LENGTH, function(err, token){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(token){
                    schoolInstance.activationToken = token;
                    schoolInstance.activationTokenTtl = util.addTime(currentTime, constant.ACTIVATION_TOKEN_TIME);
                    schoolInstance.save(function(err, newSchoolInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var link = constant.ACTIVATION_TOKEN_LINK.replace('TOKEN_HERE', newSchoolInstance.activationToken);
                        link = link.replace('ID_HERE', newSchoolInstance.id);
                        var html = activationTemplate.replace('LINK_HERE', link);
                        util.sendEmail(newSchoolInstance.email, constant.ACTIVATE_SUBJECT, html, constant.FROM_NO_REPLY);
                        var response = {};
                        response.data = {
                            "name": newSchoolInstance.name,
                            "email": newSchoolInstance.email
                        };
                        response.status = 200;
                        response.message = 'Activation link sent';
                        cb(null, response);
                        return;
                    });
                }else{
                    cb(util.getGenericError("Error", 400, "Invalid request"));
                    return;
                }
            });
        });
    }

    School.remoteMethod(
		'sendActivationLink',
		{
			description: "sends activation link",
			accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
			returns: {arg:'response',type:'object'},
            http: {path: '/send_activation_link', verb: 'post'}
		}
	);



    School.login = function(data, cb){
        var AccessTokenx =  School.app.models.AccessTokenx;
        var Student =  School.app.models.Student;
        var Teacher =  School.app.models.Teacher;
        var Event =  School.app.models.Event;
        var ToDoList = School.app.models.ToDoList;
        var validateData = {};
        var currentTime = new Date();
        var response = {};

        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }
        if(!data.email || !validate.isEmail(data.email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }
        if(!data.password){
            cb(util.getGenericError("Error", 400, "Invalid Password"));
            return;
        }
        if(!data.scope){
            cb(util.getGenericError("Error", 400, "Invalid Scope"));
            return;
        }

        School.findOne({where: {email: data.email}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError('Error', 400, 'Email is not registered'));
                return;
            }
            util.comparePassword(data.password, schoolInstance.password, function(err, isMatched){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(isMatched == false){
                    cb(util.getGenericError('Error', 400, 'Incorrect Password'));
                    return;
                }
                if(schoolInstance.activated == false){
                     cb(util.getGenericError('Error', 400, 'Your school is not yet activated'));
                    return;
                }

                if(data.gcmKey){
                    var gcm = {};
                    if(data.scope == constant.ANDROID_SCOPE){
                        gcm.androidKey = data.gcmKey;
                        gcm.androidKeyCreated = currentTime;
                        gcm.androidKeyExpiry = util.addTime(currentTime, constant.ANDROID_GCM_KEY_TIME);
                    }
                    else if(data.scope == constant.IOS_SCOPE){
                        gcm.iosKey = data.gcmKey;
                        gcm.iosKeyCreated = currentTime;
                        gcm.iosKeyExpiry = util.addTime(currentTime, constant.IOS_GCM_KEY_TIME);
                    }else if(data.scope == constant.WEB_SCOPE){
                        gcm.webKey = data.gcmKey;
                        gcm.webKeyCreated = currentTime;
                        gcm.webKeyExpiry = util.addTime(currentTime, constant.WEB_GCM_KEY_TIME);
                    }
                    gcm.realm = REALM;
                    schoolInstance.gcms.create(gcm, function(err, deviceInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        util.updateUserAccessToken(AccessTokenx, null, schoolInstance.id, data.scope, function(err, accessToken){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            schoolInstance.accessToken = accessToken;
                            cb(null, schoolInstance);
                            return;
                        });
                    });
                }
                else{
                    Student.count({schoolId: schoolInstance.id}, function(err, count) {
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        schoolInstance.studentCount = count;
                        Teacher.count({schoolId : schoolInstance.id}, function(err, count){
                            schoolInstance.teacherCount = count;
                            schoolInstance.totalUsers = count + schoolInstance.studentCount;
                            Event.find({where : {schoolId : schoolInstance.id} , limit : 5, skip : 0}, function(err, events){
                                if(err){
                                    cb(util.getInternalServerError(err));
                                    return;
                                }
                                response.events = events;
                                ToDoList.find({where : {schoolId : schoolInstance.id} , limit : 5, skip : 0}, function(err, toDoList){
                                    if(err){
                                        cb(util.getInternalServerError(err));
                                        return;
                                    }
                                    response.toDoList = toDoList;
                                    response.schoolInstance = {};
                                    response.schoolInstance.schoolName = schoolInstance.schoolName;
                                    response.schoolInstance.email = schoolInstance.email;
                                    response.schoolInstance.name = schoolInstance.name;
                                    response.schoolInstance.id = schoolInstance.id;
                                    response.schoolInstance.studentCount = schoolInstance.studentCount;
                                    response.schoolInstance.teacherCount = schoolInstance.teacherCount;
                                    response.schoolInstance.totalUsers = schoolInstance.totalUsers;
                                    response.schoolInstance.visitors = 15;

                                    util.updateUserAccessToken(AccessTokenx, null, schoolInstance.id, data.scope, function(err, accessToken){
                                        if(err){
                                            cb(util.getInternalServerError(err));
                                            return;
                                        }
                                        response.schoolInstance.accessToken = accessToken;
                                        cb(null, response);
                                        return;
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
    };
    School.remoteMethod(
        'login',
        {
            description: "Login",
            accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
            returns: {arg:'response',type:'object'},
            http: {path: '/login', verb: 'post'}
        }
    );

    School.addTeacher = function(required , data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Teacher = School.app.models.Teacher;
        var currentTime = new Date();

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.email || !validate.isEmail(data.email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }
        if(!data.name || !validator.isLength(data.name, {min:2, max: 100})){
            cb(util.getGenericError("Error", 400, "Invalid Teacher Name"));
            return;
        }
        if(data.mobile && !validator.isNumeric(data.mobile) && !validator.isLength(data.mobile, {min:10, max: 10})){
            cb(util.getGenericError("Error", 400, "Invalid Phone number"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}],
            where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Teacher.findOne({where : {email : data.email}}, function(err, teacherInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(teacherInstance){
                    cb(util.getGenericError("Error", 400 , "Email already registered"));
                    return;
                }
                util.cryptPassword("teacher123" , function(err , hashPassword){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    data.password = hashPassword;
                    data.isFirst = true;
                    schoolInstance.teachers.create(data , function(err, newTeacherInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        util.updateUserAccessToken(AccessTokenx,null , schoolInstance.id, required.scope, function(err, accessToken){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            data.accessToken = accessToken;
                            var html = "<h1>Congrats !!! "+ data.name + " is registered.<br/>Email : " +
                            data.email + "<br/>Password : teacher123</h1>";
                            util.sendEmail(data.email, "Success",  html, constant.FROM_NO_REPLY);
                            util.sendSMS(data.mobile, constant.SCHOOL_REG_SMS.replace("SCHOOLNAME", data.name));
                            var response = {};
                            response.data = data;
                            response.status = 200;
                            response.message = 'Teacher is successfully registered';
                            cb(null, response);
                        });
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'addTeacher',
        {
            description: "Add new Teacher",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addTeacher', verb: 'post'}
        }
    );



    School.addStudent = function(required, data , cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Student = School.app.models.Student;
        var currentTime = new Date();
        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.email || !validate.isEmail(data.email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }
        if(!data.studentName || !validator.isLength(data.studentName, {min:2, max: 100})){
            cb(util.getGenericError("Error", 400, "Invalid Student Name"));
            return;
        }
        if(data.mobile && !validator.isNumeric(data.mobile) && !validator.isLength(data.mobile, {min:10, max: 10})){
            cb(util.getGenericError("Error", 400, "Invalid Phone number"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}],
            where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Student.findOne({where : {email : data.email}}, function(err, studentInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(studentInstance){
                    cb(util.getGenericError("Error", 400 , "Email already registered"));
                    return;
                }
                util.cryptPassword("student123" , function(err , hashPassword){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    data.password = hashPassword;
                    data.isFirst = true;
                    schoolInstance.students.create(data , function(err, newStudentInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        util.updateUserAccessToken(AccessTokenx,null , schoolInstance.id, required.scope, function(err, accessToken){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            data.accessToken = accessToken;
                            var html = "<h1>Congrats !!! "+ data.studentName + " is registered.<br/>Email : " +
                            data.email + "<br/>Password : student123</h1>";
                            util.sendEmail(data.email, "Success",  html, constant.FROM_NO_REPLY);
                            util.sendSMS(data.mobile, constant.SCHOOL_REG_SMS.replace("SCHOOLNAME", data.studentName));
                            var response = {};
                            response.data = data;
                            response.status = 200;
                            response.message = 'Student is successfully registered';
                            cb(null, response);
                        });
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'addStudent',
        {
            description: "Add new Student",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addStudent', verb: 'post'}
        }
    );

    School.addStaff = function(required, data , cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Staff = School.app.models.Staff;
        var currentTime = new Date();
        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.staffName || !validator.isLength(data.staffName, {min:2, max: 100})){
            cb(util.getGenericError("Error", 400, "Invalid Staff Name"));
            return;
        }
        if(data.mobile && !validator.isNumeric(data.mobile) && !validator.isLength(data.mobile, {min:10, max: 10})){
            cb(util.getGenericError("Error", 400, "Invalid Phone number"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}],
            where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            util.cryptPassword("staff123" , function(err , hashPassword){
              if(err){
                cb(util.getInternalServerError(err));
                return;
              }
              data.password = hashPassword;
              data.isFirst = true;
              schoolInstance.staffs.create(data , function(err, newStaffInstance){
                if(err){
                  cb(util.getInternalServerError(err));
                  return;
                }
                util.updateUserAccessToken(AccessTokenx,null , schoolInstance.id, required.scope, function(err, accessToken){
                  if(err){
                    cb(util.getInternalServerError(err));
                    return;
                  }
                  data.accessToken = accessToken;
                  if (data.email){
                      var html = "<h1>Congrats !!! "+ data.staffName + " is registered.<br/>Email : " +
                      data.email + "<br/>Password : student123</h1>";
                      util.sendEmail(data.email, "Success",  html, constant.FROM_NO_REPLY);
                  }
                  if(data.mobile){
                    util.sendSMS(data.mobile, constant.SCHOOL_REG_SMS.replace("SCHOOLNAME", data.staffName));
                  }
                  var response = {};
                  response.data = data;
                  response.status = 200;
                  response.message = 'Staff is successfully registered';
                  cb(null, response);
                });
              });
            });
          });
        };

    School.remoteMethod(
        'addStaff',
        {
            description: "Add new Staff",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addStaff', verb: 'post'}
        }
    );



    School.updateProfile = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();
        var updatedata = {};

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }

        School.findOne({where : {"id" : required.id}}, function(err, searchedSchoolInstance){
            if(err){
                cb(utils.getInternalServerError(err));
                return;
            }
            if(!updatedata){
                cb(util.getGenericError("Error", 400, "ID is invalid"));
                return;
            }


            if(searchedSchoolInstance.name)
                updatedata.name = searchedSchoolInstance.name;
            if(searchedSchoolInstance.mobile)
                updatedata.mobile = searchedSchoolInstance.mobile;
            if(searchedSchoolInstance.address)
                updatedata.address = searchedSchoolInstance.address;
            if(searchedSchoolInstance.gender)
                updatedata.gender = searchedSchoolInstance.gender;
            if(searchedSchoolInstance.video)
                updatedata.video = searchedSchoolInstance.video;
            if(searchedSchoolInstance.image)
                updatedata.image = searchedSchoolInstance.image;



            if(data.name){
                if(!validate.isName(data.name)){
                    cb(util.getGenericError("Error",400,"Name is invalid"));
                    return;
                }
                updatedata.name = data.name;
            }
            if(data.mobile){
                if(!validate.isMobile(data.mobile)){
                    cb(util.getGenericError("Error",400,"Mobile is invalid"));
                    return;
                }
                updatedata.mobile = data.mobile;
            }
            if(data.gender){
                updatedata.gender = data.gender;
            }
            if(data.video){
                updatedata.video = data.video;
            }
            if(data.image){
                updatedata.image = data.image;
            }

            if(data.address){
                if(!updatedata.address)
                    updatedata.address = {};
                if(data.address.state){
                    if(!validate.isState(data.address.state)){
                        cb(util.getGenericError("Error", 400, "State is invalid"));
                        return;
                    }
                    updatedata.address.state = data.address.state;
                }
                if(data.address.city){
                    if(!validate.isCity(data.address.city)){
                        cb(util.getGenericError("Error", 400, "City is invalid"));
                        return;
                    }
                    updatedata.address.city = data.address.city;
                }
                if(data.address.street){
                    if(!validate.isStreet(data.address.street)){
                        cb(util.getGenericError("Error", 400, "Street is invalid"));
                        return;
                    }
                    updatedata.address.street = data.address.street;
                }
                if(data.address.pincode){
                    if(!validate.isPincode(data.address.pincode)){
                        cb(util.getGenericError("Error", 400, "Pincode is invalid"));
                        return;
                    }
                    updatedata.address.pincode = data.address.pincode;
                }
            }
            School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!schoolInstance){
                    cb(util.getGenericError("Error", 401,"Not authenticated"));
                    return;
                }
                if(!schoolInstance.accessTokenxs()[0]){
                    cb(util.getGenericError("Error", 401,"Not authenticated"));
                    return;
                }
                if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                    cb(util.getGenericError("Error", 401,"Not authenticated"));
                    return;
                }
                if(data.schoolName){
                    School.findOne({where : {schoolName : data.schoolName}}, function(err, searchedSchoolInstance){
                        if(err){
                            cb(utils.getInternalServerError(err));
                            return;
                        }
                        if(searchedSchoolInstance){
                            if(searchedSchoolInstance.id != required.id){
                                cb(util.getGenericError("Error", 401,"Sorry !!! This school name is already taken."));
                                return;
                            }
                        }

                        updatedata.schoolName = data.schoolName;

                        School.updateAll({id: required.id}, updatedata, function(err, count){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        School.findOne({where: {email: data.email}}, function(err, schoolUpdatedInstance){                                if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                              util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                                if(err){
                                    cb(util.getInternalServerError(err));
                                    return;
                                }
                                var response = {};
                                response.data = schoolUpdatedInstance;
                                response.accessToken = accessToken;
                                response.message = "Profile Updated successfully";
                                cb(null, response);
                            });
                            });
                        });
                    });
                }else{
                    School.updateAll({id: required.id}, updatedata, function(err, count){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        School.findOne({where: {email: data.email}}, function(err, schoolUpdatedInstance){                                if(err){
                               cb(util.getInternalServerError(err));
                                return;
                            }
                                util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                                if(err){
                                    cb(util.getInternalServerError(err));
                                    return;
                                }
                                var response = {};
                                response.data = schoolUpdatedInstance;
                                response.accessToken = accessToken;
                                response.message = "Profile Updated successfully";
                                cb(null, response);
                            });
                        });
                    });
                }
            });
        });
    };

    School.remoteMethod(
        'updateProfile',
        {
            description: "Updates the profile of school",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateProfile', verb: 'post'}
        }
    );

    School.changePassword = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();
        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.oldPassword){
            cb(util.getGenericError("Error", 400, "Enter old password"));
            return;
        }
        if(!data.newPassword){
            cb(util.getGenericError("Error", 400, "Enter new password"));
            return;
        }
        if(!validate.isPassword(data.newPassword)){
            cb(util.getGenericError("Error", 400, "Invalid new password"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}],
            where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            util.comparePassword(data.oldPassword, schoolInstance.password, function(err, isMatched){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!isMatched){
                    cb(util.getGenericError("Error", 400, "Incorrect old password"));
                    return;
                }
                util.cryptPassword(data.newPassword , function(err , hashPassword){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var passwordData = {};
                    passwordData.password = hashPassword;
                    School.updateAll({id: required.id}, passwordData, function(err, count){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            var response = {};
                            response.accessToken = accessToken;
                            response.message = "Password Updated successfully";
                            cb(null, response);
                        });
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'changePassword',
        {
            description: "Change Password of school",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/changePassword', verb: 'post'}
        }
    );


    School.deleteTeacher = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Teacher = School.app.models.Teacher;
        var currentTime = new Date();
        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.teacherId){
            cb(util.getGenericError("Error", 400, "Error no teacher ID"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Teacher.findOne({where :{id : data.teacherId}}, function(err, teacherInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!teacherInstance){
                    cb(util.getGenericError("Error", 401,"Invalid Teacher ID"));
                    return;
                }
                Teacher.destroyById(teacherInstance.id, function(err){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Teacher Deleted successfully";
                        cb(null, response);
                    });
                });
            });
        });
    }

    School.remoteMethod(
        'deleteTeacher',
        {
            description: "Delete a teacher",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/deleteTeacher', verb: 'post'}
        }
    );


    School.deleteStudent = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Student = School.app.models.Student;
        var currentTime = new Date();
        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.studentId){
            cb(util.getGenericError("Error", 400, "Error no student ID"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Student.findOne({where :{id : data.studentId}}, function(err, studentInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!studentInstance){
                    cb(util.getGenericError("Error", 401,"Invalid Student ID"));
                    return;
                }
                Student.destroyById(studentInstance.id, function(err){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Student Deleted successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'deleteStudent',
        {
            description: "Delete a student",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/deleteStudent', verb: 'post'}
        }
    );


    School.deleteStaff = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Staff = School.app.models.Staff;
        var currentTime = new Date();

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.id){
            cb(util.getGenericError("Error", 400, "Error no staff ID"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Staff.findOne({where :{id : data.id}}, function(err, staffInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!staffInstance){
                    cb(util.getGenericError("Error", 401,"Invalid Staff ID"));
                    return;
                }
                Staff.destroyById(staffInstance.id, function(err){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Staff Deleted successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'deleteStaff',
        {
            description: "Delete a staff",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/deleteStaff', verb: 'post'}
        }
    );



    School.getTeachers = function(query, cb){
        var Teacher = School.app.models.Teacher;
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();
        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }

        if(!query.limit || typeof query.limit != "number" || query.limit <= 0){
            cb(util.getGenericError("Invalid Limit", 400, "Error"));
            return;
        }
        if(typeof query.skip != "number" || query.skip < 0){
            cb(util.getGenericError("Invalid skip", 400, "Error"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}],
            where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }


            Teacher.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, teachers){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!teachers){
                    cb(util.getGenericError("Error", 400, "Teachers not found"));
                    return;
                }
                util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
                    response.teachers = teachers;
                    response.count = teachers.length;
                    var data = {};
                    data.accessToken = accessToken;
                    response.data = data;
                    cb(null, response);
                });
            });
        });
    };
    School.remoteMethod(
        'getTeachers',
        {
            description: "Get list of teachers of a school",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getTeachers', verb: 'get'}
        }
    );


    School.getStudents = function(query, cb){
        var Student = School.app.models.Student;
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }

        if(!query.limit || typeof query.limit != "number" || query.limit <= 0){
            cb(util.getGenericError("Invalid Limit", 400, "Error"));
            return;
        }
        if(typeof query.skip != "number" || query.skip < 0){
            cb(util.getGenericError("Invalid skip", 400, "Error"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}],
            where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }


            Student.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, students){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!students){
                    cb(util.getGenericError("Error", 400, "Students not found"));
                    return;
                }

                util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
                    response.students = students;
                    response.count = students.length;
                    var data = {};
                    data.accessToken = accessToken;
                    response.data = data;
                    cb(null, response);
                });
            });
        });
    };
    School.remoteMethod(
        'getStudents',
        {
            description: "Get list of students of a school",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getStudents', verb: 'get'}
        }
    );

    School.getStaff = function(query, cb){
        var Staff = School.app.models.Staff;
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }

        if(!query.limit || typeof query.limit != "number" || query.limit <= 0){
            cb(util.getGenericError("Invalid Limit", 400, "Error"));
            return;
        }
        if(typeof query.skip != "number" || query.skip < 0){
            cb(util.getGenericError("Invalid skip", 400, "Error"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}],
            where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }


            Staff.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, staffs){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!staffs){
                    cb(util.getGenericError("Error", 400, "Staffs not found"));
                    return;
                }

                util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
                    response.staffs = staffs;
                    response.count = staffs.length;
                    var data = {};
                    data.accessToken = accessToken;
                    response.data = data;
                    cb(null, response);
                });
            });
        });
    };
    School.remoteMethod(
        'getStaff',
        {
            description: "Get list of staffs of a school",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getStaff', verb: 'get'}
        }
    );



    School.sendSmsAlert = function(query , cb){
        var Student = School.app.models.Student;
        var Teacher = School.app.models.Teacher;
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }
        if(!query.message){
            cb(util.getGenericError("Invalid message", 400, "Error"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}],
            where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(query.classId){
                Student.find({fields: {mobile: true}}, {where : {schoolId : query.id, classId : query.classId}}, function(err, students){
                    if(err){
                        cb(util.getGenericError("Error", 401,"Not authenticated"));
                        return;
                    }
                    if(!students){
                      cb(util.getGenericError("Error", 401,"Students not found"));
                      return;
                    }
                    for(var i = 0 ; i < students.length ; i++){
                      console.log(students[i]);
                      util.sendSMS(students[i].mobile, query.message);
                    }
                    util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.status = 200;
                        response.title = "Success";
                        response.accessToken = accessToken;
                        response.message = "Messages has been sent successfully!";
                        cb(null, response);
                        return;
                    });
                });
            }
            else if(query.groupId){

            }
            else if(query.mobile){
                util.sendSMS(query.mobile , query.message);
                var response = {};
                response.status = 200;
                response.message = "Message has been sent successfully";
                cb(null , response);
            }
            else if(query.all && query.all == true){
              Student.find({fields: {mobile: true}}, {where : {schoolId : query.id}}, function(err, students){
                  if(err){
                      cb(util.getGenericError("Error", 401,"Not authenticated"));
                      return;
                  }
                  if(!students){
                    cb(util.getGenericError("Error", 401,"Students not found"));
                    return;
                  }
                  Teacher.find({fields: {mobile: true}}, {where : {schoolId : query.id}}, function(err, teachers){
                      if(err){
                          cb(util.getGenericError("Error", 401,"Not authenticated"));
                          return;
                      }
                      if(!teachers){
                        cb(util.getGenericError("Error", 401,"Teachers not found"));
                        return;
                      }
                      var contacts = students.concat(teachers);
                      for(var i = 0 ; i < contacts.length ; i++){
                        util.sendSMS(contacts[i].mobile, query.message);
                      }
                      util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                          if(err){
                              cb(util.getInternalServerError(err));
                              return;
                          }
                          var response = {};
                          response.status = 200;
                          response.title = "Success";
                          response.accessToken = accessToken;
                          response.message = "Messages has been sent successfully!";
                          cb(null, response);
                          return;
                      });
                  });
              });
            }
            else{
                cb(util.getGenericError("Invalid Receipent", 400, "Error"));
                return;
            }

        });
    };

    School.remoteMethod(
        'sendSmsAlert',
        {
            description: "Send SMS",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/sendSmsAlert', verb: 'get'}
        }
    );


    School.logout = function(query , cb){
        var currentTime = new Date();

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}],
            where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            schoolInstance.accessTokenxs.destroy(query.accessToken, function(err){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                var response = {};
                response.status = 200;
                response.message = 'Logged out successfully';
                response.title = "Logged out";
                cb(null , response);
                return;
            });
        });
    }
    School.remoteMethod(
        'logout',
        {
            description: "Logout School",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/logout', verb: 'get'}
        }
    );


    School.updateTeacher = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Teacher = School.app.models.Teacher;
        var currentTime = new Date();

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.teacherId){
            cb(util.getGenericError("Error",400,"Teacher ID not sent"));
            return;
        }
        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(utils.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                    cb(util.getGenericError("Error", 401,"Not authenticated"));
                    return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Teacher.findOne({where : {id : data.teacherId , schoolId : required.id}}, function(err, teacherInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!teacherInstance){
                    cb(util.getGenericError("Error", 400, "Teacher not found"));
                    return;
                }
                if(data.name){
                    if(!validate.isName(data.name)){
                        cb(util.getGenericError("Error",400,"Teacher name is invalid"));
                        return;
                    }
                    teacherInstance.name = data.name;
                }
                if(data.mobile){
                    if(!validate.isMobile(data.mobile)){
                        cb(util.getGenericError("Error",400,"Teacher mobile is invalid"));
                        return;
                    }
                    teacherInstance.mobile = data.mobile;
                }
                if(data.dob){
                    teacherInstance.dob = data.dob;
                }
                if(data.gender){
                    teacherInstance.gender = data.gender;
                }

                teacherInstance.save(function(err , instance){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        if(instance.email){
                            var html = "<h1>Hello " + instance.name + " , your details has been updated from school admin !!!</h1>";
                            util.sendEmail(instance.email, "Success",  html, constant.FROM_NO_REPLY);
                        }
                        if(instance.mobile){
                            util.sendSMS(instance.mobile, constant.TEACHER_PROFILE_UPDATED.replace("TEACHER_NAME_HERE", instance.name));
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Teacher Details Updated successfully";
                        response.title = "Success";
                        cb(null, response);
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'updateTeacher',
        {
            description: "Update a teacher",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateTeacher', verb: 'post'}
        }
    );

    School.updateStudent = function(required, data, cb){
        var AccessTokenx = School.app.models.AccessTokenx;
        var Student = School.app.models.Student;
        var currentTime = new Date();

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.studentId){
            cb(util.getGenericError("Error",400,"Student ID not sent"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(utils.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                    cb(util.getGenericError("Error", 401,"Not authenticated"));
                    return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Student.findOne({where : {id : data.studentId , schoolId : required.id}}, function(err, studentInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!studentInstance){
                    cb(util.getGenericError("Error", 400, "Student not found"));
                    return;
                }
                if(data.studentName){
                    studentInstance.studentName = data.studentName;
                }
                if(data.fatherName){
                    studentInstance.fatherName = data.fatherName;
                }
                if(data.motherName){
                    studentInstance.motherName = data.motherName;
                }
                if(data.mobile){
                    studentInstance.mobile = data.mobile;
                }
                if(data.gender){
                    studentInstance.gender = data.gender;
                }
                if(data.dob){
                    studentInstance.dob = data.dob;
                }
                if(data.address){
                    if(!studentInstance.address){
                        studentInstance.address = {};
                    }
                    if(data.address.state){
                        if(!validate.isState(data.address.state)){
                            cb(util.getGenericError("Error", 400, "State is invalid"));
                            return;
                        }
                        studentInstance.address.state = data.address.state;
                    }
                    if(data.address.city){
                        if(!validate.isCity(data.address.city)){
                            cb(util.getGenericError("Error", 400, "City is invalid"));
                            return;
                        }
                        studentInstance.address.city = data.address.city;
                    }
                    if(data.address.street){
                        if(!validate.isStreet(data.address.street)){
                            cb(util.getGenericError("Error", 400, "Street is invalid"));
                            return;
                        }
                        studentInstance.address.street = data.address.street;
                    }
                    if(data.address.pincode){
                        if(!validate.isPincode(data.address.pincode)){
                            cb(util.getGenericError("Error", 400, "Pincode is invalid"));
                            return;
                        }
                        studentInstance.address.pincode = data.address.pincode;
                    }
                }

                studentInstance.save(function(err , instance){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    console.log(instance);
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        if(instance.email){
                            var html = "<h1>Hello " + instance.studentName + " , your details has been updated from school admin !!!</h1>";
                            util.sendEmail(instance.email, "Success",  html, constant.FROM_NO_REPLY);
                        }
                        if(instance.mobile){
                            util.sendSMS(instance.mobile, constant.STUDENT_PROFILE_UPDATED.replace("STUDENT_NAME_HERE", instance.studentName));
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Student Details Updated successfully";
                        response.title = "Success";
                        cb(null, response);
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'updateStudent',
        {
            description: "Update a student",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateStudent', verb: 'post'}
        }
    );

    School.updateStaff = function(required, data, cb){
        var Staff = School.app.models.Staff;
        var AccessTokenx = School.app.models.AccessTokenx;
        var currentTime = new Date();

        if(validate.isEmpty(required)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(required)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }
        if(!data.id){
            cb(util.getGenericError("Error",400,"Staff ID not sent"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: required.accessToken}}}], where: {id: required.id}}, function(err, schoolInstance){
            if(err){
                cb(utils.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Staff.findOne({where : {id : data.id , schoolId : required.id}}, function(err, staffInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!staffInstance){
                    cb(util.getGenericError("Error", 400, "Staff not found"));
                    return;
                }
                if(data.staffName){
                    staffInstance.staffName = data.staffName;
                }
                if(data.mobile){
                    staffInstance.mobile = data.mobile;
                }
                if(data.gender){
                    staffInstance.gender = data.gender;
                }
                if(data.dob){
                    staffInstance.dob = data.dob;
                }
                if(data.address){
                    if(!studentInstance.address){
                        staffInstance.address = {};
                    }
                    if(data.address.state){
                        if(!validate.isState(data.address.state)){
                            cb(util.getGenericError("Error", 400, "State is invalid"));
                            return;
                        }
                        staffInstance.address.state = data.address.state;
                    }
                    if(data.address.city){
                        if(!validate.isCity(data.address.city)){
                            cb(util.getGenericError("Error", 400, "City is invalid"));
                            return;
                        }
                        staffInstance.address.city = data.address.city;
                    }
                    if(data.address.street){
                        if(!validate.isStreet(data.address.street)){
                            cb(util.getGenericError("Error", 400, "Street is invalid"));
                            return;
                        }
                        staffInstance.address.street = data.address.street;
                    }
                    if(data.address.pincode){
                        if(!validate.isPincode(data.address.pincode)){
                            cb(util.getGenericError("Error", 400, "Pincode is invalid"));
                            return;
                        }
                        staffInstance.address.pincode = data.address.pincode;
                    }
                }

                staffInstance.save(function(err , instance){
                    if(err){
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        if(instance.email){
                            var html = "<h1>Hello " + instance.staffName + " , your details has been updated from school admin !!!</h1>";
                            util.sendEmail(instance.email, "Success",  html, constant.FROM_NO_REPLY);
                        }
                        if(instance.mobile){
                            util.sendSMS(instance.mobile, constant.STAFF_PROFILE_UPDATED.replace("STAFF_NAME_HERE", instance.staffName));
                        }
                        var response = {};
                        response.accessToken = accessToken;
                        response.message = "Staff Details Updated successfully";
                        response.title = "Success";
                        cb(null, response);
                    });
                });
            });
        });
    };

    School.remoteMethod(
        'updateStaff',
        {
            description: "Update a staff",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateStaff', verb: 'post'}
        }
    );

    School.getSchoolData = function(query, cb){
        console.log(query);
        var AccessTokenx =  School.app.models.AccessTokenx;
        var Student =  School.app.models.Student;
        var Teacher =  School.app.models.Teacher;
        var Event =  School.app.models.Event;
        var ToDoList = School.app.models.ToDoList;
        var validateData = {};
        var currentTime = new Date();
        var response = {};

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Error", 400, "Data not Received"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Error",400,"Data is invalid"));
            return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}], where: {id: query.id}}, function(err, schoolInstance){
            if(err){
                cb(utils.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                cb(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            Student.count({schoolId: schoolInstance.id}, function(err, count) {
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                schoolInstance.studentCount = count;
                Teacher.count({schoolId : schoolInstance.id}, function(err, count){
                    schoolInstance.teacherCount = count;
                    schoolInstance.totalUsers = count + schoolInstance.studentCount;
                    Event.find({where : {schoolId : schoolInstance.id} , limit : 5, skip : 0}, function(err, events){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        response.events = events;
                        ToDoList.find({where : {schoolId : schoolInstance.id} , limit : 5, skip : 0}, function(err, toDoList){
                            if(err){
                                cb(util.getInternalServerError(err));
                                return;
                            }
                            response.toDoList = toDoList;
                            response.schoolInstance = {};
                            response.schoolInstance.schoolName = schoolInstance.schoolName;
                            response.schoolInstance.email = schoolInstance.email;
                            response.schoolInstance.name = schoolInstance.name;
                            response.schoolInstance.id = schoolInstance.id;
                            response.schoolInstance.studentCount = schoolInstance.studentCount;
                            response.schoolInstance.teacherCount = schoolInstance.teacherCount;
                            response.schoolInstance.totalUsers = schoolInstance.totalUsers;
                            response.schoolInstance.visitors = 15;

                            util.updateUserAccessToken(AccessTokenx, null, schoolInstance.id, query.scope, function(err, accessToken){
                                if(err){
                                    cb(util.getInternalServerError(err));
                                    return;
                                }
                                response.schoolInstance.accessToken = accessToken;
                                cb(null, response);
                                return;
                            });
                        });
                    });
                });
            });
        });
    };
    School.remoteMethod(
        'getSchoolData',
        {
            description: "Get data of a School",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getSchoolData', verb: 'get'}
        }
    );

    // School.resetPassword = function(data , cb){
    //     if(validate.isEmpty(data)){
    //         cb(util.getGenericError('Error' , 400 , 'Invalid Data Recieved'));
    //         return;
    //     }
    //
    //     School.findOne({ where : {id : data.id}} , function(err , instance){
    //         if(err){
    //             cb(util.getInternalServerError(err));
    //             return;
    //         }
    //         if(!instance){
    //             cb(util.getGenericError('Error' , 400 , 'Invalid Data'));
    //             return;
    //         }
    //
    //         util.comparePassword(data.oldPassword , instance.password , function(err , isPasswordMatch){
    //             if(err){
    //                 cb(util.getInternalServerError(err));
    //                 return;
    //             }
    //             if(!isPasswordMatch){
    //                 cb(util.getGenericError('Error' , 400 , 'Password did not match'));
    //                 return;
    //             }
    //             util.cryptPassword(data.newPassword , function(err , hashPassword){
    //                 if(err){
    //                     cb(util.getInternalServerError(err));
    //                     return;
    //                 }
    //                 instance.password = hashPassword;
    //                 instance.save(function(err , newInstance){
    //                     if(err){
    //                         cb(util.getInternalServerError(err));
    //                         return;
    //                     }
    //                     var response = {};
    //                     response.status = 200;
    //                     response.message = 'Password changed successfully';
    //                     cb(null, response);
    //                     return;
    //                 });
    //
    //             });
    //         });
    //     });
    //
    // }
    // School.remoteMethod(
    //     'resetPassword',
    //     {
    //         description: "reset password",
    //         accepts: {arg: 'req', type: 'object', http: {source: 'req'}},
    //         returns: {arg:'res',type:'object', http: {source: 'res'}},
    //         http: {path: '/resetPassword', verb: 'post'}
    //     }
    // );
};
