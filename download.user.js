// ==UserScript==
// @name         Youtube Download button
// @version      2.3.0
// @author       L0laapk3
// @match        https://www.youtube.com/*
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @downloadURL  https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @grant        none
// ==/UserScript==



(function() {
    var button, subButton;
    var topPos;

    var lasturl = "";

    function check() {
        if (location.href == lasturl) return;
        lasturl = location.href;
        if (lasturl.indexOf("watch?v=")) init();
    }
    setInterval(check, 1000);


    function init() {
        console.warn("init!" + lasturl);
        subButton = topPos = undefined;
        isThere = false;
        if (button) button.remove();
        if (location.href.indexOf("watch") == -1) return;
        button = $('<div id="downloadbutton" style="background-color: orange;color: white;border: solid 2px orange;border-radius: 2px;cursor: pointer;font-size: 14px;height: 33px;line-height: 33px;padding: 0 15px;font-weight: 500; margin-top: 7px;z-index: 1;">Download MP3</div>');
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
        var div = $("[id='subscribe-button']")
            .filter(function(e) { return !$("ytd-search").find(e).length; })
            .filter(function(i, e) { return $(e).offset().top - $("body").offset().top; })
            .sort(function(a, b) { return $(b).offset().top - $(a).offset().top; })
            .first();
        if (div.length > 0)
            setTimeout(function() {
                div.before(button);
                subButton = div;
                topPos = {
                    marginTop: $("#info-contents").offset().top - $("#downloadbutton").offset().top + 7 + "px",
                    marginRight: $("#downloadbutton").offset().left + $("#downloadbutton").outerWidth() - $("#info-contents").offset().left - $("#info-contents").outerWidth() + "px"
                };
                hasScrolled(0);
            }, 100);
        else
            setTimeout(waitForDiv, 100);
    }


    function download() {
        var url = window.location.href;
        var title = $("#main").has(button).find(".title").text();
        button.css({cursor: "progress"}).prepend("<paper-spinner-lite style='margin: 2.5px 6px -9.5px -10px;' active>");
        $.ajax({
            method: "POST",
            url: "https://www3.onlinevideoconverter.com/webservice",
            data: {
                function: "validate",
                args: {
                    urlEntryUser: url,
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
                            finish(/\{'url': '([^']+)'/m.exec(b)[1], title, function(err) { download2(url, title, 0, err); });
                        }
                    });
                else if (response.status == "ok")
                    return finish(response.serverUrl + "/download?file=" + response.id_process, title, function(err) { download2(url, title, 0, err); });
                download2(url, title, 0, JSON.stringify(response));
            }
        });
    }


    //using other downloader
    function download2(url, title, i, err1) {
        $.get("https://api.convert2mp3.cc/check.php?v=" + url.split("v=")[1].split("&")[0] + "&h=" + Math.floor(35e5 * Math.random()), function(t) {
            var o = t.split("|");
            if("OK" == o[0])
                return finish("http://dl" + o[1] + ".downloader.space/dl.php?id=" + o[2], title, function(err) {downloadError(err1, err); });
            if(i > ((o[1] == "PENDING" || o[0] == "DOWNLOAD") ? 100 : 3))
                return downloadError(err1, "timeout");
            setTimeout(function() {
                download2(url, title, i + 1, err1);
            }, 5e3);
        });
    }


    function downloadError(err1, err2) {
        alert("download error :(\nerror 1: " + err1 + "\nerror 2: " + err2);
        init();
    }



    function finish(downloadUrl, title, errcallback) {

        console.log("real title:", title);
        console.log("trying url:", downloadUrl);


        var failure = false;
        var iframe = $("<iframe>").attr("src", downloadUrl.replace("http://", "https://")).appendTo("body").ready(function() {
            setTimeout(function() {
                iframe.remove();
                if (failure)
                    return;
                console.log("success!");
                button.css({cursor: "default"});
                button.children("paper-spinner-lite").remove();
            }, 5000);
        }).load(function() {
            console.log("fail");
            failure = true;
            errcallback("invalid download url");
        });
    }


    var isThere = false;
    $(document).scroll(function() { hasScrolled(200); });
    setInterval(function() { hasScrolled(200); }, 50); //theater mode
    function hasScrolled(delay) {
        if (!subButton || !button || !topPos) return;
        if ($(document).scrollTop() + window.innerHeight < subButton.offset().top + subButton.innerHeight()) {
            if (isThere) return;
            button.animate(topPos, {queue: false, easing: "easeInOut", duration: delay});
            isThere = true;
        } else {
            if (!isThere) return;
            button.animate({marginTop: "7px", marginRight: 0}, {queue: false, easing: "easeInOut", duration: delay});
            isThere = false;
        }
    }
    $.extend($.easing, {
        easeInOut: function (x, t, b, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 * ((t-=2)*t*t*t - 2) + b;
        }
    });


    setInterval(function() {
        if ((!$("#downloadbutton") || !$("#downloadbutton").offset() || !($("#downloadbutton").offset().top - $("body").offset().top)) && location.href.indexOf("watch") > -1)
            init();
    }, 5e3);

})();