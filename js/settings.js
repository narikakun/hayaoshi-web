let settings = {
    ws: {
        url: "wss://cloud.achex.ca/n-hayaoshi-web"
    },
    user: {
        name: Math.floor( Math.random() * (9999 + 1 - 1111) ) + 1111,
        id: Math.floor( Math.random() * (99999 + 1 - 11111) ) + 11111
    },
    room: {},
    last_ping: new Date().getTime(),
    er_msg: false,
    started: false,
    gameMaster: null,
    joined: false,
    inputNow: false,
    joinList: []
}