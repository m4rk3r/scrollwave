var has_listeners = false;
var page;
var previous_tab;
var active = false;
var port = null;
var DEBUG = true;

var libraries = [
    'jquery-1.11.1.min.js',
    'underscore-min.js',
    'chart.js',
    'glue.js',
    'ocean-min.js',
    'ui.js'
];

function req(qstring, uid){
    console.log('request: '+qstring)
    var xhr = new XMLHttpRequest();
    xhr.open("GET", qstring, true);
    xhr.onreadystatechange = function() {
      if ( xhr.readyState == 4 && port ) {
          port.postMessage( {type:'response',data:JSON.stringify(xhr.responseText), uid:uid} );
      }
    }
    xhr.send();
}


chrome.extension.onConnect.addListener(function (p) {
    console.log('glue.js connected')
    port = p;
    port.onMessage.addListener( function(msg) {
        console.log(msg)
        switch(msg.type){
            case 'request':
                console.log('request: '+msg.url)
                req( msg.url, msg.uid );
            break;
        }
    });
});


function on_load(data){
    if(active && previous_tab == data.tabId && data.frameId == 0 ){
        for(var i =0; i < libraries.length; i++)
            chrome.tabs.executeScript(previous_tab, {file: libraries[i] });
    }
}

function tab_replace(data){
    if( previous_tab == data.replacedTabId) previous_tab = data.tabId;
}

chrome.browserAction.onClicked.addListener(function (tab) {
    if(!active){
        if(!has_listeners){
            has_listeners=true;
            chrome.webNavigation.onCompleted.addListener( on_load );
            chrome.webNavigation.onTabReplaced.addListener( tab_replace );
        }

        // activate icon
        chrome.browserAction.setIcon({path: 'iconactive.png'});

        for(var i =0; i < libraries.length; i++){
            console.log('loading: '+libraries[i])
            chrome.tabs.executeScript(tab.id, {file: libraries[i] });
        }

        previous_tab = tab.id;
        active = true;
    }else{
        // turn off
        active = false;
        chrome.browserAction.setIcon({path: 'icon.png'});
        try{
            if( port ) port.postMessage( {kill:true} )
        }catch(err){
            console.log(err);
        }
    }
});


chrome.tabs.onRemoved.addListener(function(tabId){
    if(active && tabId == previous_tab){
        chrome.browserAction.setIcon({path: 'icon.png'});
        active=false;
    }
});