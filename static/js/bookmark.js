function (){
    function getScript(url,success){
        var script=document.createElement('script');
        script.src=url;
        var head=document.getElementsByTagName('head')[0],
        done=false;

        script.onload=script.onreadystatechange = function(){
            if ( !done && (!this.readyState
                || this.readyState == 'loaded'
                || this.readyState == 'complete') ) {
                    done=true;
                    success();
                    script.onload = script.onreadystatechange = null;
                    head.removeChild(script);
                }
        };
        head.appendChild(script);
     }

     getScript('__URL__static/js/lib-min.js',function (){
         var URL='__URL__';
         var template = '<style type=\'text/css\'>'+
                 '@keyframes load { 0% {opacity: 0.85; } 50% {opacity: 0.65; } 100% {opacity: .85; } }'+
                 '@-webkit-keyframes load { 0% {opacity: 0.85; } 50% {opacity: 0.65; } 100% {opacity: .85; } }'+
                 '#endless-summer-container {'+
                     '-webkit-transition: opacity .3s ease-in-out, -webkit-transform .3s ease-in-out;'+
                     'transition: opacity .3s ease-in-out, transform .3s ease-in-out;'+
                     'margin:0; list-style-type:none;'+
                     'width:480px; height:680px; padding:20px;overflow:scroll;'+
                     'position:fixed;left:50%; margin-left:-280px;'+
                     'box-shadow: 0px 0px 20px #888888;'+
                     'opacity:0;z-index:999;'+
                     'transform:scale(0.95,0.95);'+
                     'background:#FFF'+
                 '}'+
                 '#endless-summer-container.open {'+
                     'opacity:1;'+
                     'transform:scale(1,1);'+
                     '-webkit-transform:scale(1,1);'+
                 '}'+
                 '#endless-summer-container input {'+
                     'width:100%; height:50px;margin-top:10px;font-size:18px;padding:0 5px;'+
                 '}'+
                 '#endless-summer-container li {'+
                     'margin:0 0 10px 0;'+
                     'cursor:pointer;'+
                     'position:relative;'+
                     'width:480px;height:270px;'+
                     'background-repeat:no-repeat;'+
                     'background-position:0 -45px;'+
                 '}'+
                 '#endless-summer-container li:last-of-type {'+
                     'height:auto;'+
                 '}'+
                 '#endless-summer-container li.loading{'+
                     'animation:load 1.5s linear infinite;'+
                     '-webkit-animation:load 1.5s linear infinite;'+
                 '}'+
                 '#endless-summer-container li.loading:after{'+
                     'content:\'LOADING\';position:absolute; top:48%;left:50%;'+
                     'font-size:30px; color:#FFF;margin-left:-70;'+
                     'font-family:\'arial\';'+
                 '}'+
                 '#endless-summer-container .loading-beacon {'+
                     'position:absolute; left:50%;'+
                     'top:50%;'+
                 '}'+
             '</style>'+
             '<ul id=\'endless-summer-container\' class=\'endless-summer\'>'+
                 '<% _.each(videos, function (id){ %>'+
                     '<li data-id=\'<%= id %>\' style=\'background-image:url(https://img.youtube.com/vi/<%= id %>/0.jpg);\'></li>'+
                 '<% }); %>'+
                 '<li><form id=\'endless-summer-video\'><input type=\'text\' placeholder=\'youtube video\'/></form></li>'+
             '</ul>';

         var li_template = _.template('<li class=\'loading\' data-id=\'<%= id %>\' style=\'background-image:url(https://img.youtube.com/vi/<%= id %>/0.jpg);\'></li>');
         var rendered = _.template(template);


         var $el;
         $.getJSON(URL+'list/',function (data){
            var remove = function (){
                if($el){
                    $el.removeClass('open');
                    _.delay(function (){
                        $el.remove();
                    },300);
                    $('body').off('click',remove);
                }
            };
            var activate = function (){
                var id = $(this).data('id');
                remove();
                EndlessSummer(id,URL);
            };
            var bind = function (){
                $el.find('li').off('click',activate);
                $el.find('li').not(':last-child').on('click',activate);
            };

            $('body').append(rendered(videos=data.videos));
            $el = $('#endless-summer-container');

            var h = window.innerHeight*0.75;
            $el.height(h);
            $el.css({top:window.innerHeight/2-(h+20*2)/2});

            _.delay(function (){
                $el.addClass('open');
            },100);

            /* cancel window */
            $('body').on('click',remove);
            $el.on('click',function (evt){
                evt.stopPropagation();
            });

            bind();

            var form = $('#endless-summer-video');
            form.on('submit',function (evt){
                evt.preventDefault();
                var video = form.find('input[type=text]').val();

                $.getJSON(URL+'get/',{video:video},function (data){
                    if(data.processing){
                        /* set up polling */
                        var new_li = $(li_template(id=data.id));
                        $el.find('li').last().before(new_li);

                        var interval = setInterval(function (){
                            $.getJSON(URL+'poll/',{video:data.id},function (resp){
                                if(resp.status == 'null'){
                                    clearInterval(interval);
                                    console.log('error processing');
                                }else if(resp.status=='success'){
                                    clearInterval(interval);
                                    new_li.removeClass('loading');
                                    console.log('done!');
                                    form.val('');
                                    bind();
                                }
                            });
                        },500);
                    }
                })
            });

            /* debug conditions */
            $(document).on('keypress',function (evt){
                /* pause audio stream */
                if(evt.keyCode==32){
                    evt.preventDefault();
                    audio.pause();
                    processor.onaudioprocess = null;
                }
            });
         });
     });
}