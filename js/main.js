function joinRoom() {
    let nick = document.getElementById("nickname");
    if (nick.value) settings.user.name = nick.value;
    let roomKey = document.getElementById("room-key");
    if (!roomKey) return statusMsg("ルームキーを入力してください。");
    settings.room.key = roomKey.value;
    settings.joined = true;
    document.getElementById("headerName").innerText = settings.user.name;
    ws.send(JSON.stringify({"auth":String(settings.user.id), "passwd":String(Math.floor( Math.random() * (99999 + 1 - 11111) ) + 11111)}));
    joinList.push({name: settings.user.name, id: settings.user.id, point: 0});
    listUpdate();
}

function statusMsg (msg) {
    document.getElementById( "statusMsg" ).textContent = msg;
}

let joinList = [];

function listUpdate () {
    let listHtml = `<li class="nav-item"><p class="nav-link">`;
    for (const joinListKey in joinList) {
        listHtml += `${joinList[joinListKey].name} (${joinList[joinListKey].point})</p></li><li class="nav-item"><p class="nav-link">`;
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

function questionGo () {
    settings.inputNow = false;
    statusMsg(`新しい問題を出しました`);
    let q = `お菓子食べたいな`;
    document.getElementById("qu").innerText = q;
    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"question", "name":settings.user.name, "question": q}));
}

function buttonA () {
    let nowDate = new Date();
    statusMsg(`あなたがボタンを押しました`);
    document.getElementById("qubu").style = "display: none;";
    document.getElementById("an").style = "display: block;";
    document.getElementById("other_an").style = "display: none;";
    document.getElementById("other_an_a").innerText = name;
    settings.inputNow = true;
    ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"ans", "name":settings.user.name}));
    let interval = setInterval(() => {
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
    if (settings.inputNow) ws.send(JSON.stringify({"toH":settings.room.key, "sendtype":"inputA", "name":settings.user.name, "text": document.getElementById("ans").value}));
}

function ansEndStyle () {
    document.getElementById("qubu").style = "display: block;";
    document.getElementById("an").style = "display: none;";
    document.getElementById("other_ans").value = "";
    document.getElementById("other_an").style = "display: none;";
}