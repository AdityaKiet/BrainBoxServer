new Vue({
    el: "#login",
    data: {
        data:{
            email:"",
            password: "",
            scope: "web"
        }
    },
    methods: {
        login: function(){
            this.$http({url: '/api/Schools/login', data: this.data, method: 'POST'}).then(function(response){
                console.log(response);
                var ct = new Date();
                document.cookie = '_sid='+response.data.response.schoolInstance.accessToken+'; expires=0; path=/';
                document.cookie = '_id='+response.data.response.schoolInstance.id+'; expires='+new Date(ct.getTime()+31104000000)+'; path=/';
                window.location.href="/school";
                return;
            }, function(error){
                $.noty.closeAll();
                noty({text: error.data.error.message, layout: 'topCenter', type: 'error'});
                return;
            });
        }
    }
});
