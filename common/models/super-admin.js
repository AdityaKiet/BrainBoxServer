module.exports = function(SuperAdmin) {

  SuperAdmin.upload = function(data , cb){
    console.log(data);

  };

  SuperAdmin.remoteMethod(
  'upload',
  {
    description: "Upload Pdfs",
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}},
    returns: {arg:'response',type:'object'},
          http: {path: '/upload', verb: 'post'}
  }
);

}
