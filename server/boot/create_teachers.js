
module.exports = function(app) {
  app.dataSources.mongoDS.automigrate('Teacher', function(err) {
    if (err) throw err;
    var t = {};
    t.name = "abhishek";
    t.email = "abhi@abhi.com";
    t.password = "123123";
    t.isActivated = true;
    t.isFirst = true;
    t.schoolId = 'sid';

    app.models.Teacher.create(t, function(err, localesInstance) {
      if (err) throw err;

      console.log('teacher created: \n');
    });
  });
};
