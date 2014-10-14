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

     getScript('http://localhost:5000/static/js/lib/lib.js',function (){
         var template = '<style type=\'text/css\'>'+
                 '#endless-summer-container {'+
                 '-webkit-transition: opacity .3s ease-in-out;'+
                 'transition: opacity .3s ease-in-out;'+
                 'margin:0; list-style-type:none;'+
                 'width:480px; height:720px; padding:20px;overflow:scroll;'+
                 'position:absolute;left:50%; margin-left:-280px; top:50%;'+
                 'margin-top:-380px; box-shadow: 0px 0px 20px #888888;'+
                 'opacity:0;z-index:999;'+
                 '}'+
                 '.open {'+
                 'opacity:1 !important;'+
                 '}'+
                 'input {'+
                 'width:100%; height:50px;margin-top:10px;font-size:18px;'+
                 '}'+
                 'li {'+
                 'margin:0 0 10px 0;'+
                 '}'+
             '</style>'+
             '<ul id=\'endless-summer-container\'>'+
                 '<% _.each(videos, function (url){ %>'+
                     '<li>'+
                         '<img src=\'http://img.youtube.com/vi/<%= url %>/0.jpg\'>'+
                     '</li>'+
                 '<% }); %>'+
                 '<li><form id=\'endless-summer-video\'><input type=\'text\' /></form></li>'+
             '</ul>';

         var li_template = _.template('<li><img src=\'http://img.youtube.com/vi/<%= id %>/0.jpg\'></li>');
         var rendered = _.template(template);

         $el = $('#endless-summer-container');

         $.getJSON('/list/',function (data){
            var remove = function (){
                if($el){
                    $el.removeClass('open');
                    _.delay(function (){
                        $el.remove();
                    },300);
                    $('body').off('click',remove);
                }
            };

            $('body').append(rendered(videos=data.videos));

            _.delay(function (){
                $el.addClass('open');
            },100);

            //$('body').on('click',remove);

            var form = $('#endless-summer-video');
            form.on('submit',function (evt){
                evt.preventDefault();
                var video = form.find('input[type=text]').val();

                $.getJSON('/get/',{video:video},function (data){
                    if(data.processing){
                        /* set up polling */
                        var new_li = li_template(data.id);
                        new_li.addClass('processing');
                        $el.append(new_li);
                    }
                })
            })
         });
     });
}