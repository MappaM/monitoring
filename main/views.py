from django.http import HttpResponse
from django.shortcuts import render
from django.template import RequestContext
from builder.models import House,ApplianceLink,Meter
from data.models import Reading,ReadingDay
from django.contrib.auth import authenticate, login
from django.http import HttpResponseRedirect
from alert.models import Log
from django.contrib.auth.decorators import login_required
from django.core import serializers
from main.models import Profile
import json 


@login_required
def index(request):
    
    profile = request.user.get_profile()
    
    if (profile and profile.default_house.id):
        request.session['house'] = profile.default_house.id

        
    return render(request, 'main/index.html', {'logs':Log.objects.all().order_by('-date')[:10],'housedefined': isinstance(request.session.get('house',False),long)})

def select_house(request, house_id):
    if (house_id.isdigit()):
        h = House.objects.get(id=house_id)
        request.session['house'] = h.id
        return HttpResponse(h.id)
    else:
        request.session['house'] = ''
        return HttpResponse('')
    
