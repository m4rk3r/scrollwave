var test = 'zmPzbZVUp3g';
var value = 0;

$(function (){
    $.getJSON('/get/'+test, function (data){
        if(data.status == 'success'){
            var ctx = new webkitAudioContext();
            var url = data.file;
            console.log(data.file)
            var audio = new Audio(url);
            // 2048 sample buffer, 1 channel in, 1 channel out
            var processor = ctx.createJavaScriptNode(2048, 1, 1);
            var meter = document.getElementById('meter');
            var source;
            var srms = 0;

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
                while ( i < len ) total += Math.abs( input[i++] )
                rms = Math.sqrt( total / len )
                value = (srms * 4 + rms)/5;
                meter.style.width = ( value * 100 ) + '%'
                //window.scrollBy(0, parseInt(srms*100))
              }

              (function anim(){
                   window.scrollBy(0, value*100);
                   window.requestAnimationFrame(anim);
              })();
        }
    })

})