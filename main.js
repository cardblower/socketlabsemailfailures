module['exports'] = function myService (hook) {  
 //
 // Set default response
 //
 var vstr = '{"ValidationKey": "'+hook.env.validationKeyfail+'"}';
 var skey = "";
 var checkkey = "Validation";
 //
 // get the body of the call
 //
 var hookbody = hook.params;
 //
 // Check the request type?
 //
 if (hookbody !== undefined) {
	var vtype = hookbody.Type;
	var skey = hookbody.SecretKey;
	//
    // is this a validation request?
	//
    if (vtype !== undefined) {
	  	if (vtype =='Validation' && skey == hook.env.secretKeyfail) {
	        //
		    // yes it is, so respond with the validation key
    		//
 			hook.res.end(vstr);
        } else {
			if (vtype !=="Delivered" && vtype !=="Failed") {
    	      	vtype = "Ignore";
            }
        }
        if (vtype !== "Ignore" && vtype !=="Validation") {
        	//
      		// it's not a validation request, it must be an email delivery/failure report
			//
			if (skey == hook.env.secretKeyfail) {
				//
				var email = JSON.stringify(hookbody);
				var jstr = "";
				var From = hookbody.FromAddress;
              	if (vtype == "Failed") {
					var Subject = "Delivery Failure";
					var msgBody = hookbody.Reason;
                } else {
					var Subject = "Delivered Successfully";
					var msgBody = hookbody.RemoteMta + "  "+hookbody.Response;
                }
                var To = hookbody.Address;
				var MessageId = hookbody.MessageId;
				var Attachments = null;
                var hasAttachment = null;
				//
				//
				// store the details of the email in the email database
				//
				// create the call to Appery to save the email details
				//
				var https = require("https");
				var requestBody = JSON.stringify({ 
					"jsonString": "",
					"To": To,
					"From": From,
					"Subject": Subject,
					"hasAttachment": hasAttachment,
					"MessageId": MessageId,
					"Body": msgBody,
					"Attachments": null
				});
				//
				var options = {
					host: "api.appery.io",
					path: "/rest/1/db/collections/Emails",
					method: "POST",
					headers: {
						'content-type': 'application/json',
						'X-Appery-Database-Id' : hook.env.dbID,
						'X-Appery-Master-Key' : hook.env.ApperyKey
					}
				};
				//
				var saveEmail = https.request(options, function (apperyResponse) {
					var responseString = "";
					apperyResponse.on('data', function (data) {
						responseString += data;
					});
					apperyResponse.on("end", function () {
						hook.res.end("Sent:"+responseString); 
					});
				});
				saveEmail.write(requestBody);
				saveEmail.end();
				//
				//
				// we have successfully saved the email to one drive, so lets respond with the correct key
				//
                var vstr = '{"ValidationKey": "'+hook.env.validationKeyfail+'"}';
				//hook.res.end(vstr);
				//				
			} else {
				hook.res.end("Invalid Msg, secret key incorrect:"+JSON.stringify(hookbody));
			}
		} else {
			if (vtype !=="Validation") {
				hook.res.end("Msg Type not understood");
			}
		}
	} else {
		hook.res.end("Invalid Msg Type");
	}
} else {
	hook.res.end("Invalid Msg, no body");
}
};
