from re import sub

from rjsmin import jsmin

file = open('static/js/bookmark.js','r').read()
output = open('static/js/compiled.js','w')

bookmrk = 'javascript:('+jsmin(file)+')();';
output.write(bookmrk);
output.close()


html = '<html><head></head><body><a href="%s">test</a></body></html>'
html_file = open('templates/test.html','w')
html_file.write(html % bookmrk)
html_file.close()