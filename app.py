import os
import subprocess
from glob import glob

import redis
from flask import Flask, redirect, url_for, jsonify, render_template

DEBUG = True
FILE_TMPLT = '{0}.mp3'
STORAGE = 'static/media/'
FILE_PATH = '/Users/mark/programming/scrollwave/'
MEDIA_PATH = 'http://localhost:9000/static/media/'

app = Flask(__name__,extra_files=os.path.join(FILE_PATH,'static/bookmark.js'))

process = {}
RDS_KEY = 'scroll.'
rds = redis.Redis()


"""
~ UTILS ~
"""
def get_vid(id):
    process[id] = subprocess.Popen(['./youtube-dl',id,'-x','--audio-format','mp3','-o','static/%(id)s.%(ext)s'])

def validate(input):
    if not re.match(r'[a-zA-Z0-9]+',input):
        return False
    return True


@app.route('/')
def index():
    return render_template('test.html')


@app.route('/list/')
def list():
    videos = [ _.split('.')[1] for _ in rds.keys()]
    return jsonify(videos=videos)


@app.route('/get/<id>')
def get_audio(id):
    if not validate(id): return jsonify()
    if not rds.exists(RDS_KEY+str(id)) and len(id) < 20:
        rds.set(RDS_KEY+str(id),0)
        get_vid(id)
        return redirect('/poll/'+id)
    elif rds.get(RDS_KEY+str(id)) == '0':
        return redirect(url_for('/poll/'+id))
    return jsonify(status='success',
        file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)))


@app.route('/poll/<id>')
def get_status(id):
    if rds.get(RDS_KEY+id) == '1':
        return jsonify(status='success',
            file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)))
    if process.get(id,None) is None: return 'null'
    if subprocess.Popen.poll(process.get(id,None)) is None:
        return jsonify(status='processing')
    rds.set(RDS_KEY+id,1)
    del process[id]

    return jsonify(status='success',
        file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)))


if __name__ == '__main__':
    # cleanup
    map(rds.delete, rds.keys(RDS_KEY+'*'))
    files = glob(os.path.join(FILE_PATH,STORAGE)+'*.mp3')
    for file in files:
        rds.set(RDS_KEY+os.path.basename(file).split('.')[0],1)

    subprocess.Popen(['/Users/mark/venv/play/bin/python','mk_bookmarklet.py'])

    # start app
    app.run(debug=DEBUG)
