from re import sub

file = open('static/js/bookmark.js','r').read()
output = open('static/js/compiled.js','w')

output.write( 'javascript:('+sub(r'[\s\n]','',file)+')();');
output.close()