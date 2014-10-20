from os.path import join
from re import sub

from rjsmin import jsmin
from settings import URL

js = 'static/js/'

#####
# Build bookmarklet launcher code
###
file = open(join(js,'bookmark.js'),'r').read()
output = open(join(js,'compiled.js'),'w')
bookmrk = 'javascript:('+jsmin(file)+')();';
bookmrk = sub(r'__URL__',URL,bookmrk)
output.write(bookmrk);
output.close()

#####
# Build EndlessSummer library
###
ocean = open(join(js,'ocean.js'),'r').read()
ocean_output = open(join(js,'ocean-min.js'),'w')
ocean_output.write( jsmin( ocean ))
ocean_output.close()


#####
# Compile lib.js
###
lib = open(join(js,'lib-min.js'),'w')
lib_files = ['lib/jquery-min.js','lib/underscore-min.js','lib/chart-min.js','ocean-min.js']
#lib.write('# -*- coding: utf-8 -*-\n\n')
for file in lib_files:
    data = open(join(js,file),'r').read()
    lib.write('// '+file+'\n\n'+data+'\n\n')
lib.close()


html = '<html><head></head><body><a href="%s">test</a><BR><BR><div id="result"></div></body></html>'
html_file = open('templates/test.html','w')
html_file.write(html % bookmrk)
html_file.close()