/*
    description: constants.js
    		-Defines the constants used at various places

    date created: 31/12/15
    log:-
       Update 1: 01/01/2016          Author: Sarthak
       		latest update: 01/01/2016     Update 1

    Listed Methods:
    	-null
*/
function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define("HOST", 'http://eggwallet:3000/home/');

define("VERIFY_EMAIL_SUBJECT", 'Email verification (BrainBox)');
define("ACTIVATE_SUBJECT", 'Activate account (BrainBox)');
define("FROM_NO_REPLY", 'No-reply <no-reply>');


define("EMAIL_VERIFICATION_TOKEN_LENGTH", 25);
define("EMAIL_VERIFICATION_TOKEN_TIME", 21600);    // 15 DAYS
define("EMAIL_VERIFICATION_TOKEN_LINK", "http://brainboxapp.com/school/verify_email.html?token=TOKEN_HERE&id=ID_HERE");    // 15 DAYS

define("ACCESSTOKEN_TTL", 21600); // 15 days


define("SECRET_TTL", 21600); // 15 days

define("ACTIVATION_TOKEN_LENGTH", 20);
define("ACTIVATION_TOKEN_TIME", 21600);     // 15 DAYS
define("ACTIVATION_TOKEN_LINK", "http://brainboxapp.com/activate.html?token=TOKEN_HERE&id=ID_HERE");    // 15 DAYS

define("EMAIL_CREDENTIALS", 'smtps://egnessegroup%40gmail.com:qwqwqw123@smtp.gmail.com');

define("TOKEN_LENGTH", 20);

define("SCHOOL_REG_SMS", 'Welcome SCHOOLNAME, Thank you for Registration, regards BrainBox');



define('SMS_OPTION', 'http://bhashsms.com/api/sendmsg.php?'+
    'user=9988624772&pass=cb495a8&sender=MLABTI&'+
    'phone=MOBILE_HERE&'+
    'text=TEXT_HERE&'+
    'priority=ndnd&stype=normal');


define("GCM_SERVER_KEY", 'AIzaSyDg0r5UyyC1BxbR7_8iDRMzgsv_zM4iotA');

define("MOBILE_OTP_HIGH", 999999);
define("MOBILE_OTP_LOW", 100001);

define("MOBILE_OTP_LEN", 6);

define("PASSWORD_MIN_LEN", 6);
define("PASSWORD_MAX_LEN", 30);

define("MOBILE_OTP_TIME", 5);
define("NAME_MIN_LEN", 3);
define("NAME_MAX_LEN", 200);

define("ANDROID_ACCESS_TOKEN_TIME", 259200);    // 6 months
define("IOS_ACCESS_TOKEN_TIME", 259200);    // 6 months
define("WEB_ACCESS_TOKEN_TIME", 30);    // 30 minutes
define("REGISTRATION_ACCESS_TOKEN_TIME", 32592000);

define("ANDROID_GCM_KEY_TIME", 259200);    // 6 months
define("IOS_GCM_KEY_TIME", 259200);    // 6 months
define("WEB_GCM_KEY_TIME", 259200);    // 30 minutes

define("ADDRESS_MIN_LEN", 1);
define("ADDRESS_MAX_LEN", 500);

define("MOBILE_LEN", 10);

define("ANDROID_SCOPE", 'android');
define("WEB_SCOPE", 'web');
define("IOS_SCOPE", 'ios');

define("BUYER_REALM", 'buyer');
define("SELLER_REALM", 'seller');

define("MOBILE_OTP_MESSAGE", "Your mobile otp is MOBILE_OTP_HERE");

define("RESEND_MOBILE_OTP_HIT_COUNT", 5);
define("RESEND_MOBILE_OTP_HIT_TIME", 120); // 2 hours

define("DESTROY_ACCESS_TOKEN_TIME",10);         //in minutes

define("TEACHER_PROFILE_UPDATED" , "Hello ! TEACHER_NAME_HERE , your profile has been updated from school admin");

define("STUDENT_PROFILE_UPDATED" , "Hello ! STUDENT_NAME_HERE , your profile has been updated from school admin");
