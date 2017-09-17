// ==UserScript==
// @name         Youtube Download button
// @version      2.0.0
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
    	console.warn("init!" + lasturl);
    	if (button) button.remove();
    	button = $('<div id="downloadbutton" style="background-color: orange;color: white;border: solid 2px orange;border-radius: 2px;cursor: pointer;font-size: 14px;height: 33px;margin-top: 7px;line-height: 33px;padding: 0 15px;font-weight: 500;">Download MP3</div>');
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
		var div = $("[id='subscribe-button']").filter(function(i, e) { return $(e).offset().top; }).last();
		if (div.length > 0)
			setTimeout(function() { div.before(button); }, 100);
		else
			setTimeout(waitForDiv, 100);
	}
    
    
    function download() {
        button.css({cursor: "progress"}).prepend("<paper-spinner-lite style='margin: 2.5px 6px -9.5px -10px;' active>");
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
                download2(0, JSON.stringify(response));
            }
        });
    }


    //using other downloader
    function download2(i, error1) {
        $.get("https://api.convert2mp3.cc/check.php?v=" + window.location.href.split("=")[1] + "&h=" + Math.floor(35e5 * Math.random()), function(t) {
            var o = t.split("|");
            if("OK" == o[0])
                return finish("http://dl" + o[1] + ".downloader.space/dl.php?id=" + o[2]);
            if(i > ((o[1] == "PENDING" || o[0] == "DOWNLOAD") ? 100 : 3))
                return downloadError(error1);
            setTimeout(function() {
                download2(i + 1, error1);
            }, 5e3);
        })
    }


    function downloadError(msg) {
        alert("download error :(\n" + msg);
        init();
    }



    function finish(downloadUrl) {
        console.log("done!", downloadUrl);
        //$("<a download>").attr("href", downloadUrl.replace("http://", "https://")).appendTo("body").click();
        $("<iframe>").attr("src", downloadUrl.replace("http://", "https://")).appendTo("body").ready(function() {
            button.css({cursor: "default"});
            button.children("paper-spinner-lite").remove();
        });
    }


    setInterval(function() {
        if (!$("#downloadbutton") || !$("#downloadbutton").offset() || !$("#downloadbutton").offset().top)
            init();
    }, 5e3);
    
})();