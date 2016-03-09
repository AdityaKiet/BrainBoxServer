var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(Teacher) {
	
	Teacher.getTeachers = function(query, cb){
		var School = Teacher.app.models.School;
		var AccessTokenx = Teacher.app.models.AccessTokenx;
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
	Teacher.remoteMethod(
		'getTeachers',
		{
			description: "Get list of teachers of a school",
			accepts: {arg: 'query', type: 'object', required: true},
			returns: {arg:'response',type:'object'},
			http: {path: '/getTeachers', verb: 'get'}         
		}	
	);
};
