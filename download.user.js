// ==UserScript==
// @name         Youtube Download button
// @version      0.2
// @author       L0laapk3
// @match        https://www.youtube.com/*
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @downloadURL  https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @grant        none
// ==/UserScript==



(function() {
    var button;

    var lasturl = "";

    function check() {
        if (location.href == lasturl) return;
    	lasturl = location.href;
    	if (lasturl.indexOf("watch?v=")) init();
    }
	setInterval(check, 1000);


    function init() {
    	console.warn("init!");
    	if (button) button.remove();
    	button = $('<div style="background-color: orange;color: white;border: solid 2px orange;border-radius: 2px;cursor: pointer;font-size: 14px;height: 33px;margin-top: 7px;line-height: 33px;padding: 0 15px;font-weight: 500;">Download MP3</div>');
	    button.one("click", download);
		waitForDiv();
	    var url = window.location.href;
	    setInterval(function() {
	        if (window.location.href != url) {
	            url = window.location.href;
	            waitForDiv();
	        }
	    }, 1000);
	}
    
	function waitForDiv() {
		var div = $("#subscribe-button");
		if (div.length > 0)
			setTimeout(function() { div.before(button); }, 1000);
		else
			setTimeout(waitForDiv, 100);
	}
    
    
    function download() {
        button.css({cursor: "progress"});
        $.ajax({
            method: "POST",
            url: "https://www3.onlinevideoconverter.com/webservice",
            data: {
                function: "validate",
                args: {
                    urlEntryUser: window.location.href,
                    fromConvert: "urlconverter",
                    requestExt: "mp3",
                    videoResolution: -1,
                    audioBitrate: 0,
                    audioFrequency: 0,
                    channel: "stereo",
                    volume: 0,
                    startFrom: -1,
                    endTo: -1,
                    custom_resx: -1,
                    custom_resy: -1,
                    advSettings: false,
                    aspectRatio: -1
                }
            },
            success: function(a) {
                var response = a.result;
                if (response.dPageId && response.dPageId.length > 2)
                    return $.ajax({
                        url: "https://www.onlinevideoconverter.com/nl/success?id=" + response.dPageId,
                        success: function(b) {
                            finish(/\{'url': '([^']+)'/m.exec(b)[1]);
                        }
                    });
                else if (response.status == "ok")
                    return finish(response.serverUrl + "/download?file=" + response.id_process);
                alert("download error :(\n" + response);
            }
        });
    }


    function finish(downloadUrl) {
        console.log("done!", downloadUrl);
        $("<iframe>").attr("src", downloadUrl.replace("http://", "https://")).appendTo("body");
    }
    
})();