var test = 'zmPzbZVUp3g';
var value = 0;
var filter_width=9;
var avg = [];
var _data = [];
var labels = [];
var idx = 0;
var audio;
var LOG = true;
var min=0,
    max=0,
    opts=null,
    ctx2=null,
    lastin=0;


var accum=0;
var vel=0;
var drag = -0.03
var mass = 3;

var DEBUG;


window.requestAnimFrame = function(){
    return (
        window.webkitRequestAnimationFrame ||
            window.requestAnimationFrame       ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback){
                return window.setTimeout(callback, 16);
            }
    );
}();
window.closeAnimFrame = function (){
    return   (
        window.webkitCancelAnimationFrame||
            window.cancelAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.mozCancelAnimationFrame ||
            window.msCancelAnimationFrame ||
            function(interval){
                return window.clearTimeout(interval);
            }
    );
}();

function five_pt_smooth(i){
    return (i[0] + i[1]*2 + i[2]*3 + i[3]*2 + i[4])/9;
}
function seven_pt_smooth(i){
    return (i[0] + i[1]*3 + i[2]*6 + i[3]*7 + i[4]*6 + i[5]*3 + i[6])/49;
}
function nine_pt_smooth(i){
    return (i[0] + i[1]*9 + i[2]*17 + i[3]*25 + i[4]*33 + i[5]*25 + i[6]*17 + i[7]*9 + i[8])/81;
}
function eleven_pt_smooth(i){
    return (i[0] + i[1]*11 + i[2]*21 + i[3]*31 + i[4]*41 + i[5]*51 + i[6]*41 + i[7]*31 + i[8]*21 + i[9]*11 + i[10])/121; 
}

$(function (){
     DEBUG = $('#debug');
    $.getJSON('/get/'+test, function (data){
        if(data.status == 'success'){
            var ctx = new webkitAudioContext();
            var url = data.file;
            
            ctx2 = document.getElementById("myChart").getContext("2d");
            opts = {
                scaleShowLabels:false,
                pointDotRadius : 1,
                animation:false,
                scaleOverride:true,
                scaleSteps:60,
                scaleStepWidth:1,
                scaleStartValue:0,
                showTooltips:false,
                scaleShowLabels:false,
                showScale:false};
            
            audio = new Audio(url);
            // 2048 sample buffer, 1 channel in, 1 channel out
            var processor = ctx.createScriptProcessor(2048, 1, 1);
            var meter = document.getElementById('meter');
            var source;
            
            audio.addEventListener('canplaythrough', function(){
                source = ctx.createMediaElementSource(audio)
                source.connect(processor)
                source.connect(ctx.destination)
                processor.connect(ctx.destination)
                audio.play()
            }, false);

            // loop through PCM data and calculate average
            // volume for a given 2048 sample buffer
            processor.onaudioprocess = function(evt){
                var input = evt.inputBuffer.getChannelData(0)
                  , len = input.length
                  , total = i = 0
                  , rms
                while ( i < len ) total += Math.abs( input[i++] );
                rms = Math.sqrt( total / len );

                if( avg.length >= filter_width ){
                    avg.shift();
                    avg.push(rms);
                    
    
                    /*value = _.reduce(avg,function (m,n){return m+n;})/filter_width;*/
                    //value = smooth(avg);
                    //value = rms;
                    switch(filter_width){
                        case 5:
                            value = five_pt_smooth(avg);
                            break;
                        case 7:
                            value = seven_pt_smooth(avg);
                            break;
                        case 9:
                            value = nine_pt_smooth(avg);
                            break;
                        case 11:
                            value = eleven_pt_smooth(avg);
                            break;
                    }
                    
                    if(min==0)min=value;
                    if(value < min-5 || value > min+5) min += value + min / 2;
                    
                    //meter.style.width = ( value * 100 ) + '%';
                    var amnt = 100;
                    var skip = 0;
                    var inter = 1;
                    
                    if((LOG && idx%inter==0)){
                        var input = (value-min) * 100;
                        if(input-lastin > 1.0){
                            accum += (input-lastin);
                        }
                        lastin=input;
                        _data.push(input>=1?input:0);
                        labels.push( idx++ );
                        //if(idx > skip+amnt){
                            if(idx > amnt){
                                _data = _data.slice(1);
                                labels = labels.slice(1);
                            }
                            //audio.pause();
                            var d = {
                                labels: labels,
                                datasets: [
                                    {
                                        label: "",
                                        fillColor: "rgba(220,220,220,0.85)",
                                        strokeColor: "rgba(220,220,220,1)",
                                        pointColor: "rgba(220,220,220,1)",
                                        pointStrokeColor: "#fff",
                                        pointHighlightFill: "#fff",
                                        pointHighlightStroke: "rgba(220,220,220,1)",
                                        data: _data
                                    }
                                ]
                            }
                            var myNewChart = new Chart(ctx2).Line(d,opts);
                            //processor.onaudioprocess = null;
                        //}
                    }else{ 
                        idx++;
                    }
                }else{ 
                    avg.push(rms);
                }
            }

            if(!LOG || true){
                var anim = function (){
                    if((value-min)*100 >= 1)
                        window.scrollBy(0, Math.floor(accum));
                        vel = (drag * accum)/mass;
                        accum += vel;
                        DEBUG.html(accum.toFixed(3));
                                             
                    window.requestAnimFrame(anim);
                };
                anim();
            }
        }
        
        $(document).on('keypress',function (){
            audio.pause();
            processor.onaudioprocess = null;
        })
    });

});