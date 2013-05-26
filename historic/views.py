from django.shortcuts import render
from builder.models import Meter
from django.db.models import Count
from django.contrib.auth.decorators import permission_required
from builder.models import Energy
from django.core import serializers

@permission_required('builder.view_house')
def house(request):
    meters = Meter.objects.annotate(num_r=Count('readingdays')).filter(house=request.session['house'],num_r__gt=0,appliance_link__isnull=True)
    power_meters = Meter.objects.filter(house=request.session['house'],appliance_link__isnull=True).exclude(energy__type=Energy.TYPE_STATE).annotate(num_r=Count('readingdays')).exclude(num_r=0)
    context = {'meters':meters,'meter_mode':False,'power_meters':power_meters,'power_meters_json':serializers.serialize("json", power_meters,use_natural_keys=True,relations={'energy':()}),}
    return render(request, 'historic/house.html', context)

@permission_required('builder.view_house')
def meter(request,meter_id):
    meter = Meter.objects.get(pk=meter_id);
    context = {'meter':meter}
    return render(request, 'historic/meter.html', context)