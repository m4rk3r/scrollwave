import os
import subprocess
from glob import glob

import redis
from flask import Flask, redirect, url_for, jsonify, render_template

DEBUG = True
FILE_TMPLT = '{0}.mp3'
STORAGE = 'storage/'
FILE_PATH = '/Users/mark/play/scrollwave/'
MEDIA_PATH = '/static/'

app = Flask(__name__)

process = {}
RDS_KEY = 'scroll.'
rds = redis.Redis()

def get_vid(id):
    process[id] = subprocess.Popen(['./youtube-dl',id,'-x','--audio-format','mp3','-o','storage/%(id)s.%(ext)s'])

@app.route('/')
def index():
    return render_template('tunes.html')

@app.route('/get/<id>')
def get_audio(id):
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

    # start app
    app.run(debug=DEBUG)
