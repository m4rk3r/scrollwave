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

     getScript('http://duskjacket.com/assets/js/jquery-1.7.min.js',function (){
         $.getJSON('/list/',function (data){
             conosole.log(data);

             alert('hi')
         })
     });
}