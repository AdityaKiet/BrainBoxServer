var util = require('../utils/util');
var validate = require('../utils/validate');

module.exports = function(Student) {


	Student.getStudents = function(query, cb){
		var School = Student.app.models.School;
		var AccessTokenx = Student.app.models.AccessTokenx;
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
	Student.remoteMethod(
		'getStudents',
		{
			description: "Get list of students of a school",
			accepts: {arg: 'query', type: 'object', required: true},
			returns: {arg:'response',type:'object'},
			http: {path: '/getStudents', verb: 'get'}         
		}	
	);
};
