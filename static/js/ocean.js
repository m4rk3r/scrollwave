EndlessSummer = {
    avg : [],
    chart_data : [],
    labels : [],
    idx : 0,
    LOG : true,
    min:99999,
    max:0,
    opts:null,
    ctx2:null,
    ctx3:null,
    lastin:0,
    THRESHOLD : 0.20,
    chart : null,
    wavemax : 0,

    /* physics */
    accum:0,
    vel:0,
    drag: -0.99,
    mass: 100,

    SCALER: 100,
    DELTA_SCALE: 1.5,
    FILTER_WIDTH:9,

    $w: $(window),
    $body: $('body'),

    opts: {
        scaleShowLabels:false,
        pointDotRadius : 1,
        animation:false,
        scaleOverride:true,
        scaleSteps:60,
        scaleStepWidth:1,
        scaleStartValue:0,
        showTooltips:false,
        scaleShowLabels:false,
        showScale:false
    },

    init: function (id,url){
        this.video = typeof id=="undefined"?'zmPzbZVUp3g':id;
        this.URL = url;

        $('body').append(
            "<style type='text/css'>"+
            "canvas {position:fixed;left:0;top:0;background:rgba(50,50,50,0.75);padding:25px;}"+
            "#debug {position:fixed;top:0;left:0;padding:20px;background-color:rgba(25,25,25,0.75);color:#FFF;}"+
            "</style>"+
            "<canvas id='myChart' width='400' height='200'></canvas>"+
            "<canvas id='info' width='400' height='200'></canvas>"+
            "<div id='debug'>30.00</div>"
        );
        this.DEBUG = $('#debug');

        if(!this.LOG){
            this.DEBUG.hide();
            $('#info').hide();
            $('#myChart').hide();
        }

        this.load();
        this.animate();
    },

    filter: function (i) {
        return (i[0] + i[1]*9 + i[2]*17 + i[3]*25 + i[4]*33 + i[5]*25 + i[6]*17 + i[7]*9 + i[8])/81;
    },

    load: function (){
        var self=this;
        _req(this.URL+'get/',{video:this.video},function (data){
            self.run(data);
        });
    },

    _debug: function (_ctx){
        _ctx.clearRect(0,0,400,200);
        var r = 200/60;
        _ctx.beginPath();
            _ctx.strokeStyle='red';
            _ctx.moveTo(0,200-(this.min*this.SCALER) * r);
            _ctx.lineTo(400,200-(this.min*this.SCALER) * r);
            _ctx.stroke();
        _ctx.closePath();

        _ctx.beginPath();
            _ctx.strokeStyle='orange';
            _ctx.moveTo(0,200-(this.cmin*this.SCALER) * r);
            _ctx.lineTo(400,200-(this.cmin*this.SCALER) * r);
            _ctx.stroke();
        _ctx.closePath();

        _ctx.beginPath();
            _ctx.strokeStyle='green';
            _ctx.moveTo(0,200-(this.max*this.SCALER) * r);
            _ctx.lineTo(400,200-(this.max*this.SCALER) * r);
            _ctx.stroke();
        _ctx.closePath();
    },

    run: function (data){
        if(data.status == 'success'){
            var ctx = new webkitAudioContext();
            var url = data.file;
            var ctx2 = document.getElementById("myChart").getContext("2d");
            var ctx3 = document.getElementById("info").getContext("2d");

            this.audio = new Audio(url);
            this.processor = ctx.createScriptProcessor(2048, 1, 1);

            var self = this;
            this.audio.addEventListener('canplaythrough', function(){
                self.source = ctx.createMediaElementSource(self.audio)
                self.source.connect(self.processor)
                self.source.connect(ctx.destination)
                self.processor.connect(ctx.destination)
                self.audio.play()
            }, false);

            this.processor.onaudioprocess = function(evt){
                var input = evt.inputBuffer.getChannelData(0)
                  , len = input.length
                  , total = i = 0
                  , rms
                  , value;
                while ( i < len ) total += Math.abs( input[i++] );
                rms = Math.sqrt( total / len );

                if( self.avg.length >= self.FILTER_WIDTH ){
                    self.avg.shift();
                    self.avg.push(rms);

                    value = self.filter(self.avg);

                    self.max = Math.max(self.max,value);
                    self.min = Math.min(self.min,value);

                    if(self.min===99999)self.min=value;

                    self.cmin = self.max * self.THRESHOLD + self.min;

                    if(self.LOG)
                        self._debug(ctx3);

                    var chart_sample = 100;
                    var skip = 0;
                    var inter = 1;
                    var color;

                    var input = value * self.SCALER;
                    if(value > self.cmin && input > self.lastin){
                        color = 'green';
                        self.accum += (input-self.lastin) * self.DELTA_SCALE;
                    }else{
                        color = 'red';
                    }

                    self.lastin=input;

                    if(self.LOG){
                        self.chart_data.push(input>=1?input:0);
                        self.labels.push( self.idx++ );
                        if(self.idx > chart_sample){
                            self.chart_data = self.chart_data.slice(1);
                            self.labels = self.labels.slice(1);
                        }
                        var d = {
                            labels: self.labels,
                            datasets: [
                                {
                                    label: "",
                                    fillColor: "rgba(220,220,220,0.85)",
                                    strokeColor: "rgba(220,220,220,1)",
                                    pointColor: "rgba(220,220,220,1)",
                                    pointStrokeColor: color,
                                    pointHighlightFill: color,
                                    pointHighlightStroke: "rgba(220,220,220,1)",
                                    data: self.chart_data
                                }
                            ]
                        }
                        if(self.chart === null){
                            self.chart = new Chart(ctx2);
                            self.chart.Line(d,self.opts);
                        }else{
                            self.chart.Line(d,self.opts);
                        }
                    }
                }else{
                    self.avg.push(rms);
                }
            }
        }else{
            console.log('request failed..');
        }
    },

    kill: function (){
        $('#myChart').remove();
        $('#info').remove();
        this.DEBUG.remove();
        $('#endless-summer-container').remove();
        this.audio.pause();
        this.processor.onaudioprocess = null;
        window.cancelAnimationFrame(this.handle);
    },

    animate: function (){
        var self = this;
        function loop(){
            self.handle = window.requestAnimationFrame(loop);
            window.scrollBy(0, self.accum + 0.5 << 0);

            self.vel = (self.drag * self.accum)/self.mass;
            self.accum += self.vel;
            self.DEBUG.html('m: '+self.mass+' / d: '+self.drag+' a: '+self.accum.toFixed(3));

            self.wavemax = Math.max(self.wavemax,self.accum);

            if(self.wavemax > 0 && self.accum < 20){
                self.accum -= (self.wavemax * .008);
                self.wavemax *= 0.99;
            }

            if(self.$w.scrollTop() >= self.$body.height()-window.innerHeight*1.5){
                window.scrollTo(0,0);
            }
        }
        window.requestAnimationFrame(loop);
    }
}