// ==UserScript==
// @name         Youtube Download button
// @version      2.4.0
// @author       L0laapk3
// @match        https://www.youtube.com/*
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @require      https://cdn.rawgit.com/meetselva/attrchange/master/js/attrchange.js
// @updateURL    https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @downloadURL  https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @run-at       document-start
// @connect      flvto.biz
// ==/UserScript==



(function() {
    var button, subButton;
    var topPos;

    var lasturl = "";

    var lastdl;

    function check() {
        if (location.href == lasturl) return;
        lasturl = location.href;
        if (lasturl.indexOf("watch?v=")) init();
    }
    var checkInt = setInterval(check, 50);


    function init() {
        if (lastdl && lastdl == button.closest("ytd-watch").attr("video-id")) return;
        console.warn("init!" + lasturl);
        subButton = undefined;
        isThere = false;
        if (button) button.remove();
        if (location.href.indexOf("watch") == -1) return;
        clearInterval(checkInt);
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
                var infoContents = button.closest("[id='main']").find("[id='info-contents']");
                if (!topPos) topPos = {
                    marginTop: infoContents.offset().top - button.offset().top + 7 + "px",
                    marginRight: button.offset().left + button.outerWidth() - subButton.offset().left - subButton.outerWidth() + "px"
                };
                moveButton(0);
                button.closest("ytd-watch").attrchange({callback: function() {
                    console.log(lastdl, button.closest("ytd-watch").attr("video-id"));
                    if ((!button || !button.offset() || !(button.offset().top - $("body").offset().top)) && location.href.indexOf("watch") > -1)
                        init();
                    else if (lastdl && lastdl != button.closest("ytd-watch").attr("video-id"))
                        init();
                    else
                        hasScrolled();
                }});
            }, 100);
        else
            setTimeout(waitForDiv, 100);
    }


    function download() {
        button.css({cursor: "progress"}).prepend("<paper-spinner-lite style='margin: 2.5px 6px -9.5px -10px;' active>");
        var id = lastdl = button.closest("ytd-watch").attr("video-id");
        var url = "https://www.youtube.com/watch?v=" + id;
        var title = button.closest("[id='main']").find(".title").text();
        download_flvto(url, title);
    }

    function download_flvto(url, title) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://www.flvto.biz/nl/convert/",
            data: "format=1&service=youtube&url=" + encodeURIComponent(url),
            headers: {
            "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function(a) {
                if (a.status != 200)
                    return download_onlinevideoconverter(url, title, a.status);
                var match = /"status" *: *"([^"]*)" *, *"statusUrl" *: *"?([^"]*)"?/m.exec(a.responseText);
                if (!match || !match[1] || !match[2])
                    return download_onlinevideoconverter(url, title, "no status url");

                if (match[1] == "ready")
                    return finish("http://www.flvto.biz/nl/download/direct/mp3/yt_" + url.split("=")[1] + "/", title, function(err) { download_onlinevideoconverter(url, title, err); }, true);

                var statusUrl = "http://www.flvto.biz" + match[2].replace(/\\/g, '');
                console.log(statusUrl);

                var i = 0, lastProgress = 0;
                function checkStatus() {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: statusUrl,
                        onload: function(a) {
                            if (a.status != 200)
                                return download_onlinevideoconverter(url, title, "status " + a.status);
                            try {
                                var json = JSON.parse(a.responseText);
                                if (json.status == "redirect") {
                                    statusUrl = "http://www.flvto.biz" + json.status_url;
                                    checkStatus();
                                } else if (json.status == "error" || json.error) {
                                    return download_onlinevideoconverter(url, title, "status returned error");
                                } else if (json.status == "finish") {
                                    return finish("http://www.flvto.biz/nl/download/direct/mp3/yt_" + url.split("=")[1] + "/", title, function(err) { download_onlinevideoconverter(url, title, err); }, true);
                                } else {
                                    if (json.progress) {
                                        if (json.progress != lastProgress) {
                                            lastProgress = json.progress;
                                            progress((json.status == "convert" ? 50 : 0) + json.progress / 2);
                                            i = 0;
                                        } else
                                            i++;
                                    } else
                                        i++;

                                    if (i > (lastProgress == "5.1" ? 30 : 5) * 1000 / 100) return download_onlinevideoconverter(url, title, "progress stuck"); //5 seconds without progress change

                                    return setTimeout(checkStatus, 100);
                                }

                            } catch (err) {
                                return download_onlinevideoconverter(url, title, "json: " + err);
                            }
                        },
                        onerror: function(err) { download_onlinevideoconverter(url, title, "status unreachable"); }
                    });
                }
                checkStatus();
            },
            onerror: function(err) { download_onlinevideoconverter(url, title, "unreachable"); }
        });
    }


    function download_onlinevideoconverter(url, title, err0) {
        console.warn("error 0:", err0);
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
                            finish(/\{'url': '([^']+)'/m.exec(b)[1], title, function(err) { download_convert2mp3(url, title, err0, err, 0); });
                        }
                    });
                else if (response.status == "ok")
                    return finish(response.serverUrl + "/download?file=" + response.id_process, title, function(err) { download_convert2mp3(url, title, err0, err, 0); });
                download_convert2mp3(url, title, err0, JSON.stringify(response), 0);
            }
        });
    }


    //using other downloader
    function download_convert2mp3(url, title, err0, err1, i) {
        $.get("https://api.convert2mp3.cc/check.php?v=" + url.split("v=")[1].split("&")[0] + "&h=" + Math.floor(35e5 * Math.random()), function(t) {
            var o = t.split("|");
            if("OK" == o[0])
                return finish("http://dl" + o[1] + ".downloader.space/dl.php?id=" + o[2], title, function(err) {downloadError(err0, err1, err); });
            if(i > ((o[1] == "PENDING" || o[0] == "DOWNLOAD") ? 100 : 3))
                return downloadError(err0, err1, "timeout");
            setTimeout(function() {
                download_convert2mp3(url, title, err0, err1, i + 1);
            }, 5e3);
        });
    }


    function downloadError(err0, err1, err2) {
        alert("download error :(\nerror 1: " + err0 + "\nerror 2: " + err1 + "\nerror 3: " + err2);
        init();
    }


    function progress(i) {
        console.log("progress:", i);
    }



    function finish(downloadUrl, title, errcallback, httpOnly) {

        console.log("real title:", title);
        console.log("trying url:", downloadUrl);


        GM_download({
            url: downloadUrl,
            name: title + ".mp3",
            onload: function(a) {
                console.log("success!");
                button.css({cursor: "default"});
                button.children("paper-spinner-lite").remove();
            },
            onerror: function() { errcallback("invalid download url"); }
        });

        /*var failure = false;
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
            progress(0);
            errcallback("invalid download url");
        });*/

    }

    $(document).scroll(hasScrolled);

    function hasScrolled() { moveButton(200); }
    var isThere = false;

    function moveButton(delay) {
        if (!subButton || !button || !topPos) return;
        window.topPos = topPos;
        if ($(document).scrollTop() + window.innerHeight <= subButton.offset().top + subButton.innerHeight()) {
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
})();