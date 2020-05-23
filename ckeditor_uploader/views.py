from __future__ import absolute_import, unicode_literals

from typing import Set, Dict
import inspect
import os
import warnings
from datetime import datetime

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils.html import escape
from django.utils.module_loading import import_string
from django.utils.translation import gettext
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from ckeditor_uploader import utils
from ckeditor_uploader.backends import registry
from ckeditor_uploader.forms import SearchForm
from ckeditor_uploader.utils import (
    storage, is_image, is_nonthumb_image, is_video, is_audio
)


def _get_user_path(user):
    user_path = ''

    # If CKEDITOR_RESTRICT_BY_USER is True upload file to user specific path.
    RESTRICT_BY_USER = getattr(settings, 'CKEDITOR_RESTRICT_BY_USER', False)
    if RESTRICT_BY_USER:
        try:
            user_prop = getattr(user, RESTRICT_BY_USER)
        except (AttributeError, TypeError):
            user_prop = getattr(user, 'get_username')

        if callable(user_prop):
            user_path = user_prop()
        else:
            user_path = user_prop

    return str(user_path)


def get_upload_filename(upload_name, request):
    user_path = _get_user_path(request.user)

    # Generate date based path to put uploaded file.
    # If CKEDITOR_RESTRICT_BY_DATE is True upload file to date specific path.
    if getattr(settings, 'CKEDITOR_RESTRICT_BY_DATE', True):
        date_path = datetime.now().strftime('%Y/%m/%d')
    else:
        date_path = ''

    # Complete upload path (upload_path + date_path).
    upload_path = os.path.join(
        settings.CKEDITOR_UPLOAD_PATH, user_path, date_path
    )

    if (getattr(settings, 'CKEDITOR_UPLOAD_SLUGIFY_FILENAME', True) and
            not hasattr(settings, 'CKEDITOR_FILENAME_GENERATOR')):
        upload_name = utils.slugify_filename(upload_name)

    if hasattr(settings, 'CKEDITOR_FILENAME_GENERATOR'):
        generator = import_string(settings.CKEDITOR_FILENAME_GENERATOR)
        # Does the generator accept a request argument?
        try:
            inspect.getcallargs(generator, upload_name, request)
        except TypeError:
            # Does the generator accept only an upload_name argument?
            try:
                inspect.getcallargs(generator, upload_name)
            except TypeError:
                warnings.warn(
                    "Update %s() to accept the arguments `filename, request`."
                    % settings.CKEDITOR_FILENAME_GENERATOR
                )
            else:
                warnings.warn(
                    "Update %s() to accept a second `request` argument."
                    % settings.CKEDITOR_FILENAME_GENERATOR,
                    PendingDeprecationWarning
                )
                upload_name = generator(upload_name)
        else:
            upload_name = generator(upload_name, request)

    return storage.get_available_name(
        os.path.join(upload_path, upload_name)
    )

def handle_upload(request, expected_filetype, validator):
    """
    Uploads a file and send back its URL to CKEditor.
    """
    uploaded_file = request.FILES['upload']

    if not validator(uploaded_file.name):
        return JsonResponse({
            "uploaded": 0,
            "error": {
                "message": "Incorrect file type."
            }
        })

    backend = registry.get_backend(expected_filetype)
    filewrapper = backend(storage, uploaded_file)

    filepath = get_upload_filename(uploaded_file.name, request)
    saved_path = filewrapper.save_as(filepath)

    url = utils.get_media_url(saved_path)

    return JsonResponse({
        'url': url,
        'uploaded': 1,
        'fileName': os.path.split(saved_path)[1]
    })

@require_POST
def _upload_image(request):
    def validate(filename):
        return (
            is_image(filename) or
            getattr(settings, 'CKEDITOR_ALLOW_UNSUPPORTED_FILES', True)
        )
    return handle_upload(request, "image", validate)

@require_POST
def _upload_video(request):
    return handle_upload(request, "video", is_video)

@require_POST
def _upload_audio(request):
    return handle_upload(request, "audio", is_audio)

upload_image = csrf_exempt(_upload_image)
upload_video = csrf_exempt(_upload_video)
upload_audio = csrf_exempt(_upload_audio)


