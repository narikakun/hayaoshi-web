function joinRoom() {
    let nick = document.getElementById("nickname");
    if (nick.value) settings.user.name = nick.value;
    let roomKey = document.getElementById("room-key");
    if (!roomKey) {
        statusMsg("ルームキーを入力してください。");
        swal("不足しています", "ルームキーが不足しています。ルームキーを入力してください。", "error");
        return;
    }
    settings.room.key = roomKey.value;
    settings.joined = true;
    document.getElementById("headerName").innerText = settings.user.name;
    ws.send(JSON.stringify({"auth":String(settings.user.id), "passwd":String(Math.floor( Math.random() * (99999 + 1 - 11111) ) + 11111)}));
    settings.joinList.push({name: settings.user.name, id: settings.user.id, point: 0});
    swal("成功", "参加に成功しました。", "success");
    listUpdate();
}

function statusMsg (msg) {
    document.getElementById( "statusMsg" ).textContent = msg;
}

function listUpdate () {
    let listHtml = `<li class="nav-item"><p class="nav-link">`;
    for (const joinListKey in settings.joinList) {
        listHtml += `${settings.joinList[joinListKey].name} (${settings.joinList[joinListKey].point})</p></li><li class="nav-item"><p class="nav-link">`;
    }
    listHtml+=`</p></li>`;
    document.getElementById("playerList").innerHTML = listHtml;
}

function startGame () {
    statusMsg(`ゲームが開始しました`)
    settings.started = true;
    settings.gameMaster = settings.user.id;
    document.getElementById("wait").style = "display: none;";
    document.getElementById("game").style = "display: block;";
    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"gameStart", "name":settings.user.name}));
    questionGo();
    let nowDate = new Date();
    setInterval(()=>{
        if (!settings.inputNow) {
            let nokori = 10000-(new Date().getTime() - nowDate.getTime());
            document.getElementById("timer").innerText = Math.floor(nokori / 1000);
            ws.send(JSON.stringify({
                "toH": settings.room.key,
                "sendtype": "nokori",
                "name": settings.user.name,
                "nokori": Math.floor(nokori / 1000)
            }));
        }
    }, 1000);
    setInterval(()=>{
        if (!settings.inputNow) {
            questionGo();
            nowDate = new Date();
        }
    }, 10000);
}

let selectQuestion = null;

function questionGo () {
    document.getElementById("ans").value = "";
    settings.inputNow = false;
    statusMsg(`新しい問題を出しました`);
    selectQuestion = questions[Math.floor(Math.random() * questions.length)];
    settings.selectQuestion = selectQuestion;
    let q = selectQuestion.q;
    document.getElementById("qu").innerText = q;
    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"question", "name":settings.user.name, "question": q}));
}

let interval = null;

function buttonA () {
    let nowDate = new Date();
    statusMsg(`あなたがボタンを押しました`);
    document.getElementById("ans").value = "";
    document.getElementById("qubu").style = "display: none;";
    document.getElementById("an").style = "display: block;";
    document.getElementById("other_an").style = "display: none;";
    document.getElementById("other_an_a").innerText = name;
    settings.inputNow = true;
    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"ans", "name":settings.user.name}));
    settings.nowKaito = settings.user.id;
    interval = setInterval(() => {
        if (!settings.inputNow) clearInterval(interval);
        let nokori = 10000-(new Date().getTime() - nowDate.getTime());
        statusMsg(`残り${Math.floor(nokori/1000)}秒`);
        ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"nokori", "name":settings.user.name, "nokori": Math.floor(nokori/1000)}));
        if (nokori / 1000 < 0) {
            settings.inputNow = false;
            ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"ansEnd", "name":settings.user.name}));
            ansEndStyle();
            if (settings.user.id == settings.gameMaster) {
                questionGo();
            }
            clearInterval(interval);
        }
    }, 1000);
}

function inputA () {
    if (settings.inputNow) {
        let value = document.getElementById("ans").value;
        ws.send(JSON.stringify({
            "toH": settings.room.key,
            "sendtype": "inputA",
            "name": settings.user.name,
            "text": document.getElementById("ans").value
        }));
        if (settings.user.id == settings.gameMaster) {
            if (value == selectQuestion.a) {
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
                ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"ansEnd", "name":settings.user.name}));
                clearInterval(interval);
                questionGo();
            }
        }
    }
}

function addPoint (userId) {
    let filter = settings.joinList.filter(f => f.id == userId)[0];
    let filter2 = settings.joinList.filter(f => f.id !== userId);
    if (filter) {
        filter.point = filter.point + 1;
        filter2.push(filter);
    }
    return filter2;
}

function ansEndStyle () {
    document.getElementById("qubu").style = "display: block;";
    document.getElementById("an").style = "display: none;";
    document.getElementById("other_ans").value = "";
    document.getElementById("ans").value = "";
    document.getElementById("other_an").style = "display: none;";
}