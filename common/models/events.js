var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(Event) {

	Event.addEvent = function(required, data, cb){
        var AccessTokenx = Event.app.models.AccessTokenx;
        var currentTime = new Date();  
        var School = Event.app.models.School;

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
        if(!data.name){
        	cb(util.getGenericError("Error",400,"Event name not sent"));
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
            schoolInstance.events.create(data, function(err , newInstance){
            	if(err){
	                cb(util.getInternalServerError(err));
	                return;
	            }
	            if(!newInstance){
	            	cb(util.getGenericError("Error", 401,"Event not added successfully !!"));
                	return;
	            }
	            var response = {};
                response.title = "Success";
                response.status = 200;
                response.message = 'Event is added successfully';
                cb(null, response);
                return;
            });
        });
    };

    Event.remoteMethod(
        'addEvent',
        {
            description: "Add new event",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addEvent', verb: 'post'}
        }
    );

    Event.updateEvent= function(required, data, cb){
        var AccessTokenx = Event.app.models.AccessTokenx;
        var currentTime = new Date();  
        var School = Event.app.models.School;

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
        	cb(util.getGenericError("Error",400,"Event id is invalid"));
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
            Event.findOne({where : {id : data.id , schoolId : required.id}}, function(err, eventInstance){
            	if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!eventInstance){
                	cb(util.getGenericError("Error", 401,"No such event found"));
                	return;
                }
                if(data.name)
                	eventInstance.name = data.name;
                if(data.description)
                	eventInstance.description = data.description;
                if(data.date)
                	eventInstance.date = data.date;
           
                eventInstance.save(function(err , instance){
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
                        response.message = "Event Details Updated successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    Event.remoteMethod(
        'updateEvent',
        {
            description: "update an event",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateEvent', verb: 'post'}
        }
    );

    Event.getEvent = function(query, cb){
		var School = Event.app.models.School;
		var AccessTokenx = Event.app.models.AccessTokenx;
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


            Event.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, items){
            	if(err){
					cb(util.getInternalServerError(err));
					return;
				}
				if(!items){
					cb(util.getGenericError("Error", 400, "Events not found"));
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
	Event.remoteMethod(
		'getEvent',
		{
			description: "Get list of events of a school",
			accepts: {arg: 'query', type: 'object', required: true},
			returns: {arg:'response',type:'object'},
			http: {path: '/getEvent', verb: 'get'}         
		}	
	);
};
