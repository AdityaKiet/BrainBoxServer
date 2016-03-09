// Extends Validator for some validations
var validator = require('validator');
var constants = require("./constant");

    function isScope(scope){ 
       if(scope == constants.ANDROID_SCOPE || constants.WEB_SCOPE || constants.IOS_SCOPE){
         return true;
        }
        return false;
    };

//validation for the mobile
    function isMobile(mobile){
        if(validator.isNumeric(mobile) && validator.isLength(mobile, constants.MOBILE_LEN, constants.MOBILE_LEN))   
            return true;
        return false;
    };

module.exports = {

    //Checks for empty Object
    isEmpty : function(data){
        return !(Object.keys(data).length);
    },

    //validates email
    isEmail : function(email){
        return /\S+@\S+\.\S+/.test(email);
    },

    isMobile : function(mobile){
        if(validator.isNumeric(mobile) && validator.isLength(mobile, constants.MOBILE_LEN, constants.MOBILE_LEN))   
            return true;
        return false;
    },
    //validates street
    isStreet : function(street){
        //return /^\s*\S+(?:\s+\S+){2}/.test(street);
        return true;
    },
    isScope : function(scope){
        if(scope == constants.ANDROID_SCOPE || constants.WEB_SCOPE || constants.IOS_SCOPE)
            return true;
        return false;
    },

    //validates city
    isCity : function(city){
        return /^[a-zA-z] ?([a-zA-z]|[a-zA-z] )*[a-zA-z]$/.test(city);
    },

    //validates state
    isState : function(state){
        return /^[a-zA-z] ?([a-zA-z]|[a-zA-z] )*[a-zA-z]$/.test(state);
    },

    //Validates Password
    isPassword : function(password){
        if(validator.isLength(password, constants.PASSWORD_MIN_LEN, constants.PASSWORD_MAX_LEN))
            return true;
        return false;
    },

    //Validates Name
    isName : function(name){
        if(validator.isLength(name, {min:2, max: 100}))
            return true;
        return false;
    },

    //validates pincode
    isPincode : function(pincode){
        return /(^\d{6}$)/.test(pincode);
    },

    isValidRequired : function(required){
        return (validator.isMongoId(required.id) && isScope(required.scope) 
            && required.accessToken && isMobile(required.mobile));
    },
}
