/*
    wrapper for extension that glues endlessummer compontents
    to the chrome extension layout
*/

var response_map = {};
var endproc;
var es;

var port = chrome.extension.connect({name: "datapipe-endless-summer"});
port.onMessage.addListener(function(msg) {
    if( msg.kill ){
        es.kill()
    }else if(msg.type == 'response'){
        var data = JSON.parse(JSON.parse( msg.data ));
        response_map[msg.uid](data);
        delete response_map[msg.uid];
    }
});


function make_uid(){
    var uid = '';
    for(i=0;i<10;i++) uid += String.fromCharCode(Math.round(Math.random() * 25) + 97);
    return uid;
}


function _req(url, data, callback){
    url = url + (typeof data !== 'undefined' && $.param(data).length > 0 ?'?'+$.param(data):'');
    var uid = make_uid();
    response_map[uid] = callback;
    port.postMessage({msg:'_req called!'});
    port.postMessage({type:'request',url:url, uid:uid });
}

