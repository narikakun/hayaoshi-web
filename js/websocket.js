let ws;
let lastUp = new Date();
window.onload = function () {
    if (ws) return;
    // WebSocketサーバーに接続
    statusMsg("サーバーに接続中...")
    ws = new WebSocket(settings.ws.url);
    listUpdate();
    //接続通知
    ws.onopen = function(event) {
        statusMsg("サーバーに接続しました")
        //メッセージ受信
        ws.onmessage = function(event) {
            let data = JSON.parse(event.data);
            console.log(data);
            if (data.auth) {
                if (data.auth == "OK") {
                    ws.send(JSON.stringify({"joinHub": settings.room.key}))
                } else {
                    statusMsg("認証に失敗しました。");
                    swal("認証失敗", "認証に失敗しました。ページを再読み込みしてください。", "error");
                    return;
                }
            }
            if (data.joinHub) {
                if (data.joinHub == "OK") {
                    document.getElementById("welcome").style = "display: none;";
                    document.getElementById("wait").style = "display: block;";
                    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"join", "name":settings.user.name}));
                } else {
                    statusMsg("ルームへの参加に失敗しました。");
                    swal("参加失敗", "ルームへの参加に失敗しました。。ページを再読み込みしてください。", "error");
                    return;
                }
            }
            if (data.leftHub) {
                if (data.user == settings.gameMaster) {
                    statusMsg("ゲームマスターが抜けたためゲームが終わりました");
                    swal("強制終了", "ゲームマスターが抜けたためゲームが終了しました。", "error");
                    ws.send(JSON.stringify({"leaveHub": settings.room.key}));
                }
                settings.joinList = settings.joinList.filter(f => f.id !== data.user);
                listUpdate();
            }
            if (data.sendtype) {
                switch (data.sendtype) {
                    case "join":
                        if (settings.started) {
                            ws.send(JSON.stringify({
                                "toH": settings.room.key,
                                "sendtype": "alreadyStarted"
                            }));
                        } else {
                            statusMsg(`${data.name}が参加しました`);
                            ws.send(JSON.stringify({
                                "toH": settings.room.key,
                                "sendtype": "joinReply",
                                "name": settings.user.name
                            }));
                            if (!settings.joinList.filter(f => f.id == data.FROM)[0]) settings.joinList.push({
                                name: data.name,
                                id: data.FROM,
                                point: 0
                            });
                            listUpdate();
                        }
                        break;
                    case "joinReply":
                        statusMsg(`${data.name}が参加しました`);
                        ws.send(JSON.stringify({
                            "toH": settings.room.key,
                            "sendtype": "joinReplyOk",
                            "name": settings.user.name
                        }));
                        if (!settings.joinList.filter(f => f.id == data.FROM)[0]) settings.joinList.push({
                            name: data.name,
                            id: data.FROM,
                            point: 0
                        });
                        listUpdate();
                        break;
                    case "alreadyStarted":
                        if (!settings.started) {
                            statusMsg(`すでにゲームが開始されているため、参加できません`);
                            swal("参加負荷", "すでにゲームが開始されているため、参加できません。", "warning");
                            ws.send(JSON.stringify({"leaveHub": settings.room.key}))
                        }
                        break;
                    case "gameStart":
                        statusMsg(`ゲームが開始しました`);
                        settings.started = true;
                        document.getElementById("wait").style = "display: none;";
                        document.getElementById("game").style = "display: block;";
                        settings.gameMaster = data.FROM;
                        break;
                    case "question":
                        statusMsg(`問題が出されました`)
                        document.getElementById("qu").innerText = data.question;
                        break;
                    case "ans":
                        settings.nowKaito = data.FROM;
                        let nameArray = settings.joinList.filter(f => f.id == data.FROM)[0];
                        let name = data.FROM;
                        if (nameArray.name) name = nameArray.name;
                        settings.inputNow = true;
                        statusMsg(`${name}がボタンを押しました`);
                        document.getElementById("qubu").style = "display: none;";
                        document.getElementById("an").style = "display: none;";
                        document.getElementById("other_an_a").innerText = name;
                        document.getElementById("ans").innerText = "";
                        document.getElementById("other_an").style = "display: block;";
                        break;
                    case "inputA":
                        document.getElementById("other_ans").value = data.text;
                        if (settings.user.id == settings.gameMaster) {
                            if (document.getElementById("other_ans").value == settings.selectQuestion.a) {
                                if (new Date().getTime() - lastUp.getTime() > 1000) {
                                    lastUp = new Date();
                                    ansEndStyle();
                                    let addpoint = addPoint(settings.nowKaito)
                                    ws.send(JSON.stringify({
                                        "toH": settings.room.key,
                                        "sendtype": "omedetou",
                                        "name": settings.user.name,
                                        "list": addpoint
                                    }));
                                    settings.joinList = addpoint;
                                    listUpdate();
                                    ws.send(JSON.stringify({
                                        "toH": settings.room.key,
                                        "sendtype": "ansEnd",
                                        "name": settings.user.name
                                    }));
                                    clearInterval(interval);
                                }
                            }
                        }
                        break;
                    case "ansEnd":
                        ansEndStyle();
                        settings.inputNow = false;
                        if (settings.user.id == settings.gameMaster) {
                            questionGo();
                        }
                        break;
                    case "nokori":
                        document.getElementById("timer").innerText = data.nokori;
                        break;
                    case "omedetou":
                        settings.joinList = data.list;
                        listUpdate();
                        break;
                }
            }
            if (data.error) {
                statusMsg(`エラーが発生しました`);
                swal("エラー", "エラーが発生しました。", "error");
                console.error(data.error);
                return;
            }
        };

        //切断
        ws.onclose = function() {
            if (settings.er_msg) return;
            statusMsg(`サーバーから切断されました`);
            swal("エラー", "サーバーが切断されました。。", "error");
        };
    };

    //エラー発生
    ws.onerror = function(error) {
        console.error(error);
        statusMsg(`エラーが発生しました`);
        swal("エラー", "エラーが発生しました。", "error");
    };
};