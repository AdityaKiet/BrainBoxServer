function getCookieValueByRegEx(a, b){
        b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
        return b ? b.pop() : '';
    }

new Vue({
    el: "#dashboard",
    data: {
        school: {},
        token: "",
        id: "",
        events:{}
    },
    methods: {
        getCredentials:  function(){
            this.token = (getCookieValueByRegEx('_sid'));
            this.id = (getCookieValueByRegEx('_id'));
        },
        getSchool: function(){
            this.$http({url: '/api/Schools/getSchoolData', data: {query:JSON.stringify({id:this.id, accessToken:this.token, scope:"web"})}, method: 'GET'}).then(function(response){
                console.log(response);
                this.school = response.data.response.schoolInstance;
                return;
            }, function(error){
                window.location.href= "/school/login.html";
                return;
            });
        }
    },
    ready: function(){
        this.getCredentials();
        this.getSchool();
    }
});
