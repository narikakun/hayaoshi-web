let ws;
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
                    return;
                }
            }
            if (data.leftHub) {
                if (data.user == settings.gameMaster) {
                    statusMsg("ゲームマスターが抜けたためゲームが終わりました");
                    ws.send(JSON.stringify({"leaveHub": settings.room.key}))
                }
                joinList = joinList.filter(f => f.id !== data.user);
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
                            if (!joinList.filter(f => f.id == data.FROM)[0]) joinList.push({
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
                        if (!joinList.filter(f => f.id == data.FROM)[0]) joinList.push({
                            name: data.name,
                            id: data.FROM,
                            point: 0
                        });
                        listUpdate();
                        break;
                    case "alreadyStarted":
                        if (!settings.started) {
                            statusMsg(`すでにゲームが開始されているため、参加できません`);
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
                        let nameArray = joinList.filter(f => f.id == data.FROM)[0];
                        let name = data.FROM;
                        if (nameArray.name) name = nameArray.name;
                        settings.inputNow = true;
                        statusMsg(`${name}がボタンを押しました`);
                        document.getElementById("qubu").style = "display: none;";
                        document.getElementById("an").style = "display: none;";
                        document.getElementById("other_an_a").innerText = name;
                        document.getElementById("other_an").style = "display: block;";
                        break;
                    case "inputA":
                        document.getElementById("other_ans").value = data.text;
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
                }
            }
            if (data.error) {
                statusMsg(`エラーが発生しました`);
                console.error(data.error);
                return;
            }
        };

        //切断
        ws.onclose = function() {
            if (settings.er_msg) return;
            statusMsg(`サーバーから切断されました`);
        };
    };

    //エラー発生
    ws.onerror = function(error) {
        console.error(error);
        statusMsg(`エラーが発生しました`);
    };
};