def get_files_in_storage(filterer, user=None, path=''):
    """
    Recursively walks all dirs under upload dir and generates a list of
    full paths for each file found.
    """
    # If a user is provided and CKEDITOR_RESTRICT_BY_USER is True,
    # limit images to user specific path, but not for superusers.
    STORAGE_DIRECTORIES = 0
    STORAGE_FILES = 1

    # allow browsing from anywhere if user is superuser
    # otherwise use the user path
    if user and not user.is_superuser:
        user_path = _get_user_path(user)
    else:
        user_path = ''

    browse_path = os.path.join(settings.CKEDITOR_UPLOAD_PATH, user_path)

    try:
        storage_list = storage.listdir(browse_path)
    except NotImplementedError:
        return
    except OSError:
        return

    for filename in storage_list[STORAGE_FILES]:
        # Skip hidden files
        if os.path.basename(filename).startswith('.'):
            continue
        if not filterer(filename):
            continue
        filename = os.path.join(browse_path, filename)
        yield filename

    for directory in storage_list[STORAGE_DIRECTORIES]:
        if directory.startswith('.'):
            continue
        directory_path = os.path.join(path, directory)
        for element in get_files_in_storage(filterer, user=user, path=directory_path):
            yield element


def get_files_browse_urls(filterer, user=None):
    """
    Recursively walks all dirs under upload dir and generates a list of
    thumbnail and full image URL's for each file found.
    """
    files = []
    for filename in get_files_in_storage(filterer, user=user):
        src = utils.get_media_url(filename)
        if is_image(filename):        
            # For image files, we might have thumbs available
            if getattr(settings, 'CKEDITOR_IMAGE_BACKEND', None):
                thumb = utils.get_media_url(utils.get_thumb_filename(filename))
            else:
                thumb = src
        else:
            # Otherwise, just show the default file-type icon
            thumb = utils.get_icon_filename(filename)
        visible_filename = os.path.split(filename)[1]
        max_len = getattr(settings, 'CKEDITOR_BROWSE_MAX_FILENAME_LEN', 20)
        if len(visible_filename) > max_len:
            visible_filename = visible_filename[0:max_len-1] + '...'
        
        files.append({
            'thumb': thumb,
            'src': src,
            'is_image': is_image(src),
            'visible_filename': visible_filename,
        })

    return files


def browse_files_of_type(request, filterer, messages: Dict[str, str]):
    files = get_files_browse_urls(filterer, request.user)
    if request.method == 'POST':
        form = SearchForm(request.POST)
        if form.is_valid():
            query = form.cleaned_data.get('q', '').lower()
            files = list(filter(lambda d: query in d[
                'visible_filename'].lower(), files))
    else:
        form = SearchForm()

    show_dirs = getattr(settings, 'CKEDITOR_BROWSE_SHOW_DIRS', False)
    dir_list = sorted(set(os.path.dirname(f['src'])
                          for f in files), reverse=True)

    # Ensures there are no objects created from Thumbs.db files - ran across
    # this problem while developing on Windows
    if os.name == 'nt':
        files = [f for f in files if os.path.basename(f['src']) != 'Thumbs.db']

    context = {
        'show_dirs': show_dirs,
        'dirs': dir_list,
        'files': files,
        'form': form,
        'messages': {
            key: gettext(msg)
            for (key, msg) in messages.items()
        }
    }
    return render(request, 'ckeditor/browse.html', context)


def browse_images(request):
    return browse_files_of_type(request, is_nonthumb_image, {
        'title_select_file': "Select an image to embed",
        'info_browse_for_files': "Browse for the image you want, then click 'Embed Image' to continue...",
        'info_no_files': "No images found. Upload images using the 'Image Button' dialog's 'Upload' tab.",
        'label_files_in_dir': "Images in:",
        'button_submit': "Embed Image",
    })

def browse_audios(request):
    return browse_files_of_type(request, is_audio, {
        'title_select_file': "Select an audio file to embed",
        'info_browse_for_files': "Browse for the audio file you want, then click 'Embed Audio' to continue...",
        'info_no_files': "No files found. Upload audio files using the 'Upload' section of the Insert Audio dialog.",
        'label_files_in_dir': "Audio files in:",
        'button_submit': "Embed Audio",
    })

def browse_videos(request):
    return browse_files_of_type(request, is_video, {
        'title_select_file': "Select a video to embed",
        'info_browse_for_files': "Browse for the video you want, then click 'Embed Video' to continue...",
        'info_no_files': "No files found. Upload videos using the 'Upload' section of the Insert Video dialog.",
        'label_files_in_dir': "Videos in:",
        'button_submit': "Embed Video",
    })
