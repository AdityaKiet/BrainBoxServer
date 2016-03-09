var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(Class) {


	// Hook method before Creation of Class


    Class.addClass = function(required, data, cb){
        var AccessTokenx = Class.app.models.AccessTokenx;
        var Student = Class.app.models.Student;
        var currentTime = new Date();  
        var School = Class.app.models.School;

        console.log(required);
        console.log(data);

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

            if(!data.name){
                cb(util.getGenericError("Error", 401,"Class name not sent"));
                return;
            }

            if(!data.section){
                cb(util.getGenericError("Error", 401,"Section not sent"));
                return;
            }

            Class.findOne({where : {schoolId : required.id , name : data.name , section : data.section}}, function(err, searchedSchoolInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }

                if(searchedSchoolInstance){
                    cb(util.getGenericError("Error", 401,"Class is already registered"));
                    return;
                }
            schoolInstance.classes.create(data , function(err, classInstance){
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
                    var response = {};
                    response.data = data;
                    response.status = 200;
                    response.message = 'Class is successfully registered';
                    cb(null, response);
                    });
                });
            });
        });
    };

    Class.remoteMethod(
        'addClass',
        {
            description: "Add new Class",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addClass', verb: 'post'}
        }
    );





    Class.addStudents = function(required , data , cb){
        var AccessTokenx = Class.app.models.AccessTokenx;
        var Student = Class.app.models.Student;
        var currentTime = new Date();  
        var School = Class.app.models.School;

        console.log(required);
        console.log(data);

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
        if(!data.classId){
            cb(util.getGenericError("Error",400,"Class not sent"));
            return;
        }
        if(!data.studentIds){
            cb(util.getGenericError("Error",400,"Students not sent"));
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

            Class.findOne({where : {id : data.classId}}, function(err, classInstance){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!classInstance){
                    cb(util.getGenericError("Error", 401,"Class not registered"));
                    return;
                }

                var updateData = {};
                updateData.classId = data.classId;

                Student.updateAll({id : {inq : data.studentIds }} , updateData , function(err , count){
                    if(err){
                        cb(util.getGenericError("Error", 401,"Class not registered"));
                        return; 
                    }
                    util.updateUserAccessToken(AccessTokenx, schoolInstance.accessTokenxs()[0].id, required.id, required.scope, function(err, accessToken){
                        if(err){
                            cb(util.getInternalServerError(err));
                            return;
                        }
                        var response = {};
                        response.data = accessToken;
                        response.message = count.count + " students added successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    Class.remoteMethod(
        'addStudents',
        {
            description: "Add students to the Class",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addStudents', verb: 'post'}
        }
    );

    Class.updateClass = function(required, data, cb){
        var AccessTokenx = Class.app.models.AccessTokenx;
        var School = Class.app.models.School;
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
        if(!data.classId){
            cb(util.getGenericError("Error",400,"Class ID not sent"));
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
            Class.findOne({where : {id : data.classId , schoolId : required.id}}, function(err, classInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!classInstance){
                    cb(util.getGenericError("Error", 400, "Class not found"));
                    return;
                }
                if(data.name){
                    classInstance.name = data.name;
                }
                if(data.section){
                    classInstance.section = data.section;
                }
                if(data.classTeacherId){
                    classInstance.classTeacherId = data.classTeacherId;
                }
                if(data.room){
                    classInstance.room = data.room;
                }
                
                classInstance.save(function(err , instance){
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
                        response.message = "Class Details Updated successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    Class.remoteMethod(
        'updateClass',
        {
            description: "Update existing class",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateClass', verb: 'post'}
        }
    );

    Class.getStudents = function(query, cb){
        var School = Class.app.models.School;
        var Student = Class.app.models.Student;
        var AccessTokenx = Class.app.models.AccessTokenx;
        var currentTime = new Date();

        if(validate.isEmpty(query)){
            cb(util.getGenericError("Invalid data", 400, "Error"));
            return;
        }
        if(!validate.isValidRequired(query)){
            cb(util.getGenericError("Invalid required data", 400, "Error"));
            return;
        }

        if(!query.classId){
            cb(util.getGenericError("Invalid class ID", 400, "Error"));
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


            Student.find({where : {schoolId : query.id, classId : query.classId} , limit : query.limit, skip : query.skip}, function(err, students){
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
    Class.remoteMethod(
        'getStudents',
        {
            description: "Get list of students of a class",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getStudents', verb: 'get'}         
        }   
    );

    Class.getClasses = function(query, cb){
        var School = Class.app.models.School;
        var Student = Class.app.models.Student;
        var AccessTokenx = Class.app.models.AccessTokenx;
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


            Class.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, classes){
                if(err){
                    cb(util.getInternalServerError(err));
                    return;
                }
                if(!classes){
                    cb(util.getGenericError("Error", 400, "Classes not found"));
                    return;
                }

                util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                    if(err){    
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
                    response.classes = classes;
                    response.count = classes.length;
                    var data = {};
                    data.accessToken = accessToken;
                    response.data = data;
                    cb(null, response);
                });
            });
        });
    };
    Class.remoteMethod(
        'getClasses',
        {
            description: "Get list of classes of a schoo;",
            accepts: {arg: 'query', type: 'object', required: true},
            returns: {arg:'response',type:'object'},
            http: {path: '/getClasses', verb: 'get'}         
        }   
    );


	/*Class.beforeRemote("create", function(ctx, unused, next){
		var currentTime = new Date();
		var AccessTokenx = Class.app.models.AccessTokenx;
        var School = Class.app.models.School;
        var query = ctx.req.query;
        var request = ctx.req;
        var validateData = {};

        if(!query){
        	next(util.getGenericError("Error", 400 , "Data not recieved"));
        	return;
        }
        if(!query.id){
        	next(util.getGenericError("Error", 400 , "Id not recieved"));
        	return;
        }
        if(!query.accessToken){
        	next(util.getGenericError("Error", 400 , "Access Token not recieved"));
        	return;
        }
        if(!query.scope){
        	next(util.getGenericError("Error", 400 , "Scope not recieved"));
        	return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}], where: {id: query.id}}, function(err, schoolInstance){
        	if(err){
                next(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            if(!request.param('name')){
            	next(util.getGenericError("Error", 401,"Class name not sent"));
                return;
            }
            validateData.name = request.param('name');

			if(!request.param('section')){
            	next(util.getGenericError("Error", 401,"Section not sent"));
                return;
            }
            validateData.section = request.param('section');

			Class.findOne({where : validateData}, function(err, classInstance){
				if(err){
					next(util.getInternalServerError(err));
                	return;
				}
				if(classInstance){
					next(util.getGenericError("Error", 401,"This class already exists"));
                	return;
				}
				next();
			});
        });
    });

	
	// Hook method after creation of class
	Class.afterRemote("create", function(ctx, unused, next){
		var AccessTokenx = Class.app.models.AccessTokenx;
		var query = ctx.req.query;
		util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
	        if(err){    
	            next(util.getInternalServerError(err));
	            return;
	        }

	        var data = {};
	        data.accessToken = accessToken;
	        var response = {};
	        response.data = data;
	        response.status = 200;
	        response.message = 'Class is successfully registered';
	        ctx.result = {"response" :response};
	        next();
	    });
    });


    Class.beforeRemote('*', function(ctx, unused, next) {
        var req = ctx.req.headers;
        console.log(req);
        next();
    });
*/


/*
	// Hook method before deletion
	Class.observe("before delete", function(ctx, next){
		var currentTime = new Date();
		var AccessTokenx = Class.app.models.AccessTokenx;
        var School = Class.app.models.School;
        console.log(ctx);

        var query = ctx.req.query;
        var request = ctx.req;
        var validateData = {};

       // var required = query.required;

        if(!query){
        	next(util.getGenericError("Error", 400 , "Data not recieved"));
        	return;
        }
        if(!query.id){
        	next(util.getGenericError("Error", 400 , "Id not recieved"));
        	return;
        }
        if(!query.accessToken){
        	next(util.getGenericError("Error", 400 , "Access Token not recieved"));
        	return;
        }
        if(!query.scope){
        	next(util.getGenericError("Error", 400 , "Scope not recieved"));
        	return;
        }

        School.findOne({include: [{relation: 'accessTokenxs', scope: {where: {id: query.accessToken}}}], where: {id: query.id}}, function(err, schoolInstance){
        	if(err){
                next(util.getInternalServerError(err));
                return;
            }
            if(!schoolInstance){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!schoolInstance.accessTokenxs()[0]){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }
            if(!currentTime > schoolInstance.accessTokenxs()[0].expiry){
                next(util.getGenericError("Error", 401,"Not authenticated"));
                return;
            }

            if(!request.param('id')){
            	next(util.getGenericError("Error", 401,"Class Id not sent"));
                return;
            }
            validateData.id = request.param('id');

			Class.findOne({where : validateData}, function(err, classInstance){
				if(err){
					next(util.getInternalServerError(err));
                	return;
				}
				if(!classInstance){
					next(util.getGenericError("Error", 401,"This class doesn't exist"));
                	return;
				}
				next();
			});
        });
    });

	// Hook method after deletion of class
	Class.observe("after delete", function(ctx, next){
		console.log("delete");
		var AccessTokenx = Class.app.models.AccessTokenx;
		var query = ctx.req.query;
		util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
	        if(err){    
	            next(util.getInternalServerError(err));
	            return;
	        }

	        var data = {};
	        data.accessToken = accessToken;
	        var response = {};
	        response.data = data;
	        response.status = 200;
	        response.message = 'Class is successfully deleted';
	        ctx.result = {"response" :response};
	        next();
	    });
    });
*/

};
