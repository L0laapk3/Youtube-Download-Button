// ==UserScript==
// @name         Youtube Download button
// @version      3.0.2
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
        subButton = topPos = undefined;
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

    function waitForDiv(i) {
        if (i > 50) return;
        var div = $("[id='subscribe-button']")
            .filter(function(e) { return !$("ytd-search").find(e).length; })
            .filter(function(i, e) { return $(e).offset().top - $("body").offset().top; })
            .sort(function(a, b) { return $(b).offset().top - $(a).offset().top; })
            .first();
        var infoContents = div.closest("[id='main']").find("[id='info-contents']");
        console.log(div, infoContents);
        if (div.length && infoContents.length) {
            div.before(button);
            subButton = div;
            topPos = {
                marginTop: infoContents.offset().top - button.offset().top + 7 + "px",
                marginRight: button.offset().left + button.outerWidth()  - subButton.offset().left - subButton.outerWidth() + "px"
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
        } else
            setTimeout(function() { waitForDiv(i + 1 || 1); }, 50);
    }


    console.log(downloaderList);
    function download() {



        button.css({cursor: "progress"}).prepend("<paper-spinner-lite style='margin: 2.5px 6px -9.5px -10px;' active>");
        var id = lastdl = button.closest("ytd-watch").attr("video-id");
        var url = "https://www.youtube.com/watch?v=" + id;
        var title = button.closest("[id='main']").find("[id='info-contents']").find(".title").text();



        var left = [];
        var lowestNonFail = 0;
        var errors = {};
        var finishFn = [];
        downloaderList.forEach(function(e, i) {
            left.push(e.length);
            finishFn.push([]);
            console.log(i, e);
            e.forEach(function(dler, j) {
                dler.downloadFn(url, title, id, function(dlUrl) {

                    if (lowestNonFail == i) {
                        finish(dlUrl, title, function() {
                            error("invalid download url");
                        });
                    }

                }, error, function(prog) { progress(prog); });


                function error(err) {
                    errors[dler.name] = err;
                    if (--left[i] == 0)
                        do {
                            lowestNonFail++;
                            if (lowestNonFail >= left.length)
                                return downloadError(errors);
                        } while (!left[++lowestNonFail]);
                }


            });

        });
    }






    function downloadError(errors) {
        string = "download error :(";
        for (const key of Object.keys(errors))
            string += "\n" + key + ": " + errors[key];
        alert(string);
        init();
    }


    function progress(i) {
        console.log("progress:", i);
    }




    function finish(downloadUrl, title, error) {

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
            onprogress: function(a, b) {console.log("progress", a, b); },
            onerror: error
        });
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








    var downloaders = [

        {


            name: "flvto.biz",
            priority: -1,
            subpriority : -1,
            downloadFn: function(url, title, id, finish, error, progress) {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "http://www.flvto.biz/nl/convert/",
                    data: "format=1&service=youtube&url=" + encodeURIComponent(url),
                    headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                    },
                    onload: function(a) {
                        if (a.status != 200)
                            return error(a.status);
                        var match = /"status" *: *"([^"]*)" *, *"statusUrl" *: *"?([^"]*)"?/m.exec(a.responseText);
                        if (!match || !match[1] || !match[2])
                            return error("no status url");

                        if (match[1] == "ready")
                            return finish("http://www.flvto.biz/nl/download/direct/mp3/yt_" + url.split("=")[1] + "/");

                        var statusUrl = "http://www.flvto.biz" + match[2].replace(/\\/g, '');
                        console.log(statusUrl);

                        var i = 0, lastProgress = 0;
                        function checkStatus() {
                            GM_xmlhttpRequest({
                                method: "GET",
                                url: statusUrl,
                                onload: function(a) {
                                    if (a.status != 200)
                                        return error("status " + a.status);
                                    try {
                                        var json = JSON.parse(a.responseText);
                                        if (json.status == "redirect") {
                                            statusUrl = "http://www.flvto.biz" + json.status_url;
                                            checkStatus();
                                        } else if (json.status == "error" || json.error) {
                                            return error("status returned error");
                                        } else if (json.status == "finish") {
                                            return finish("http://www.flvto.biz/nl/download/direct/mp3/yt_" + id + "/");
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

                                            if (i > (lastProgress == "5.1" ? 30 : 5) * 1000 / 100) return error("progress stuck"); //5 seconds without progress change

                                            return setTimeout(checkStatus, 100);
                                        }

                                    } catch (err) {
                                        return error("json: " + err);
                                    }
                                },
                                onerror: error
                            });
                        }
                        checkStatus();
                    },
                    onerror: error
                });
            }


        }, {



            name: "onlinevideoconverter.com",
            priority: 1,
            subpriority: 0,
            downloadFn: function(url, title, id, finish, error, progress) {
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
                                    finish(/\{'url': '([^']+)'/m.exec(b)[1]);
                                }
                            });
                        else if (response.status == "ok")
                            return finish(response.serverUrl + "/download?file=" + response.id_process);
                        error(JSON.stringify(response));
                    }
                });
            }


        }, {



            name: "convert2mp3.cc",
            priority: 0,
            subpriority: 0,
            downloadFn: function download_convert2mp3(url, title, id, finish, error, progress) {
                $.get("https://api.convert2mp3.cc/check.php?v=" + url.split("v=")[1].split("&")[0] + "&h=" + Math.floor(35e5 * Math.random()), function(t) {
                    var o = t.split("|");
                    if("OK" == o[0])
                        return finish("http://dl" + o[1] + ".downloader.space/dl.php?id=" + o[2]);
                    if(i > ((o[1] == "PENDING" || o[0] == "DOWNLOAD") ? 100 : 3))
                        return error("timeout");
                    setTimeout(function() {
                        download_convert2mp3(url, title, id, finish, error, progress, i + 1);
                    }, 5e3);
                });
            }



        }
    ];

    var downloaderList = [];
    for (const key of Object.keys(downloaders))
        if (downloaderList.indexOf(downloaders[key].priority) == -1)
            downloaderList.push(downloaders[key].priority);
    downloaderList.sort(function(a, b) { return b - a; });
    downloaderList.forEach(function(e, i) {
        console.log(i, e);
        downloaderList[i] = [];
        for (const key of Object.keys(downloaders))
            if (downloaders[key].priority == e)
                downloaderList[i].push(downloaders[key]);
    });



})();