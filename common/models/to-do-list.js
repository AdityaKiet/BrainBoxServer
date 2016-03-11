var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(ToDoList) {

ToDoList.addToDoList = function(required, data, cb){
        var AccessTokenx = ToDoList.app.models.AccessTokenx;
        var Student = ToDoList.app.models.Student;
        var currentTime = new Date();  
        var School = ToDoList.app.models.School;


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

        if(!data.title){
            cb(util.getGenericError("Error", 401,"Title of task not sent"));
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

            schoolInstance.toDoLists.create(data , function(err, toDoListInstance){
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
                    response.message = 'Task is successfully added';
                    cb(null, response);
                });
            });
        });
    };

    ToDoList.remoteMethod(
        'addToDoList',
        {
            description: "Add new task to ToDoList",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addToDoList', verb: 'post'}
        }
    );


    ToDoList.getToDoList = function(query, cb){
		var School = ToDoList.app.models.School;
		var AccessTokenx = ToDoList.app.models.AccessTokenx;
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


            ToDoList.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, items){
            	if(err){
					cb(util.getInternalServerError(err));
					return;
				}
				if(!items){
					cb(util.getGenericError("Error", 400, "Items not found"));
                	return;
				}
				util.updateUserAccessToken(AccessTokenx,null , query.id, query.scope, function(err, accessToken){
                    if(err){    
                        cb(util.getInternalServerError(err));
                        return;
                    }
                    var response = {};
					response.items = items;
					response.count = items.length;
					var data = {};
					data.accessToken = accessToken;
					response.data = data;
					cb(null, response);
                });
            });
        });
	};
	ToDoList.remoteMethod(
		'getToDoList',
		{
			description: "Get list of to do items of a school",
			accepts: {arg: 'query', type: 'object', required: true},
			returns: {arg:'response',type:'object'},
			http: {path: '/getToDoList', verb: 'get'}         
		}	
	);


    ToDoList.updateToDoList = function(required, data, cb){
        var AccessTokenx = ToDoList.app.models.AccessTokenx;
        var Student = ToDoList.app.models.Student;
        var currentTime = new Date();  
        var School = ToDoList.app.models.School;


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

            if(!data.id){
                cb(util.getGenericError("Error", 401,"ID of task not sent"));
                return;
            }

           ToDoList.findOne({where : {id : data.id , schoolId : required.id}}, function(err, toDoListInstance){
                if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!toDoListInstance){
                    cb(util.getGenericError("Error", 400, "Task not found"));
                    return;
                }
                if(data.title){
                    toDoListInstance.title = data.title;
                }
                if(data.date){
                    toDoListInstance.date = data.date;
                }
                if(data.status){
                    toDoListInstance.status = data.status;
                }
                if(data.description){
                    toDoListInstance.description = data.description;
                }
                
                toDoListInstance.save(function(err , instance){
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
                        response.message = "Task Details Updated successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    ToDoList.remoteMethod(
        'updateToDoList',
        {
            description: "Update task of ToDoList",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateToDoList', verb: 'post'}
        }
    );
};
