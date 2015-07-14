import time, os

lastrun = False
file_watch = ['static/js/ocean.js',]

while True:
    statbuf = os.stat('static/js/ocean.js')

    delta = sum(map(lambda f: os.stat(f).st_mtime, file_watch))

    if not lastrun or lastrun < delta:
        os.system('python mk_bookmarklet.py')
        lastrun = delta
        print 'regenerating'

    time.sleep(2)