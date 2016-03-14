function getCookieValueByRegEx(a, b){
        b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
        return b ? b.pop() : '';
    }

new Vue({
    el: "#dashboard",
    data: {
        teacher:{

        }
    },
    methods: {
        readCookie: function(){
            this.teacher.id = getCookieValueByRegEx('_id');
            this.teacher.secret = getCookieValueByRegEx('_sid');
        },
        getTeacher: function(){
            this.$http({url: '/api/Teachers/getTeacher?id='+this.teacher.id+'&secret='+this.teacher.secret, data: this.data, method: 'GET'}).then(function(response){
                this.teacher = response.data.response.data.teacher;
                return;
            }, function(error){
                window.location.href = '/teacher/login.html';
                return;
            });
        },
        logout: function(){
            this.$http({url: '/api/Teachers/logout?id='+this.teacher.id+'&secret='+this.teacher.secret, data: this.data, method: 'GET'}).then(function(response){
                window.location.href = '/teacher/login.html';
                return;
            }, function(error){
                window.location.href = '/teacher/login.html';
                return;
            });
        }
    },
    ready: function(){
        this.readCookie();
        this.getTeacher();
    }
});
