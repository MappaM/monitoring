from django.shortcuts import render
from django.template import RequestContext
from django.core import serializers
from builder.models import House,Floor,Meter,Energy
from alert.models import ADC,Alert,Logic, AnalogMeter
import json
from django.http import HttpResponse
from django.contrib.auth.decorators import permission_required
from django.shortcuts import get_object_or_404


@permission_required('alert.change_alert')
def main(request):
    house = House.objects.get(pk=request.session['house'])
    floors = Floor.objects.select_related('house').filter(house=house)
    
    minCorner,maxCorner = house.getDimension();  
    context = {
            'house':house,
            'floors':floors,
            'adc_types':json.dumps(ADC.TYPES),
            'alert_types':json.dumps(Alert.TYPES),
            'logic_types':json.dumps(Logic.TYPES),
            'meters':serializers.serialize("json", Meter.objects.select_related('house','energy','appliance_link','appliance_link__center','appliance_link__appliance').filter(house = house).order_by('appliance_link'),use_natural_keys=True,relations={'energy':(),'appliance_link':{'relations':{'floor':(),'center':(),'appliance':{'relations':('energies',)}}}}),
            'width':(maxCorner.y - minCorner.y),
            'length':(maxCorner.x - minCorner.x),
            'energies':serializers.serialize("json",Energy.objects.all()),
            'offset':minCorner
    }         
    
    return render(request, 'alert/alert.html', RequestContext(request,context))

@permission_required('alert.change_alert')
def save(request):
    """Save a chain of AlertModel received as JSON"""    
    data = json.loads(request.POST['data'])
    
    def recursiveSaveModel(model):
        
        if (model['model'] == 'AnalogMeter'):
            nm = AnalogMeter()
            meter = Meter.objects.get(pk = model['params']['pk'])
            AnalogMeter.objects.filter(meter=meter).delete()
            nm.meter = meter
            nm.save()

        elif (model['model'] == 'ADC'):
            nm = ADC()
            nm.type = model['type']
            
            nm.threshold = float(model['params'])

        elif (model['model'] == 'Logic'):
            nm = Logic()
            
            nm.type = model['type']
            nm.params = float(model['params'])
        elif (model['model'] == 'Alert'):
            nm = Alert()
            nm.type = model['type']
            if 'params' in model:
                nm.params = model['params']
            else:
                nm.params = ''
        nm.save()   
        
        for m in model['outputs']:
            nm.outputs.add(recursiveSaveModel(m))
        
        return nm
    recursiveSaveModel(data)
    return HttpResponse('')

@permission_required('alert.change_alert')
def get(request,meter_id):
    meter = get_object_or_404(Meter,pk=meter_id)
    analog_meter =get_object_or_404(AnalogMeter, meter=meter)
    
    #Preparing the pieces chain for transport through JSON
    def foldPiece(model):
        if (hasattr(model, 'logic')):
            model = model.logic
        elif (hasattr(model, 'alert')):
            model = model.alert
        elif (hasattr(model, 'adc')):
            model = model.adc
            model.params = model.threshold        
            
        outputs = []
        for m in model.outputs.all():
            outputs.append(foldPiece(m))
        return {'model':model.__class__.__name__, 'params':model.params, 'type':model.type,'outputs':outputs}
    
    struct = {'meter':{'pk':meter.pk,'energy':{'pk':meter.energy.pk,'short_name':meter.energy.short_name,'title':meter.energy.title,'unit':meter.energy.unit,'unit_instant':meter.energy.unit_instant},'mode':meter.mode,'hash':meter.hash,'appliance_link':(None if (meter.appliance_link==None) else {'pk':meter.appliance_link.pk,'appliance':{'pk':meter.appliance_link.appliance.pk,'title':meter.appliance_link.appliance.title}})},'outputs':[foldPiece(analog_meter.outputs.all()[0])]}

    return HttpResponse(json.dumps(struct))