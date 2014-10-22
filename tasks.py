import subprocess
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/',
    backend='redis://localhost:6379/')


@celery_app.task
def get_vid(id):
    process = subprocess.Popen(['./youtube-dl',id,'-x','--audio-format','mp3','-o','static/media/%(id)s.%(ext)s'])
    process.wait()