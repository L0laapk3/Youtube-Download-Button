// ==UserScript==
// @name         Youtube Download button
// @version      4.1.0
// @author       L0laapk3
// @match        *://www.youtube.com/*
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @require      https://cdn.rawgit.com/meetselva/attrchange/master/js/attrchange.js
// @updateURL    https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @downloadURL  https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @grant        GM.download
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// @connect      example.com
// @connect      example.net
// @connect      flvto.biz
// ==/UserScript==


(function() {

    init();

    var tries = 0;
    function init() {
        if (tries++ > 5)
            throw new Error("Loading download button failed!");
        $.getScript("https://rawgit.com/L0laapk3/Youtube-Download-Button/master/main.js")
            .fail(init);
    }
});