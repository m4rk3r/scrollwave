import re
import os
import subprocess
from glob import glob

import redis
from flask import Flask, redirect, url_for, jsonify, render_template, request

from settings import URL, FILE_PATH

from celery import Celery

DEBUG = True
FILE_TMPLT = '{0}.mp3'
STATIC = 'static/'
STORAGE = 'static/media/'
MEDIA_PATH = os.path.join(URL,STORAGE)
app = Flask(__name__)
app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379',
    CELERY_RESULT_BACKEND='redis://localhost:6379'
)

process = {}
RDS_KEY = 'scroll.'
rds = redis.Redis()


"""
~ UTILS ~
"""
@celery.task
def get_vid(id):
    process = subprocess.Popen(['./youtube-dl',id,'-x','--audio-format','mp3','-o','static/media/%(id)s.%(ext)s'])
    process.wait()

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

def make_celery(app):
    celery = Celery(app.import_name, broker=app.config['CELERY_BROKER_URL'])
    celery.conf.update(app.config)
    TaskBase = celery.Task
    class ContextTask(TaskBase):
        abstract = True
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)
    celery.Task = ContextTask
    return celery

celery = make_celery(app)

@app.route('/')
def index():
    return render_template('test.html')


@app.route('/list/')
def list():
    videos = [ _.split('.')[1] for _ in rds.keys()]
    return jsonify(videos=videos)


@app.route('/get/')
def get_audio():
    id = request.args.get('video','')
    if not validate(id) and not validate_id(id): return jsonify()
    id = unpack_url(id) or validate_id(id)
    if not id: return jsonify()

    if not rds.exists(RDS_KEY+id) and len(id) < 20:
        rds.set(RDS_KEY+id,0)
        get_vid(id)
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
    if subprocess.Popen.poll(process.get(id,None)) is None:
        return jsonify(status='processing',id=id)
    rds.set(RDS_KEY+id,1)
    del process[id]

    return jsonify(status='success',
        file=os.path.join(MEDIA_PATH,FILE_TMPLT.format(id)),
        id=id)



# cleanup                                                                                                                       
map(rds.delete, rds.keys(RDS_KEY+'*'))
files = glob(os.path.join(FILE_PATH,STORAGE)+'*.mp3')
for file in files:
   rds.set(RDS_KEY+os.path.basename(file).split('.')[0],1)

subprocess.Popen(['python','mk_bookmarklet.py'])



if __name__ == '__main__':
    # cleanup
    map(rds.delete, rds.keys(RDS_KEY+'*'))
    files = glob(os.path.join(FILE_PATH,STORAGE)+'*.mp3')
    for file in files:
        rds.set(RDS_KEY+os.path.basename(file).split('.')[0],1)

    subprocess.Popen(['python','mk_bookmarklet.py'])

    # start app
    app.run(debug=DEBUG)
