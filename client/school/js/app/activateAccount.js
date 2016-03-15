function getQueryStringValue (key) {
  return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}
new Vue({
    el: '#activateAccount',
    data: {
        password: "",
        confirmPassword: ""
    },
    methods:{
        activateSchool: function(){
            if(this.password !== this.confirmPassword){
                $.noty.closeAll();
                noty({text: "Passowrd didn't match", layout: 'topCenter', type: 'error'});
                return;
            }
            var token = (getQueryStringValue('token'));
            var id = (getQueryStringValue('id'));
            if(!token || !id){
                window.location.href = '/school/login.html';
                return;
            }
            this.$http({url : '/api/Schools/activate_account?token='+token+'&id='+id, data: {password:this.password}, method: "POST"}).then(function(response){
                var ct = new Date();
                document.cookie = '_sid='+response.data.response.data.secret+'; expires=0; path=/';
                document.cookie = '_id='+response.data.response.data.teacher.id+'; expires='+new Date(ct.getTime()+31104000000)+'; path=/';
                window.location.href="/school";
                return;
            }, function(response){
                $.noty.closeAll();
                noty({text: response.data.error.message, layout: 'topCenter', type: 'error'});
                return;
                return;
            });
        }
    }
});
