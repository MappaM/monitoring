from django.forms import ModelForm
from builder import models
import datetime
from django.contrib.auth.models import User
from builder.models import Meter 
from django import forms
from main.models import Profile
from django.contrib.auth.models import Permission

class ApplianceTypeForm(ModelForm):
    class Meta:
        model = models.ApplianceType
        
class ProfileForm(ModelForm):
    class Meta:
        model = Profile

class UserForm(ModelForm):
    choices = ( ('view','View house and data'),
                ('alert','View house and change alerts'),
                ('edit','All access')) 
    permissions = forms.ChoiceField(choices, initial='edit')
    passwd = forms.CharField(widget = forms.PasswordInput(), label='Change password',required = False)

    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)
        if (not self.instance.pk is None):
            if self.instance.has_perm('house.edit_house'):
                self.fields['permissions'].initial='edit'
            elif self.instance.has_perm('alert.change_alert'):
                self.fields['permissions'].initial='alert'
            else:
                self.fields['permissions'].initial='view'

    class Meta:
        model = User
        fields = ["username","email"]
        widgets = {
                   'password':forms.PasswordInput()
        }
        
    def clean(self):
        return self.cleaned_data
    
    def save(self,commit=True):
        user = super(UserForm,self).save(commit = False)
        
        if (self.cleaned_data['passwd'] != ''):
            user.set_password(self.cleaned_data['passwd'])
        
        

        user.save()
        if self.cleaned_data['permissions'] == 'edit':
            user.user_permissions.add(Permission.objects.get(codename='edit_house'))
            user.user_permissions.add(Permission.objects.get(codename='view_house'))
            user.user_permissions.add(Permission.objects.get(codename='change_alert'))
        elif self.cleaned_data['permissions'] == 'alert':
            user.user_permissions.add(Permission.objects.get(codename='view_house'))
            user.user_permissions.add(Permission.objects.get(codename='change_alert'))
            user.user_permissions.remove(Permission.objects.get(codename='edit_house'))
            
        else: #self.cleaned_data['permissions'] == 'view':
            user.user_permissions.add(Permission.objects.get(codename='view_house'))
            user.user_permissions.remove(Permission.objects.get(codename='edit_house'))
            user.user_permissions.remove(Permission.objects.get(codename='change_alert'))
   
        
        return user;
    
class EnergyForm(ModelForm):
    class Meta:
        model = models.Energy