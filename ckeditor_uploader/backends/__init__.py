from django.conf import settings

from .dummy_backend import DummyBackend


class BackendRegistry(object):
    def __init__(self):
        self._registry = {}

    def register(self, backend_id, backend):
        if backend_id in self._registry:
            raise KeyError('%s is already a registered backend' % backend_id)
        self._registry[backend_id] = backend

    def get_backend(self, file_type):
        setting = {
            "image": "CKEDITOR_IMAGE_BACKEND",
            "video": "CKEDITOR_VIDEO_BACKEND",
            "audio": "CKEDITOR_AUDIO_BACKEND",
        }[file_type]
        backend_id = getattr(settings, setting, None)
        if backend_id is None:
            return DummyBackend
        return self._registry[backend_id]


registry = BackendRegistry()


try:
    from .pillow_backend import PillowBackend
    registry.register("pillow", PillowBackend)
except ImportError:
    pass
