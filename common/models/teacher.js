var validator = require('validator');
var uuid = require('uuid');
var validate = require('../utils/validate');
var util = require('../utils/util');
var constant = require('../utils/constant');




module.exports = function(Teacher) {
    util.disableAllMethodsBut(Teacher);

    Teacher.beforeRemote('**', function(ctx, unused, next){
        var currentTime = new Date();
        var remoteUrl = ctx.req.originalUrl;
        if(remoteUrl.indexOf('login') > 1 || remoteUrl.indexOf('getResetLink') > 1){
            next();
            return;
        }
        var currentTime = new Date();
        var authData = ctx.req.query;
        if(authData && authData.secret && authData.id){
            Teacher.findOne({where: {id: authData.id}}, function(err, teacherInstance){
                if(err){
                    next(util.getInternalServerError(err));
                    return;
                }
                if(teacherInstance && teacherInstance.secrets){
                    teacherInstance.secrets.findById(authData.secret, function(err, secretInstance){
                        if(err){
                            next(util.getInternalServerError(err));
                            return;
                        }
                        if(secretInstance && secretInstance.ttl > currentTime){
                            secretInstance.ttl = util.addTime(currentTime, constant.SECRET_TTL);
                            secretInstance.save();
                            next();
                        }else{
                            ctx.res.header("Authorization", "Required");
                            next(util.getGenericError("Error", 403, "Authorization Required"));
                        }
                    });
                }else{
                    ctx.res.header("Authorization", "Required");
                    next(util.getGenericError("Error", 403, "Invalid Authorization"));
                }

            });
        }else{
            ctx.res.header("Authorization", "Required");
            next(util.getGenericError("Error", 403, "Authorization Required"));
        }
    });

    Teacher.login = function(data, cb){
        var currentTime = new Date();
        var email = '';
        var password = '';
        if(validate.isEmpty(data)){
            cb(util.getGenericError("Error", 400, "Invalid Data Received"));
            return;
        }
        if(!data.email || !validate.isEmail(data.email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }
        email = data.email;

        if(!data.password || !validate.isStreet(data.password)){
            cb(util.getGenericError("Error", 400, "Invalid Password"));
            return;
        }
        password = data.password;

        Teacher.findOne({where: {email: email}}, function(err, teacherInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!teacherInstance){
                cb(util.getGenericError('Error', 400, 'Email is not registered'));
                return;
            }
            if(!teacherInstance.isActivated){
                cb(util.getGenericError('Error', 400, 'Your account is not activated'));
                return;
            }

            util.comparePassword(teacherInstance.password, password, function(err, isMatched){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                isMatched = true;
                if(!isMatched){
                    cb(util.getGenericError('Error', 400, "Password didn't match"));
                    return;
                }else{
                    var secretData = {};
                    secretData.id = uuid.v1();
                    secretData.ttl = util.addTime(currentTime, constant.SECRET_TTL);
                    secretData.created = currentTime;
                    teacherInstance.secrets.create(secretData, function(err, secretInstance){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.data = {};
                        response.status = 'SUCCESS';
                        response.data.teacher = teacherInstance;
                        if(teacherInstance.isFirst){
                            response.data.isFirst = true;
                        }
                        response.data.secret = secretInstance;
                        cb(null, response);
                        return;
                    });
                }
            });
        });
    };

    Teacher.remoteMethod(
        'login',
        {
            description: "Login Teacher",
            accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
            returns: {arg:'response',type:'object'},
            http: {path: '/login', verb: 'post'}
        }
    );

    Teacher.getTeacher = function(id, cb){

        Teacher.findOne({where: {id: id}}, function(err, teacherInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!teacherInstance){
                cb(util.getGenericError('Error', 400, 'Not Found'));
                return;
            }
            if(!teacherInstance.isActivated){
                cb(util.getGenericError('Error', 400, 'Your account is not activated'));
                return;
            }

            var response = {};
            response.data = {};
            response.status = 'SUCCESS';
            response.data.teacher = teacherInstance;
            cb(null, response);
            return;
        });
    };

    Teacher.remoteMethod(
        'getTeacher',
        {
            description: "Get Teacher Instance",
            accepts: [{arg: 'id', type: 'string'}],
            returns: {arg:'response',type:'object'},
            http: {path: '/getTeacher', verb: 'get'}
        }
    );


    Teacher.getResetLink = function(email, cb){
        var currentTime = new Date();
        if(!email || !validate.isEmail(email)){
            cb(util.getGenericError("Error", 400, "Invalid Email"));
            return;
        }

        Teacher.findOne({where: {email: email}}, function(err, teacherInstance){
            if(err){
                cb(util.getInternalServerError(err));
                return;
            }
            if(!teacherInstance){
                cb(util.getGenericError('Error', 400, 'Email is not registered'));
                return;
            }
            if(!teacherInstance.isActivated){
                cb(util.getGenericError('Error', 400, 'Your account is not activated'));
                return;
            }

            var tokenData = {};
            tokenData.emailToken = uuid.v4();
            tokenData.emailTokenTtl = util.addTime(currentTime, constant.TOKEN_TTL);
            tokenData.emailTokenCreated = currentTime;
            util.sendEmail
            teacherInstance.tokens.add(tokenData, function(err, tokenInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                var response = {};
                response.data = {};
                response.status = 'SUCCESS',
                response.data.teacher = teacherInstance;
                response.data.token = tokenInstance.id;
                cb(null, response);
                return;
            });
        });
    };

    Teacher.remoteMethod(
        'getResetLink',
        {
            description: "Sends Reset link to Teacher's email",
            accepts: {arg: 'data', type: 'object'},
            returns: {arg:'response',type:'object'},
            http: {path: '/getResetLink', verb: 'get'}
        }
    );

};
