

new Vue({
    el: '#register',
    data: {
        school: {
            address: {},
        },
        serviceTerms : ""
    },

    methods:{
        registerSchool: function(){
            console.log(this.serviceTerms);
            if(this.serviceTerms){
                this.$http({url : '/api/Schools/register', data: this.school, method: "POST"}).then(function(data){
                        window.location.href = '/school/reg_success.html';
                }, function(response){
                    noty({text: response.data.error.message, layout: 'topCenter', type: 'error'});
                    return;
                });
            }else{
                noty({text: 'Please Accept service terms', layout: 'topCenter', type: 'error'});
                return;
            }
        }
    },
})
