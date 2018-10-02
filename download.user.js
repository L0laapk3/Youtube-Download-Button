// ==UserScript==
// @name         Youtube Download button
// @version      4.1.1
// @author       L0laapk3
// @match        *://www.youtube.com/*
// @require      http://code.jquery.com/jquery-1.12.4.min.js
// @require      https://cdn.rawgit.com/meetselva/attrchange/master/js/attrchange.js
// @updateURL    https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @downloadURL  https://rawgit.com/L0laapk3/Youtube-Download-Button/master/download.user.js
// @grant        GM.download
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// @connect      flvto.biz
// ==/UserScript==


(function() {
    var button, subButton;
    var topPos;

    var lasturl = "";

    var lastId;

    function check() {
        if (location.href == lasturl) return;
        lasturl = location.href;
        if (lasturl.indexOf("watch?v=")) init();
    }
    var checkInt = setInterval(check, 50);


    function init() {
        if (lastId && button && lastId == button.closest("ytd-watch, ytd-watch-flexy").attr("video-id")) return;
        console.warn("init!", lastId);
        subButton = topPos = undefined;
        isThere = false;
        if (button) button.remove();
        if (location.href.indexOf("watch") == -1) return;
        clearInterval(checkInt);
        // <span>⯆</span>
        button = $('<div id="downloadbutton">Download MP3<div><div id="downloadprogressbar"></div></div></div>');
        button.one("click", download);
        waitForDiv();
        var url = window.location.href;
        /*setTimeout(function() {
            if (window.location.href != url) {
                url = window.location.href;
                waitForDiv();
            }
        }, 1000);*/
    }

    var node = document.createElement('style');
    node.innerHTML = "#downloadbutton { transition: width 0.2s; background-color: orange;color: white;border: solid 2px orange;border-radius: 2px;cursor: pointer;font-size: 14px;height: 33px;line-height: 33px;padding: 0 15px;font-weight: 500; margin-top: 7px;z-index: 1;position: relative; }" +
                     "#downloadbutton > div { border-bottom: 2px;border-bottom-left-radius: 2px;border-bottom-right-radius: 2px;position: absolute;bottom: -2px;width: calc(100% + 4px);left: -2px;overflow: hidden; }" +
                     "#downloadprogressbar { background-color: dodgerblue;height: 2px;width: 0; }";
    document.head.append(node);

    var happened = false;
    function waitForDiv(i) {
        var div = $('#meta-contents [id="subscribe-button"]')
            .filter(function(e) { return !$("ytd-search").find(e).length; })
            .filter(function(i, e) { return $(e).offset().top - $("body").offset().top; })
            .sort(function(a, b) { return $(b).offset().top - $(a).offset().top; })
            .first();
        var infoContents = div.closest("[id='primary-inner']").find("[id='info-contents'] [id='container']");
        if (div.length && div.find("paper-button").length && infoContents.length) {
            div.before(button);
            subButton = div;
            topPos = {
                marginTop: infoContents.offset().top - subButton.offset().top + (24 - 37)/2 + "px",
                marginRight: subButton.find("paper-button").offset().left - subButton.offset().left - subButton.width() + "px"
            };
            lastId = button.closest("ytd-watch, ytd-watch-flexy").attr("video-id");
            moveButton(0);
            button.closest("ytd-watch, ytd-watch-flexy").attrchange({callback: function() {
                if (happened) return;
                happened = true;
                setTimeout(function() { happened = false; }, 0);
                if ((!button || !button.offset() || !(button.offset().top - $("body").offset().top)) && location.href.indexOf("watch") > -1)
                    init();
                else if (lastId && lastId != button.closest("ytd-watch, ytd-watch-flexy").attr("video-id"))
                    init();
                else
                    hasScrolled();
            }});
        } else if ((i || 0) < 50)
            setTimeout(function() { waitForDiv(i + 1 || 1); }, 50);
    }


    function download() {



        button.prepend("<paper-spinner-lite style='margin: 2.5px 6px -9.5px -10px;' active>")[0].style.cursor = "progress";
        var id = button.closest("ytd-watch, ytd-watch-flexy").attr("video-id");
        console.assert(id && id.length > 2, "could not extract youtube id");
        var url = "https://www.youtube.com/watch?v=" + id;
        var title = button.closest("[id='primary-inner']").find("[id='info-contents'] .title").text().replace(/[\\\/:*?<>|]|^ | $|\.$|\n\n|\r/g, '');
        console.assert(title && title.length > 0, "could not extract youtube title");



        var left = [];
        var lowestNonFail = 0;
        var errors = {};
        var finishFn = [];
        var abortFn = [];
        var done = false;
        var highestProgress = [];
        var lastProgress = -1;
        downloaderList.forEach(function(e, i) {
            left.push(e.length);
            finishFn.push([]);
            highestProgress[i] = -1;
            var allProgress = [];
            e.forEach(function(dler, j) {
                var first = true;
                allProgress[j] = -1;
                console.log("request download of ", dler);
                setTimeout(function() {
                    try {
                        dler.downloadFn(url, title, id, function(dlUrl) {

                            console.log("finished ", dler, dlUrl);

                            if (!first) return;

                            function thisFinish() {
                                var fullDownloadProgessBar = undefined;
                                var thisAbort = finish(dlUrl, title, function() {
                                    error("invalid download url");
                                }, function(a) {
                                    if (first) {
                                        first = false;
                                        abortFn.splice(abortFn.indexOf(thisAbort), 1);
                                        abortFn.forEach(function(e) { e(); });
                                    }
                                    if (!fullDownloadProgessBar)
                                        fullDownloadProgessBar = (lastProgress > 1) ? 50 : 100;
                                    highestProgress[i] = Math.max(highestProgress[i] || 0, allProgress[j] = 100 - fullDownloadProgessBar + a.done * fullDownloadProgessBar / a.total);
                                    progress(allProgress[j], dler.name);
                                });
                                abortFn.push(thisAbort);
                            }

                            if (lowestNonFail == i && !done)
                                thisFinish();
                            else
                                finishFn[i].push(thisFinish);

                        }, error, function(prog) {
                            highestProgress[i] = Math.max(highestProgress[i] || 0, allProgress[j] = prog);
                            if (lowestNonFail == i && !done) {
                                progress(lastProgress = highestProgress[i], dler.name);
                            }
                        });
                    } catch (err) {
                        error(err);
                    }


                    function error(err) {

                            if (done)
                                return;
                            console.log("errored ", dler);

                            errors[dler.name] = err;
                            if (--left[i] == 0) {
                                while (!left[lowestNonFail]) {
                                    lowestNonFail++;
                                    if (lowestNonFail >= left.length)
                                        return downloadError(errors);
                                }
                                if (lowestNonFail < left.length) {
                                    if (finishFn[lowestNonFail].length)
                                        finishFn[lowestNonFail][0]();
                                    else
                                        progress(lastProgress = highestProgress[lowestNonFail]);
                                }

                            } else if (lowestNonFail == i) {
                                allProgress[j] = -1;
                                progress(lastProgress = highestProgress[i] = allProgress.reduce(function(a, b) { return Math.max(a, b); }));
                            }
                        }
                }, 0);

            });

        });
    }






    function downloadError(errors) {
        var string = "download error :(";
        for (const key of Object.keys(errors))
            string += "\n" + key + ": " + errors[key];
        alert(string);
        init();
    }


    function progress(i, name) {
        console.log("progress", i, name);
        if (button)
            button.find("#downloadprogressbar").css({width: i == -1 ? 0 : i + "%"});
    }




    function finish(downloadUrl, title, error, onprogress) {

        console.log("real title:", title);
        console.log("trying url:", downloadUrl);

        var first = true;
        var dlObject = GM.download({
            url: downloadUrl,
            name: title + ".mp3",
            onload: function(a) {
                console.log("success!");
                button[0].style.cursor = "default";
                button.children("paper-spinner-lite").remove();
                progress(-1);
            },
            onprogress: onprogress,
            onerror: error
        });
        return dlObject.abort;
    }

    $(document).scroll(hasScrolled);

    function hasScrolled() { moveButton(200); }
    var isThere = false;

    function moveButton(delay) {
        if (!subButton || !button || !topPos) return;
        if ($(document).scrollTop() + window.innerHeight <= subButton.find("paper-button").offset().top + button.height() + 1) {
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
            downloadFn: function(url, title, id, finish, error, progress) {
                GM.xmlHttpRequest({
                    method: "POST",
                    url: "https://www.flvto.biz/nl/convert/",
                    data: "url=" + encodeURIComponent(url) + "&format=1&service=youtube",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    onload: function(a) {
                        if (a.status != 200)
                            return error(a.status);
                        var match = /"status" *: *"([^"]*)" *, *"statusUrl" *: *"?([^"]*)"?/m.exec(a.responseText);
                        if (!match || !match[1] || !match[2])
                            return error("no status url");

                        if (match[1] == "ready")
                            return finish("http://www.flvto.biz/nl/download/direct/mp3/yt_" + url.split("=")[1] + "/");

                        var statusUrl = "http://www.flvto.biz" + match[2].replace(/\\/g, '');

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


//broken
            name: "onlinevideoconverter.com",
            priority: 1,
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
                                    try {
                                        finish(/\{'url': '([^']+)'/m.exec(b)[1]);
                                    } catch (err) {
                                        error(err);
                                    }
                                }
                            });
                        else if (response.status == "ok")
                            return finish(response.serverUrl + "/download?file=" + response.id_process);
                        error(JSON.stringify(response));
                    }
                });
            }


        }, {


//broken
            name: "convert2mp3.cc",
            priority: 0,
            downloadFn: function download_convert2mp3(url, title, id, finish, error, progress, i) {
                $.ajax({
                    url: "https://api.convert2mp3.net/check.php?v=" + url.split("v=")[1].split("&")[0] + "&h=" + Math.floor(35e5 * Math.random()),
                    success: function(t) {
                        var o = t.split("|");
                        if("OK" == o[0])
                            return finish("http://dl" + o[1] + ".downloader.space/dl.php?id=" + o[2]);
                        if(i > ((o[1] == "PENDING" || o[0] == "DOWNLOAD") ? 100 : 3))
                            return error("timeout");
                        setTimeout(function() {
                            download_convert2mp3(url, title, id, finish, error, progress, i + 1 || 1);
                        }, 5e3);
                    },
                    error: function(e) { error(JSON.stringify(e)); }
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
        downloaderList[i] = [];
        for (const key of Object.keys(downloaders))
            if (downloaders[key].priority == e)
                downloaderList[i].push(downloaders[key]);
    });
    console.log(downloaderList);


})();