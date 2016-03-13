function getQueryStringValue (key) {
  return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}
new Vue({
    el: '#verifyEmail',
    data: {
        response: {
            title: 'Verifying...',
            message: ''
        }
    },
    methods:{
        verifySchool: function(){
            var token = (getQueryStringValue('token'));
            var id = (getQueryStringValue('id'));
            this.$http({url : '/api/Schools/verify_email?token='+token+'&id='+id, data: this.school, method: "GET"}).then(function(response){
                this.response.message = response.data.response.message;
                this.response.title = response.data.response.title;
            }, function(response){
                this.response.message = response.data.error.message;
                this.response.title = response.data.error.name;
                return;
            });
        }
    },
    ready: function(){
        this.verifySchool();
    }
});
