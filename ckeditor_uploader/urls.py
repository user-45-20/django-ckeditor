from __future__ import absolute_import

from django.conf.urls import url
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.cache import never_cache

from . import views

urlpatterns = [
    url(r'^upload_image/', staff_member_required(views.upload_image), name='ckeditor_upload_image'),
    url(r'^upload_audio/', staff_member_required(views.upload_audio), name='ckeditor_upload_audio'),
    url(r'^upload_video/', staff_member_required(views.upload_video), name='ckeditor_upload_video'),

    url(r'^browse_images/',
        never_cache(staff_member_required(views.browse_images)),
        name='ckeditor_browse_images'
    ),
    url(r'^browse_audios/',
        never_cache(staff_member_required(views.browse_audios)),
        name='ckeditor_browse_audios',
    ),
    url(r'^browse_videos/',
        never_cache(staff_member_required(views.browse_videos)),
        name='ckeditor_browse_videos'
    ),
]
