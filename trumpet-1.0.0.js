/**
 * Trumpet - Polling is a lightweight browser library written in vanilla JS for pushing notifications using
 * short polling, sse or websockets technique
 *
 * @author   Karthik Chengayan Sridhar (<https://github.com/karthikcsridhar>)
 * @version  1.0.0
 * @license  MIT
 * @see      <https://github.com/karthikcsridhar/trumpet-notifications>
 */


(function (global) {
    "use strict";

    //private members
    var serverBaseUrl, notificationsEndpoint, endpointHeaders, pollInterval, notifications = [],
        seenNotificationIDs = {},
        callback,
        useNoty,
        notySettings,
        parentElement,
        position,
        responsePayloadStructure,
        libraryName = 'Trumpet',
        localStorageKeyPrefix = 'trumpet:',
        initiated = false,
        apiType;

    //defaults
    const DEFAULTS = {
        serverBaseUrl: 'http://localhost:3001/',
        notificationsEndpoint: '',
        pollInterval: 10 * 1000, //Every 10 seconds
        responsePayloadStructure: {
            titleField: 'title',
            messageField: 'message',
            notificationTypeField: 'type',
            timeStampField: 'timestamp'
        },
        useNoty: false,
        notySettings: {
            type: 'success',
            layout: 'topRight',
            theme: 'metroui',
            timeout: 10000,
            progressBar: true,
            closeWith: ['click', 'button'],
            animation: {
                open: 'noty_effects_open',
                close: 'noty_effects_close'
            },
            id: false,
            modal: false
        },
        notyMojsAnimation: {
            open: function (promise) {
                var n = this;
                var Timeline = new mojs.Timeline();
                var body = new mojs.Html({
                    el: n.barDom,
                    x: {
                        500: 0,
                        delay: 0,
                        duration: 500,
                        easing: 'elastic.out'
                    },
                    isForce3d: true,
                    onComplete: function () {
                        promise(function (resolve) {
                            resolve();
                        })
                    }
                });

                var parent = new mojs.Shape({
                    parent: n.barDom,
                    width: 200,
                    height: n.barDom.getBoundingClientRect().height,
                    radius: 0,
                    x: {
                        [150]: -150
                    },
                    duration: 1.2 * 500,
                    isShowStart: true
                });

                n.barDom.style['overflow'] = 'visible';
                parent.el.style['overflow'] = 'hidden';

                var burst = new mojs.Burst({
                    parent: parent.el,
                    count: 10,
                    top: n.barDom.getBoundingClientRect().height + 75,
                    degree: 90,
                    radius: 75,
                    angle: {
                        [-90]: 40
                    },
                    children: {
                        fill: '#EBD761',
                        delay: 'stagger(500, -50)',
                        radius: 'rand(8, 25)',
                        direction: -1,
                        isSwirl: true
                    }
                });

                var fadeBurst = new mojs.Burst({
                    parent: parent.el,
                    count: 2,
                    degree: 0,
                    angle: 75,
                    radius: {
                        0: 100
                    },
                    top: '90%',
                    children: {
                        fill: '#EBD761',
                        pathScale: [.65, 1],
                        radius: 'rand(12, 15)',
                        direction: [-1, 1],
                        delay: .8 * 500,
                        isSwirl: true
                    }
                });

                Timeline.add(body, burst, fadeBurst, parent);
                Timeline.play();
            },
            close: function (promise) {
                var n = this;
                new mojs.Html({
                    el: n.barDom,
                    x: {
                        0: 500,
                        delay: 10,
                        duration: 500,
                        easing: 'cubic.out'
                    },
                    skewY: {
                        0: 10,
                        delay: 10,
                        duration: 500,
                        easing: 'cubic.out'
                    },
                    isForce3d: true,
                    onComplete: function () {
                        promise(function (resolve) {
                            resolve();
                        })
                    }
                }).play();
            }
        }
    };

    //private methods

    /**
     * store shown notifications in localStorage to not show duplicate ones. 
     * still logic needs to be handled at the server side to not include older notifications 
     * in the response for the current user
     **/ 

    function setToLs(key, value) {
        if (window.localStorage) {
            localStorage.setItem(key, value);
        }
    }

    /**
     * retrieves value given a key from local storage
     **/

    function getFromLs(key) {
        if (window.localStorage) {
            return localStorage.getItem(key);
        }
        return null;
    }

    function validateOptions() {
        if (notificationsEndpoint !== '' && !notificationsEndpoint) {
            console.error(libraryName + " requires a notificationsEndpoint to GET notifications from.");
        }

        if (pollInterval && (pollInterval < 0 || pollInterval.constructor !== Number)) {
            console.error(libraryName + " can only accept a positive integer as pollInterval.");
        }

        if (callback && callback.constructor !== Function) {
            console.error(libraryName + " can only accept a function as callback.");
        }

        if (useNoty && !global.Noty) {
            console.error(libraryName + " - You have asked to use the NotyJS plugin, but it is not found. Please make sure to include it before Trumpet plugin. Else disable Noty.");
        }

        if (apiType === Trumpet.API_TYPE.WEB_SOCKET && !global.io) {
            console.error(libraryName + " - requires socket.io to support websockets.");
        }
    }

    function getNotifications() {

        if (apiType == Trumpet.API_TYPE.SSE) {

            var endpoint = serverBaseUrl + notificationsEndpoint;

            let eventSource = new EventSource(endpoint);

            eventSource.addEventListener('trumpet', (e) => {
                massageNotifications(JSON.parse(e.data));
            });

        } else if (apiType === Trumpet.API_TYPE.WEB_SOCKET) {

            var endpoint = serverBaseUrl + notificationsEndpoint;

            var socket = io.connect(endpoint);

            /* socket.emit('trumpet', {
                message: 'Hey, I just connected!'
            }); */

            socket.on('error', function (err) {
                console.error(err);
            });

            socket.on('trumpet', function (data) {
                massageNotifications(data);
            });

        } else {

            var xhr = new XMLHttpRequest(),
                endpoint = notificationsEndpoint + "?ts=" + new Date().getTime();

            // add header values if required. Example: jwt token or cookies required to complete the request
            if (endpointHeaders) {
                for (var key in endpointHeaders) {
                    if (endpointHeaders.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, endpointHeaders[key]);
                    }
                }
            }

            xhr.open("GET", endpoint, true);
            xhr.onload = function () {

                massageNotifications(JSON.parse(xhr.responseText));

                // stop trumpeting by setting this flag
                if (!global.stopTrumpeting) {

                    // Poll the server for notifications.
                    setTimeout(function () {
                        getNotifications();
                    }, pollInterval);

                }

            };

            xhr.send();
        }

    }

    function massageNotifications(data) {

        var id, newNotifications = [];

        for (id in data) {

            if (data.hasOwnProperty(id)) {

                if (!getFromLs(localStorageKeyPrefix + id)) {

                    var notification = {
                        title: data[id][responsePayloadStructure.messageField],
                        message: data[id][responsePayloadStructure.messageField],
                        type: data[id][responsePayloadStructure.notificationTypeField],
                        timestamp: data[id][responsePayloadStructure.timeStampField]
                    };

                    setToLs(localStorageKeyPrefix + id, notification); // Store to Local Storge so that duplicate notifications are not shown

                    newNotifications.push(notification);

                    displayNotification(notification);

                }

            }

        }

        if (callback && callback.constructor === Function) {
            callback(newNotifications);
        }

    }

    function displayNotification(notification) {

        if (useNoty && global.Noty) {
            showNotyNotification(notification);
        } else {
            //display manually by creating divs
            buildManualNotification(notification);
        }

    }

    function buildManualNotification(notification) {

        var notificationContainer,
            notificationHeader,
            notificationTextNode,
            close;

        //creating notification container
        notificationContainer = document.createElement('div');
        notificationContainer.classList.add('trumpet-notif-' + notification.type);
        notificationContainer.classList.add('trumpetItemContainer');

        //notification type/header
        notificationHeader = document.createElement('strong');
        notificationHeader.textContent = notification.type;
        notificationContainer.appendChild(notificationHeader);

        //adding actual message
        notificationTextNode = document.createElement('span');
        notificationTextNode.textContent = notification.message;
        notificationContainer.appendChild(notificationTextNode);

        //close button
        close = document.createElement('div');
        close.className = 'trumpetClose';
        close.innerHTML = '&times;';
        notificationContainer.appendChild(close);

        //exposing required variables
        notification.close = close;
        notification.node = notificationContainer;

        parentElement.appendChild(notification.node);

        notification.close.addEventListener("click", function () {

            var container = this.parentNode;

            container.parentNode.removeChild(container);

        });

    }

    function showNotyNotification(notification) {

        if (useNoty && global.Noty) {

            if (global.mojs)
                notySettings.animation = DEFAULTS.notyMojsAnimation;

            notySettings.text = notification.message;
            notySettings.type = notification.type;

            new Noty(notySettings).show();

        }
    }

    function createNotificationsParentContainer() {

        var firstAfterBody;

        parentElement = document.getElementById("trumpet-container");

        if (!parentElement) {
            firstAfterBody = document.createElement("div");
            document.body.insertBefore(firstAfterBody, document.body.firstChild);
            parentElement = firstAfterBody;

        if (position)
            parentElement.classList.add('trumpet-notif-' + position);
        else
            parentElement.classList.add('trumpet-notif-topRight');

        }

    }

    function setStyle() {

        var style = document.createElement("style"),
            stylesheet;

        // WebKit hack
        style.appendChild(document.createTextNode(""));

        // Add the <style> element to the page
        document.body.appendChild(style);

        stylesheet = style.sheet;

        insertStyle(stylesheet, ".trumpet-notif-alert", "background-color: #ffe5fd; border-color: #f1d8ef; color: #a94442;");
        insertStyle(stylesheet, ".trumpet-notif-info", "background-color: #7f7eff; border-color: #7473e8; color: #fff;");
        insertStyle(stylesheet, ".trumpet-notif-success", "background-color: #60A917; border-color: #4d8712; color: #fff;");
        insertStyle(stylesheet, ".trumpet-notif-error", "background-color: #f51f1f; border-color: #d82d2d; color: #fff;");
        insertStyle(stylesheet, ".trumpet-notif-warning", "background-color: #ffae42; border-color: #e89f3c; color: #fff;");

        insertStyle(stylesheet, ".trumpetItemContainer", "position: relative; border-radius: 2px; border: 1px solid; font-size: 14px; padding: 10px 0 10px 14px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 10px 0;line-height: normal;");
        insertStyle(stylesheet, ".trumpetItemContainer strong", "float: left; margin-right: 15px; line-height: 15px");
        insertStyle(stylesheet, ".trumpetItemContainer span", "display:table-cell; padding-right: 35px;");
        insertStyle(stylesheet, ".trumpetClose", "position: absolute; right: 10px; top: 0; cursor: pointer; font-size: 26px; font-weight: bold;");

        insertStyle(stylesheet, ".trumpet-notif-topRight", "width: 340px; position: absolute; right: 10px; top: 5px;");
        insertStyle(stylesheet, ".trumpet-notif-top", "width: 340px; left: 50%; transform: translate(-170px,0); position: absolute; top: 5px;");
        insertStyle(stylesheet, ".trumpet-notif-bottom", "width: 340px; left: 50%; transform: translate(-170px,0); position: absolute; bottom: 5px;");
        insertStyle(stylesheet, ".trumpet-notif-bottomRight", "width: 340px; position: absolute; right: 10px; bottom: 5px;");
        insertStyle(stylesheet, ".trumpet-notif-topLeft", "width: 340px; position: absolute; left: 10px; top: 5px;");
        insertStyle(stylesheet, ".trumpet-notif-bottomLeft", "width: 340px; position: absolute; left: 10px; bottom: 5px;");
    }

    function insertStyle(sheet, selector, rules, index) {
        index = index || 0;
        if (sheet.insertRule) {
            sheet.insertRule(selector + "{" + rules + "}", index);
        } else {
            sheet.addRule(selector, rules, index);
        }
    }

    //publicly exposed objects
    const Trumpet = {

        /**
         * `init` initializes the library properties and initiates the data pull.
         * Errors are logged to the console as errors, but Trumpet fails silently.
         *
         * @private
         *
         * @param   {Object}     options  options that define the library properties
         *                                - serverBaseUrl               :   API base URL
         *                                - notificationsEndpoint       :   Endpoint to fetch notifications 
         *                                - endpointHeaders             :   Headers. Ex: JWT token, SSO Cookie
         *                                - pollIntervalInSecs          :   Interval between HTTP polls
         *                                - callback                    :   callback function to handle response data
         *                                - position                    :   position, where notifications will be shown. options: top, topRight, topLeft, bottom, bottomRight, bottomLeft
         *                                - useNoty                     :   Boolean - true/false. Whether to use NotyJS library to display notifications. If true Noty must be included before Trumpet
         *                                - notySettings                :   Object - settings for NotyJS
         *                                - responsePayloadStructure    :   Object - define the key names for title, message, type, timestamp fields from the API
         */

        init: function (options) {
            //initialize properties
            serverBaseUrl = options.serverBaseUrl || serverBaseUrl || DEFAULTS.serverBaseUrl;
            notificationsEndpoint = options.notificationsEndpoint || notificationsEndpoint || DEFAULTS.notificationsEndpoint;
            endpointHeaders = options.endpointHeaders || endpointHeaders;
            pollInterval = options.pollIntervalInSecs * 1000 || pollInterval || DEFAULTS.pollInterval;
            callback = options.callback || callback;
            position = options.position || position;
            useNoty = options.useNoty || useNoty || DEFAULTS.useNoty;
            notySettings = options.notySettings || notySettings || DEFAULTS.notySettings;
            responsePayloadStructure = options.responsePayloadStructure || responsePayloadStructure || DEFAULTS.responsePayloadStructure;
            apiType = options.apiType || Trumpet.API_TYPE.HTTP_SHORT_POLLING;

            validateOptions();

            if (!useNoty) {
                createNotificationsParentContainer();
                setStyle();
            }

            if (!initiated) {
                initiated = true;
                getNotifications();
            }
        },

        API_TYPE: {
            HTTP_SHORT_POLLING: 0,
            SSE: 1,
            WEB_SOCKET: 2
        }

    };

    /**
     * Expose Trumpet depending on the module system used across the
     * application. ( CommonJS, AMD, global)
     */

    if (typeof exports === 'object') {
        module.exports = Trumpet
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return Trumpet
        })
    } else {
        global.Trumpet = Trumpet
    }

})(window);