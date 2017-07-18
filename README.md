# trumpet-notifications
A Javascript notification library for the browser. Separate libraries available for Short-Polling &amp; Server Sent Events techniques. (Library for SSE will be uploaded soon)

This library also supports [NotyJS](http://ned.im/noty/) library. It is NOT a requirement, however it can be used if preferred. NotyJS supports [MoJS](http://mojs.io/) animation library for show/hide animations. NotyJS can be used with or without moJS in Trumpet.

## Installation
```
    <script src="./js/vendor/noty.min.js"></script>                           <!-- Optionally Include NotyJS if you wish to use it. NOT a requirement. -->
    <link rel="stylesheet" type="text/css" href="./css/vendor/noty.css" />    <!-- Optionally Include CSS for NotyJS if you wish to use NotyJS -->
    <script src="./js/vendor/mo.min.js"></script>                             <!-- Optionally include mojs animation library if you wish to have fancy show/hide animations for your NotyJS notifications-->
    
    <script src="./js/trumpet-polling-1.0.0.js"></script>                     <!-- Include the TrumpetJS library -->
```

## Short-Polling - Use
```
Trumpet.init(options);
```


### options
```
Trumpet.init(
{
    "serverBaseUrl" : "http://localhost:3000/",
    "notificationsEndpoint" : "api/notifications/getUserNotifications",
    "endpointHeaders" : {
            "user_token" : "adcidhciuwrfhvr58657478r4398fhwechgfcr76w4t973068459tyfcheq"
          },
    "pollIntervalInSecs" : 10,
    "callback" : function(data){
            //do something with data
         },
    "position" : "topRight",
    "useNoty" : true,
    "notySettings" : {
            type: 'success',
            layout: 'topRight',
            theme: 'metroui',
            timeout: 5000,
            progressBar: true,
            closeWith: ['click', 'button'],
            animation: {
                open: 'noty_effects_open',
                close: 'noty_effects_close'
            },
            id: false,
            modal: false
        },
    "responsePayloadStructure" : {
            titleField: 'title',
            messageField: 'message',
            notificationTypeField: 'type',
            timeStampField: 'timestamp'
        }
}
);
```


| Property | Meaning |
| --- | --- |
| serverBaseUrl | String: Server API base URL. Ex: "https://MY-API/" or for relative path: "./" |
| notificationsEndpoint | String: Endpoint to fetch notifications  Ex: "api/notifications/getUserNotifications" |
| endpointHeaders | Object: Header values |
| pollIntervalInSecs | Number: How often to poll the server, in seconds.  |
| callback | Function: If you want to handle the response, pass a callback function |
| position | String : Position of the notifications. Applies only when useNoty is false(default), since Noty has its position set in notySettings. Options: top, topRight, topLeft, bottom, bottomRight, bottomLeft |
| useNoty | Boolean: true/false. If you wish to use NotyJS plugin, set this flag to true |
| notySettings | Object: If using NotyJS, you can customize the settings for Noty. Refer [here](http://ned.im/noty/options.html) for options available |
| responsePayloadStructure | Object: Trumpet needs to understand the response payload from your server for title, message, notificationType, timestamp fields. Also the type field must be one among the supported types : alert, info, warning, success, error. Other types will styll work but will have no colors or styling to it. |



## Server-Sent-Events (SSE) - Use

Coming soon!
