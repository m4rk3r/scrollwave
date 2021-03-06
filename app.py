import re
import os
import subprocess
from glob import glob

import redis
from flask import Flask, redirect, url_for, jsonify, render_template, request

from settings import URL, FILE_PATH
from tasks import get_vid

DEBUG = True
FILE_TMPLT = '{0}.mp3'
STATIC = 'static/'
STORAGE = 'static/media/'
MEDIA_PATH = os.path.join(URL,STORAGE)

app = Flask(__name__)

process = {}
RDS_KEY = 'scroll.'
rds = redis.Redis()


"""
~ UTILS ~
"""

def validate(input):
    if not re.search(r'(youtube.com|youtu.be)',input):
        return False
    return True

def validate_id(input):
    if re.search(r'[a-zA-Z0-9-_]{11}',input):
        return re.search(r'[a-zA-Z0-9-_]{11}',input).group()
    return None

def unpack_url(id):
    result = re.search(
        r'((?<=youtu.be/)|(?<=youtube.com/watch\?v=))[a-zA-Z0-9-_]{11}',
        id)
    if result: return result.group(0)
    else: return ''


@app.route('/')
def index():
    return render_template('test.html')


@app.route('/list/')
def list():
    videos = [ _.split('.')[1] for _ in rds.keys(RDS_KEY+'*')]
    return jsonify(videos=videos)


@app.route('/get/')
def get_audio():
    id = request.args.get('video','')
    if not validate(id) and not validate_id(id): return jsonify()
    id = unpack_url(id) or validate_id(id)
    if not id: return jsonify()

    if not rds.exists(RDS_KEY+id) and len(id) < 20:
        rds.set(RDS_KEY+id,0)
        process[id] = get_vid.delay(id)
        return jsonify(processing=True,id=id)
    elif rds.get(RDS_KEY+id) == '0':
        return jsonify(processing=True,id=id)
    return jsonify(status='success',
        file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)))


@app.route('/poll/')
def get_status():
    id = validate_id(request.args.get('video',''))
    if not id: return jsonify(status='null')

    if rds.get(RDS_KEY+id) == '1':
        return jsonify(status='success',
            file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)),
            id=id)
    if process.get(id,None) is None: return jsonify(status='null')
    if not process[id].ready():
        return jsonify(status='processing',id=id)
    rds.set(RDS_KEY+id,1)
    del process[id]

    return jsonify(status='success',
        file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)),
        id=id)



if __name__ == '__main__':
    # cleanup
    map(rds.delete, rds.keys(RDS_KEY+'*'))
    files = glob(os.path.join(FILE_PATH,STORAGE)+'*.mp3')
    for file in files:
        rds.set(RDS_KEY+os.path.basename(file).split('.')[0],1)

    subprocess.Popen(['python','mk_bookmarklet.py'])

    # start app
    app.run(debug=DEBUG)
