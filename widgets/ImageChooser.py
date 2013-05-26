from string import Template
from django.utils.safestring import mark_safe
from django import forms
from django.template import loader

class IntegerChooserWidget(forms.TextInput):
    
    def render(self, name, value, attrs=None):
        
        return loader.render_to_string("widgets/IntegerChooser",context_instance={})