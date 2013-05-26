from django.forms import ModelForm
from builder import models
import datetime

from builder.models import Meter 
from django import forms

class HouseForm(ModelForm):
    year_construct=forms.IntegerField(max_value = datetime.datetime.now().year, min_value=1600)
    class Meta:
        model = models.House
        fields = ('name','year_construct', 'type', 'location', 'length', 'width')
        
class PersonForm(ModelForm):
    house = forms.ModelChoiceField(queryset=models.House.objects.all(), widget=forms.HiddenInput())
    class Meta:
        model = models.Person
        fields = ('house', 'name', 'age', 'work')
        
class MeterForm(ModelForm):    
    house = forms.ModelChoiceField(queryset=models.House.objects.all(), widget=forms.HiddenInput())
    class Meta:
        model = Meter
        fields = ('house','energy', 'mode', 'appliance_link')