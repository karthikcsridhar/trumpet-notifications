# trumpet-notifications
A Javascript notification library for the browser.This library supports Short-Polling, Server Sent Events & WebSockets techniques.

This library also supports [NotyJS](http://ned.im/noty/) library. It is NOT a requirement, however it can be used if preferred. NotyJS supports [MoJS](http://mojs.io/) animation library for show/hide animations. NotyJS can be used with or without moJS in Trumpet.

## Installation
```
    <script src="./js/vendor/noty.min.js"></script>                           <!-- Optionally Include NotyJS if you wish to use it. NOT a requirement. -->
    <link rel="stylesheet" type="text/css" href="./css/vendor/noty.css" />    <!-- Optionally Include CSS for NotyJS if you wish to use NotyJS -->
    <script src="./js/vendor/mo.min.js"></script>                             <!-- Optionally include mojs animation library if you wish to have fancy show/hide animations for your NotyJS notifications-->
    
    <script src="./js/trumpet-1.0.0.js"></script>                     <!-- Include the TrumpetJS library -->
```

## Use
HTML:
(This is **optional** if you want to display the notifications in a particular location of the page for customization. If this container is not present on the HTML, then the notification will be shown at the top of the page as the first item of the HTML body.

```
<div id="trumpet-container"></div> 
```


JavaScript:
```
Trumpet.init(options);
```


### options
```
let options = {
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
        },
     "apiType" : Trumpet.API_TYPE.SHORT_POLLING
}
);
```

### API response format:
```
{
        "f3a7a413-c267-4d83-9d04-d00f759ffb5c": {
            "title": "Warning!",
            "type": "warning",
            "message": "Application will be down for 2 hours due to maintenance. Save your work.",
            "timestamp": 1412103600000
        },
        "fac0bac8-25e1-4e19-8e82-fa2581bf54d0": {
            "title": "Alert!",
            "type": "alert",
            "message": "This is an alert.",
            "timestamp": 1412103600000
        }
}
```



| Property | Meaning |
| --- | --- |
| serverBaseUrl | String: Server API base URL. Ex: "https://MY-API/" or for relative path: "./" |
| notificationsEndpoint | String: Endpoint to fetch notifications  Ex: "api/notifications/getUserNotifications" |
| endpointHeaders | Object (optional): Header values |
| pollIntervalInSecs | Number (optional. default is 10 secs): How often to poll the server, in seconds.  |
| callback | Function  (optional): If you want to handle the response, pass a callback function |
| position | String  (optional, default is topRight): Position of the notifications. Applies only when useNoty is false(default), since Noty has its position set in notySettings. Options: top, topRight, topLeft, bottom, bottomRight, bottomLeft |
| useNoty | Boolean  (optional, default is false): true/false. If you wish to use NotyJS plugin, set this flag to true |
| notySettings | Object (optional, default settings is shown above): If using NotyJS, you can customize the settings for Noty. Refer [here](http://ned.im/noty/options.html) for options available |
| responsePayloadStructure | Object (optional, default fields are shown above): Trumpet needs to understand the response payload from your server for title, message, notificationType, timestamp fields. Also the type field must be one among the supported types : alert, info, warning, success, error. Other types will styll work but will have no colors or styling to it. |
| apiType | Enum (optional, default is Trumpet.API_TYPE.SHORT_POLLING): Specify one of the supported API types. Options: Trumpet.API_TYPE.SHORT_POLLING, Trumpet.API_TYPE.SSE, Trumpet.API_TYPE.SHORT_POLLING, API_TYPE.WEB_SOCKET (WebSocket requires [socket.io](https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js) client library )  |


