try:
    from django.urls import reverse
except ImportError:  # Django < 2.0
    from django.core.urlresolvers import reverse

from ckeditor import widgets


class CKEditorUploadingWidget(widgets.CKEditorWidget):
    def _define_view_url(self, config_name, view_name):
        if config_name not in self.config:
            self.config.setdefault(config_name, reverse(view_name))

    def _set_config(self):
        # The 'image' plugin expects this name
        self._define_view_url('filebrowserUploadUrl', 'ckeditor_upload_image')
        self._define_view_url('filebrowserUploadVideoUrl', 'ckeditor_upload_video')
        self._define_view_url('filebrowserUploadAudioUrl', 'ckeditor_upload_audio')

        # The 'image' plugin expects this name
        self._define_view_url('filebrowserBrowseUrl', 'ckeditor_browse_images')
        self._define_view_url('filebrowserBrowseVideosUrl', 'ckeditor_browse_videos')
        self._define_view_url('filebrowserBrowseAudiosUrl', 'ckeditor_browse_audios')

        super(CKEditorUploadingWidget, self)._set_config()
