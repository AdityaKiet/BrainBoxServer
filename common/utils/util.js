//contains basic utilities function
var nodemailer = require('nodemailer');
var constant = require('./constant');
var smtpTransport = nodemailer.createTransport(constant.EMAIL_CREDENTIALS);
var crypto = require('crypto');
var uuid = require('uuid');
var bcrypt = require('bcrypt');
var request = require('request');
var Hashids = require("hashids");
var hashId = new Hashids("ainaa007Referral",8);

var mailOptions = {
    from: "No-reply <no-reply>", // sender address
    subject: "Verify your email... (SckulApp)", // Subject line
    html: "<b>click here to verify your email LINK_HERE</b>", // html body
    to: ""
}

module.exports = {

    //returns error
    getGenericError : function(name, statusCode, message){
        var error = new Error(message);
        error.name = name;
        error.statusCode = statusCode;
        return error;
    },

    //returns internal server error
    getInternalServerError : function(err)
	{
		console.log(err);
		var error = new Error('Something went wrong, make a retry !');
		error.statusCode = 500;
		error.name = "Oh Ah";
		return error;
	},

    sendEmail : function(to, subject, body, from){
        mailOptions.html = body;
        mailOptions.to = to;
        mailOptions.subject = subject;
        mailOptions.from = from;
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log("Sending Mail Error "+error);
            }else{
                console.log("Message sent: " + JSON.stringify(response));
            }
        });
    },

    //sends SMS to Mobile
    sendSMS : function(mobile, text)
	{
		var sms_option = constant.SMS_OPTION.replace('MOBILE_HERE', mobile);
		sms_option = sms_option.replace('TEXT_HERE', text);
		request(sms_option, function (error, response, body)
		{
			if (error)
			{
				console.log(error);
			}
		});
	},

    //generate random stringify
    getToken : function(length, cb){
        var len = length || constant.TOKEN_LENGTH;
        crypto.randomBytes(len, function(ex, token) {
                if (ex) cb(ex);
                if (token)  cb(null, token.toString('hex'));
                else cb((new Error('Problem when generating token')));
            });
    },

    //add time
    addTime : function(currentTime, duration)
	{
		return new Date(currentTime.getTime() + duration*60000); // 60000 is for converting minute to sec
	},

    // used for Authentication header
    getAuthData : function(id){
        token = uuid.v1();
        return token;
    },

    /**
	*	This method is for encryption of the given password
	*
	*	@method cryptPassword
	*	@param {password} password field
	*	@param {callback} designated callback function
	*	@return {callback} returns the callback function with proper fields
	*/
	cryptPassword : function (password, callback)
	{
   		bcrypt.genSalt(10, function(err, salt)
   		{
    		if (err)
      		return callback(err);
    		bcrypt.hash(password, salt, function(err, hash)
    		{
      			return callback(err, hash);
    		});
  		});
	},


	/**
	*	This method is for comparing password
	*
	*	@method comparePassword
	*	@param {password} represents the entered password
	*	@param {userPassword} represents the userPassword (??)
	*	@param {callback} designated callback function
	*	@return {callback} returns the callback function with proper fields
	*/
	comparePassword : function (password, userPassword, callback) {
   		bcrypt.compare(password, userPassword, function(err, isPasswordMatch)
   		{
      		if (err)
        		return callback(err);

      		return callback(null, isPasswordMatch);
   		});
	},



    updateUserAccessToken : function(AccessTokenx, id, userId, scope, cb){
        var currentTime = new Date();
        if(id){
            process.nextTick(function(){
                AccessTokenx.findById(id, function(err,accessTokenInstance){
                    if(err){
                        console.log(err);
                        var error = new Error('Something went wrong, make a retry !');
                        error.statusCode = 500;
                        error.name = "Oh Ah";
                        cb(error);
                        return;
                    }
                    if(accessTokenInstance){
                        if(scope == constant.ANDROID_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.ANDROID_ACCESS_TOKEN_TIME*60000);
                        }
                        else if(scope == constant.IOS_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.IOS_ACCESS_TOKEN_TIME*60000);
                        }
                        else if(scope == constant.WEB_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.WEB_ACCESS_TOKEN_TIME*60000);
                        }
                        else{
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.REGISTRATION_ACCESS_TOKEN_TIME*60000);
                        }
                        accessTokenInstance.save(function(err,instance){
                            if(err){
                                console.log(err);
                                var error = new Error('Something went wrong, make a retry !');
                                error.statusCode = 500;
                                error.name = "Oh Ah";
                                cb(error);
                                return;
                            }
                            cb(null, instance.id);
                            return;
                        }); 
                    }
                    else{
                        var accessToken = {};
                        accessToken.id = uuid();
                        accessToken.created = currentTime;
                        accessToken.userId = userId;
                        if(scope == constant.ANDROID_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.ANDROID_ACCESS_TOKEN_TIME*60000);
                        }
                        else if(scope == constant.IOS_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.IOS_ACCESS_TOKEN_TIME*60000);
                        }
                        else if(scope == constant.WEB_SCOPE){
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.WEB_ACCESS_TOKEN_TIME*60000);
                        }
                        else{
                            accessTokenInstance.expiry = new Date(currentTime.getTime() + constant.REGISTRATION_ACCESS_TOKEN_TIME*60000);
                        }
                        AccessTokenx.create(accessToken, function(err,accessTokenInstance){
                            if(err){
                                console.log(err);
                                var error = new Error('Something went wrong, make a retry !');
                                error.statusCode = 500;
                                error.name = "Oh Ah";
                                cb(error);
                                return; 
                            }   

                            cb(null , accessTokenInstance.id);
                            return;
                        });
                    }
                });
            });
        }else{
            process.nextTick(function(){
                var accessToken = {};
                accessToken.id = uuid();
                accessToken.created = currentTime;
                accessToken.userId = userId;
                if(scope === constant.ANDROID_SCOPE)
                    accessToken.expiry = new Date(currentTime.getTime() + constant.WEB_ACCESS_TOKEN_TIME*60000);
                else if(scope === constant.IOS_SCOPE)
                    accessToken.expiry = new Date(currentTime.getTime() + constant.IOS_ACCESS_TOKEN_TIME*60000);
                else if(scope === constant.WEB_SCOPE)
                    accessToken.expiry = new Date(currentTime.getTime() + constant.WEB_ACCESS_TOKEN_TIME*60000);
                else
                    accessToken.expiry = new Date(currentTime.getTime() + constant.REGISTRATION_ACCESS_TOKEN_TIME*60000);
                    AccessTokenx.create(accessToken, function(err,accessTokenInstance){
                    if(err){
                        
                        console.log(err);
                        var error = new Error('Something went wrong, make a retry !');
                        error.statusCode = 500;
                        error.name = "Oh Ah";
                        cb(error);
                        return; 
                    }   
                    cb(null , accessTokenInstance.id);
                    return;
                });
            });
        }
    },


    disableAllMethodsBut: function (model, methodsToExpose)
    {
        if(model && model.sharedClass)
        {
            methodsToExpose = methodsToExpose || [];

            var modelName = model.sharedClass.name;
            var methods = model.sharedClass.methods();
            var relationMethods = [];
            var hiddenMethods = [];

            try
            {
                Object.keys(model.definition.settings.relations).forEach(function(relation)
                {
                    relationMethods.push({ name: '__findById__' + relation, isStatic: false });
                    relationMethods.push({ name: '__destroyById__' + relation, isStatic: false });
                    relationMethods.push({ name: '__updateById__' + relation, isStatic: false });
                    relationMethods.push({ name: '__exists__' + relation, isStatic: false });
                    relationMethods.push({ name: '__link__' + relation, isStatic: false });
                    relationMethods.push({ name: '__get__' + relation, isStatic: false });
                    relationMethods.push({ name: '__create__' + relation, isStatic: false });
                    relationMethods.push({ name: '__update__' + relation, isStatic: false });
                    relationMethods.push({ name: '__destroy__' + relation, isStatic: false });
                    relationMethods.push({ name: '__unlink__' + relation, isStatic: false });
                    relationMethods.push({ name: '__count__' + relation, isStatic: false });
                    relationMethods.push({ name: '__delete__' + relation, isStatic: false });
                });
            } catch(err) {}

            methods.concat(relationMethods).forEach(function(method)
            {
                var methodName = method.name;
                if(methodsToExpose.indexOf(methodName) < 0)
                {
                    hiddenMethods.push(methodName);
                    model.disableRemoteMethod(methodName, method.isStatic);
                }
            });

            if(hiddenMethods.length > 0)
            {
                console.log('\nRemote mehtods hidden for', modelName, ':', hiddenMethods.join(', '), '\n');
            }
        }
    }
}
