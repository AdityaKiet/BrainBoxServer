new Vue({
    el: "#login",
    data: {
        data:{
            email:"",
            password: ""
        }
    },
    methods: {
        login: function(){
            this.$http({url: '/api/Schools/login', data: this.data, method: 'POST'}).then(function(response){
                var ct = new Date();
                document.cookie = '_sid='+response.data.response.data.secret.id+'; expires=0; path=/';
                document.cookie = '_id='+response.data.response.data.teacher.id+'; expires='+new Date(ct.getTime()+31104000000)+'; path=/';
                if(response.data.response.data.isFirst){
                    document.cookie = '_isf='+response.data.response.data.isFirst+'; expires=0; path=/'
                }
                window.location.href="/teacher";
                return;
            }, function(error){
                $.noty.closeAll();
                noty({text: error.data.error.message, layout: 'topCenter', type: 'error'});
                return;
            });
        }
    }
});
