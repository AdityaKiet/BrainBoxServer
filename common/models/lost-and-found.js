var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(LostAndFound) {
	 LostAndFound.addItem = function(required, data, cb){
        var AccessTokenx = LostAndFound.app.models.AccessTokenx;
        var currentTime = new Date();  
        var School = LostAndFound.app.models.School;

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
        	cb(util.getGenericError("Error",400,"Title not sent"));
            return;
        }
        data.addedTime = currentTime;
        data.schoolId = required.id;
        data.isFound = false;
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
            LostAndFound.create(data, function(err , newInstance){
            	if(err){
	                cb(util.getInternalServerError(err));
	                return;
	            }
	            if(!newInstance){
	            	cb(util.getGenericError("Error", 401,"Item not added successfully !!"));
                	return;
	            }
	            var response = {};
                response.title = "Success";
                response.status = 200;
                response.message = 'Item is added successfully';
                cb(null, response);
                return;
            });
        });
    };

    LostAndFound.remoteMethod(
        'addItem',
        {
            description: "Add new lost item",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/addItem', verb: 'post'}
        }
    );

    LostAndFound.updateItem = function(required, data, cb){
        var AccessTokenx = LostAndFound.app.models.AccessTokenx;
        var currentTime = new Date();  
        var School = LostAndFound.app.models.School;

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
        	cb(util.getGenericError("Error",400,"Item id is invalid"));
            return;
        }
        if(data.isFound && typeof data.isFound != "boolean"){
        	cb(util.getGenericError("Error",400,"isFound is invalid"));
            return;
        }

        //data.isFound = true;

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
            LostAndFound.findOne({where : {id : data.id , schoolId : required.id}}, function(err, lostandfoundInstance){
            	if(err){
                    cb(utils.getInternalServerError(err));
                    return;
                }
                if(!lostandfoundInstance){
                	cb(util.getGenericError("Error", 401,"No such item found"));
                	return;
                }
                if(data.title)
                	lostandfoundInstance.title = data.title;
                if(data.description)
                	lostandfoundInstance.description = data.description;
                if(data.contact)
                	lostandfoundInstance.contact = data.contact;
                if(data.isFound)
                	lostandfoundInstance.isFound = data.isFound;

                lostandfoundInstance.save(function(err , instance){
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
                        response.message = "Item Details Updated successfully";
                        cb(null, response);
                    });
                });
            });
        });
    };

    LostAndFound.remoteMethod(
        'updateItem',
        {
            description: "updateStatus a lost item",
            accepts: [
                        {arg: 'required', type: 'object', required: true},
                        {arg: 'data', type: 'object', required: true}
                    ],
            returns: {arg:'response',type:'object'},
            http: {path: '/updateItem', verb: 'post'}
        }
    );

    LostAndFound.getLostItems = function(query, cb){
		var School = LostAndFound.app.models.School;
		var AccessTokenx = LostAndFound.app.models.AccessTokenx;
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


            LostAndFound.find({where : {schoolId : query.id} , limit : query.limit, skip : query.skip}, function(err, items){
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
	LostAndFound.remoteMethod(
		'getLostItems',
		{
			description: "Get list of lost items of a school",
			accepts: {arg: 'query', type: 'object', required: true},
			returns: {arg:'response',type:'object'},
			http: {path: '/getLostItems', verb: 'get'}         
		}	
	);

};
