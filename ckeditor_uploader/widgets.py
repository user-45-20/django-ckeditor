try:
    from django.urls import reverse
except ImportError:  # Django < 2.0
    from django.core.urlresolvers import reverse

from ckeditor import widgets


class CKEditorUploadingWidget(widgets.CKEditorWidget):
    def _set_config(self):
        if 'filebrowserUploadUrl' not in self.config:
            self.config.setdefault('filebrowserUploadUrl', reverse('ckeditor_upload'))
        # The 'image' plugin expects that name
        if 'filebrowserBrowseUrl' not in self.config:
            self.config.setdefault(
                'filebrowserBrowseUrl', reverse('ckeditor_browse_images')
            )
        if 'filebrowserBrowseVideosUrl' not in self.config:
            self.config.setdefault(
                'filebrowserBrowseVideosUrl', reverse('ckeditor_browse_videos')
            )
        if 'filebrowserBrowseAudiosUrl' not in self.config:
            self.config.setdefault(
                'filebrowserBrowseAudiosUrl', reverse('ckeditor_browse_audios')
            )
        super(CKEditorUploadingWidget, self)._set_config()
