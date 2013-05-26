from django.shortcuts import render
from django.template import RequestContext
from builder.models import House,Energy,Floor,Meter
from django.core import serializers
from django.contrib.auth.decorators import permission_required


@permission_required('builder.view_house')
def main(request):  
    house = House.objects.get(pk=request.session['house'])
    floors = Floor.objects.filter(house=house)
   
    minCorner,maxCorner = house.getDimension();  
    context = {
            'house':house,
            'floor_types':Floor.FLOOR,
            'floors':floors,
            'meters':serializers.serialize("json", Meter.objects.filter(house = house),use_natural_keys=True,relations={'energy':(),'appliance_link':{'relations':{'center':(),'appliance':{'relations':('energies',)}}}}),
            'width':(maxCorner.y - minCorner.y),
            'length':(maxCorner.x - minCorner.x),
            'energies':serializers.serialize("json",Energy.objects.all()),
            'offset':minCorner
    }
   
    return render(request, 'consumption/consumption.html', context)