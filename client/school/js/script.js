'use strict'

$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

$("#submit").on("click", function(){
    var formData = $("form#schoolRegistration").serializeObject();
    if(formData && !formData.serviceTerms){
        noty({text: "Accept terms and conditions", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.schoolName){
        noty({text: "Please enter your school's name", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.name){
        noty({text: "Please enter your name", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.email){
        noty({text: "Please enter your email", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.mobile){
        noty({text: "Please enter your mobile", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.street){
        noty({text: "Please enter your Street address", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.city){
        noty({text: "Please enter your City", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.state){
        noty({text: "Please enter your state", layout: 'topCenter', type: 'error'});
        return false;
    }
    if(formData && !formData.pincode){
        noty({text: "Please enter your Pincode", layout: 'topCenter', type: 'error'});
        return false;
    }
    $.ajax({
        url: 'http://brainboxapp.com/api/Schools/register',
        data: formData,
        error: function(msg) {
            noty({text: (JSON.parse(msg.responseText)["error"]["message"]), layout: 'topCenter', type: 'error'});
        },
        dataType: 'jsonp',
        success: function(data) {
            console.log(data);
            noty({text: "You are successfully Registered, Please Check your Email", layout: 'topCenter', type: 'success'});
        },
        type: 'POST'
    });

    return false;
})
