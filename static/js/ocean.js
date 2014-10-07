var test = 'zmPzbZVUp3g';

var value = 0;
var filter_width=9;
var avg = [];

var chart_data = [];
var labels = [];
var idx = 0;
var audio;
var LOG = true;
var min=99999,
    max=0,
    opts=null,
    ctx2=null,
    ctx3=null,
    lastin=0,
    processor,
    THRESHOLD = 0.20;


var accum=0;
var vel=0;
var drag = -0.99;
var mass = 100;

var DEBUG;
var SCALER = 100;
var DELTA_SCALE = 3;

/* noise reduction */
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

function easeInOutQuad(t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t + b;
    return -c/2 * ((--t)*(t-2) - 1) + b;
}

$(function (){
    /* dynamic values keybindings */
    $('#mass').on('keyup',function (){
        var val = parseFloat($(this).val());
        mass = isNaN(val)?0.9:Math.max(val,1);
        console.log('set mass to: '+mass);
    }).val(mass);
    $('#drag').on('keyup',function (){
        var val = parseFloat($(this).val());
        drag = isNaN(val)?1:val;
        console.log('set drag to: '+drag);
    }).val(drag)
    
    
    DEBUG = $('#debug');
    
    $.getJSON('/get/'+test, function (data){
        
        if(data.status == 'success'){
            var ctx = new webkitAudioContext();
            var url = data.file;
            
            ctx2 = document.getElementById("myChart").getContext("2d");
            ctx3 = document.getElementById("info").getContext("2d");
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
            processor = ctx.createScriptProcessor(2048, 1, 1);
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
                    
                    max = Math.max(max,value);
                    min = Math.min(min,value);

                    if(min===99999)min=value;
                    //if(value < (max * .15 + min)) min = (value + min) / 2;

                    cmin = max * THRESHOLD + min;
                    
                    
                    ctx3.clearRect(0,0,400,200);
                    
                    r = 200/60;
                    
                    ctx3.beginPath();
                        ctx3.strokeStyle='red';
                        ctx3.moveTo(0,200-(min*SCALER) * r);
                        ctx3.lineTo(400,200-(min*SCALER) * r);
                        ctx3.stroke();
                    ctx3.closePath();
                    
                    ctx3.beginPath();
                        ctx3.strokeStyle='orange';
                        ctx3.moveTo(0,200-(cmin*SCALER) * r);
                        ctx3.lineTo(400,200-(cmin*SCALER) * r);
                        ctx3.stroke();
                    ctx3.closePath();
                        
                    ctx3.beginPath();
                        ctx3.strokeStyle='green';
                        ctx3.moveTo(0,200-(max*SCALER) * r);
                        ctx3.lineTo(400,200-(max*SCALER) * r);
                        ctx3.stroke();
                    ctx3.closePath();
                    
                    var chart_sample = 100;
                    var skip = 0;
                    var inter = 1;
                    
                    if(LOG){
                        var input = value * SCALER;//(value-min)*SCALER;
                        var color;
                        if(value > cmin && input > lastin){
                            color = 'green';
                            accum += (input-lastin) * DELTA_SCALE;
                        }else{
                            color = 'red';
                        }
                        
                        lastin=input;
                        
                        chart_data.push(input>=1?input:0);
                        labels.push( idx++ );
                        if(idx > chart_sample){
                            chart_data = chart_data.slice(1);
                            labels = labels.slice(1);
                        }
                        var d = {
                            labels: labels,
                            datasets: [
                                {
                                    label: "",
                                    fillColor: "rgba(220,220,220,0.85)",
                                    strokeColor: "rgba(220,220,220,1)",
                                    pointColor: "rgba(220,220,220,1)",
                                    pointStrokeColor: color,//"#fff",
                                    pointHighlightFill: color,//"#fff",
                                    pointHighlightStroke: "rgba(220,220,220,1)",
                                    data: chart_data
                                }
                            ]
                        }
                        var myNewChart = new Chart(ctx2).Line(d,opts);   
                    }
                }else{ 
                    avg.push(rms);
                }
            }
        }
    });
    
    var wavemax = 0;
    var receeding = false;
    var recess = 0;
    var anim = function (){
        window.scrollBy(0, accum + 0.5 << 0);
        
        vel = (drag * accum)/mass;
        accum += vel;
        DEBUG.html('m: '+mass+' / d: '+drag+' a: '+accum.toFixed(3));
        
        wavemax = Math.max(wavemax,accum);
        
        if(wavemax > 0 && accum < 10){// && recess < 1){
            //receeding = true;
            accum -= (wavemax * .009);
            wavemax *= 0.99;
        }
                             
        if($(window).scrollTop() >= $('body').height()-window.innerHeight*1.5){
            window.scrollTo(0,0);
        }
                                 
        window.requestAnimationFrame(anim);
    };  
    window.requestAnimationFrame(anim);
    
    $(document).on('keypress',function (evt){
        /* pause audio stream */
        if(evt.keyCode==32){ 
            evt.preventDefault();
            audio.pause();
            processor.onaudioprocess = null;
            
            //accum += 10;
        }
    });
});