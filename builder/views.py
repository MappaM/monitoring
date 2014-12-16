from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.http import HttpResponse
from builder import forms
from models import Person
from models import Floor
from models import House
from models import Wall
from models import Position
from models import Window
import json
from models import Energy
from models import ApplianceType
from models import ApplianceLink
from builder.models import Meter
from django.core import serializers
from django import shortcuts
from django.contrib.auth.models import User
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import permission_required

#Stage 1 : name and type of house
@permission_required('builder.edit_house')
def stage1(request):   
    if ('house' in request.session and isinstance(request.session['house'],long)):
        h = shortcuts.get_object_or_404(House, id=request.session['house'])
    else:
        h = None
        
    house = forms.HouseForm(request.POST or None,instance=h)
        
    if (request.POST):
        if (house.is_valid()):
            house = house.save()
            request.session['house'] = house.id
            return HttpResponseRedirect('/builder/stage2/')
        else:
            pass            
    
    context = {'form': house,'house_id':('' if (h == None) else h.pk)}
    return render(request, 'builder/stage1.html', context)

@permission_required('builder.edit_house')
def house_delete(request,house_id):
    if (request.POST):
        request.session['house'] = ''
        house=House.objects.get(pk=house_id)
        house.delete()
        return HttpResponseRedirect('/')
    else:
        return render(request, 'builder/delete_house.html', {'house_id':house_id})
    
#Stage 2 : people
@permission_required('builder.edit_house')
def stage2(request):  
    house = shortcuts.get_object_or_404(House, id=request.session['house'])  
    person = forms.PersonForm(initial = {'house': house.pk});
    people = Person.objects.filter(house_id=house)
    context = {'form': person,
               'house':house.pk,
               'people' : serializers.serialize("json", people,use_natural_keys=True),
               'works':json.dumps(Person.WORK)
               } 
    return render(request, 'builder/stage2.html', context)


@permission_required('builder.edit_house')    
def people_add(request):
    person = forms.PersonForm(request.POST)
    if person.is_valid():
        person.save()
        return HttpResponse(1)
    else:
        return HttpResponse(person.errors)
    
@permission_required('builder.edit_house')    
def people_delete(request, person):
    Person.objects.get(pk=person).delete()   
    return HttpResponse(1)

#Stage 3 : floors
@permission_required('builder.edit_house')
def stage3(request):
    house = shortcuts.get_object_or_404(House, id=request.session['house'])  
    floors = Floor.objects.filter(house=house);
    context = {'house':house,
               'floor_types':Floor.FLOOR,
               'floors':serializers.serialize("json",floors,use_natural_keys=True),} 
    return render(request, 'builder/stage3.html', context)

@permission_required('builder.edit_house')
def floors_save(request, house_id):
    floors_list = Floor.objects.filter(house=house_id)
    floors = []
    for floor in floors_list:
        floors.append(floor.pk)
 
    for i in range(int(request.POST['n'])):
        if (long(request.POST['i_pk' + str(i)]) > 0):
            f = Floor(pk = long(request.POST['i_pk' + str(i)]));
            floors.remove(f.pk)
        else:
            f = Floor()
        
        f.floor = request.POST['i_t' + str(i)]
        f.height = float(request.POST['i_h' + str(i)].replace(',','.'))
        f.house=House.objects.get(pk=house_id)
        f.save()
    for floor in floors:
        Floor(pk=floor).delete()       
    return HttpResponse('')

@permission_required('builder.edit_house')
def floors_remove(request, floor_id):
    Floor.objects.get(pk=floor_id).delete()   
    return HttpResponse(1)

@never_cache
@permission_required('builder.edit_house')
def floors_get(request, house_id):
    return HttpResponse(serializers.serialize("json", Floor.objects.filter(house = house_id),use_natural_keys=True))

#Stage 4 : walls
@permission_required('builder.edit_house')
def stage4(request): 
    house = shortcuts.get_object_or_404(House, id=request.session['house'])
    floors = Floor.objects.filter(house=house) 
    context = { 'title':'Wall',
                'house_id':house.id,
                'floor_types':Floor.FLOOR,
                'floors':serializers.serialize("json", floors,use_natural_keys=True),
                'house':house,
                'plan_params':'showBackWalls:true,'} 
    return render(request, 'builder/stage4.html', context)

@permission_required('builder.edit_house')
def walls_save(request, house_id):
    Wall.objects.filter(floor=int(request.POST['floor_id'])).delete();
    s = house_id
    for i in range(int(request.POST['n'])):
        f = Wall();
        start = Position()
        start.x = request.POST['wall_start_x' + str(i)]
        start.y = request.POST['wall_start_y' + str(i)]
        start.save()
        f.start = start
        end = Position()
        end.x = request.POST['wall_end_x' + str(i)]
        end.y = request.POST['wall_end_y' + str(i)]
        end.save()
        f.end = end
        f.insulating_size = request.POST['wall_insulating_size' + str(i)]
        f.wall_size = request.POST['wall_wall_size' + str(i)]
        f.floor=Floor.objects.get(pk=int(request.POST['floor_id']))
        f.save()
    return HttpResponse(s)

@never_cache
@permission_required('builder.edit_house')
def walls_get(request, floor_id):
    return HttpResponse(serializers.serialize("json", Wall.objects.select_related('start','end','floor').filter(floor = floor_id),use_natural_keys=True))

#Stage 5 : Windows
@permission_required('builder.edit_house')
def stage5(request):
    house = shortcuts.get_object_or_404(House, id=request.session['house'])
    floors = Floor.objects.filter(house=house)
    context = { 'house_id':house.pk,
                'floor_types':Floor.FLOOR,
                'floors':serializers.serialize("json", Floor.objects.filter(house = house),use_natural_keys=True),
                'house':house,
                'title':'Windows',
                'window_types':Window.WINDOW_TYPE}
    return render(request, 'builder/stage5.html', context)

@permission_required('builder.edit_house')
def windows_save(request, house_id):
    Window.objects.filter(floor=int(request.POST['floor_id'])).delete();
    s = house_id
    for i in range(int(request.POST['n'])):
        f = Window();
        center = Position()
        center.x = request.POST['window_center_x' + str(i)]
        center.y = request.POST['window_center_y' + str(i)]
        center.save()
        f.center = center
        f.width = request.POST['window_width' + str(i)]
        f.orientation = request.POST['window_orientation' + str(i)]
        f.type = request.POST['window_type' + str(i)]
        f.height = request.POST['window_height' + str(i)]
        f.floor=Floor.objects.get(pk=int(request.POST['floor_id']))
        f.save()
    return HttpResponse(s)

@never_cache
@permission_required('builder.edit_house')
def windows_get(request, floor_id):
    return HttpResponse(serializers.serialize("json", Window.objects.select_related('center','floor').filter(floor = floor_id),use_natural_keys=True))

#Stage 6 : Appliances
@permission_required('builder.edit_house')
def stage6(request):
    house = shortcuts.get_object_or_404(House, id=request.session['house'])
    floors = Floor.objects.filter(house=house)    
    context = { 'house_id':house.id,
                'floor_types':Floor.FLOOR,
                'floors':serializers.serialize("json", Floor.objects.filter(house = house),use_natural_keys=True),
                'house':house,
                'energies':serializers.serialize("json",Energy.objects.all()),
                'title':'Appliances',
                'appliance_types_categories':ApplianceType.APPLIANCE_CATEGORY_VISIBLE,
          #       'appliance_types':serializers.serialize("json", ApplianceType.objects.all(),use_natural_keys=True),
          }
    return render(request, 'builder/stage6.html', context)

@permission_required('builder.edit_house')
def appliances_save(request, house_id):
    appliances_list = ApplianceLink.objects.filter(floor=int(request.POST['floor_id']))
    appliances = []

    for appliance in appliances_list:
        appliances.append(appliance.pk)
 
    for i in range(int(request.POST['n'])):
        if (long(request.POST.get('appliance_link_pk' + str(i),0)) > 0):
            f = ApplianceLink(pk = long(request.POST['appliance_link_pk' + str(i)]));
            appliances.remove(f.pk)
        else:
            f = ApplianceLink()      
        center = Position()
        center.x = request.POST['appliance_link_center_x' + str(i)]
        center.y = request.POST['appliance_link_center_y' + str(i)]
        center.save()
        f.center = center
        f.appliance = ApplianceType.objects.get(pk=request.POST['appliance_link_appliance_pk' + str(i)])
        f.floor=Floor.objects.get(pk=int(request.POST['floor_id']))
        f.save()
    for appliance in appliances:
        ApplianceLink(pk=appliance).delete()     
    return HttpResponse('')

@never_cache
@permission_required('builder.edit_house')
def appliances_links_get(request, floor_id):
    return HttpResponse(serializers.serialize("json", ApplianceLink.objects.select_related('appliance','floor').filter(floor = floor_id),use_natural_keys=True, relations={'appliance':{'relations':('energies',)}}))

@never_cache
@permission_required('builder.edit_house')
def appliances_types_get(request, cat):
    return HttpResponse(serializers.serialize("json", ApplianceType.objects.filter(category = cat).order_by('title'),use_natural_keys=True,relations=('energies')))


#Stage 7 : Meters
@permission_required('builder.edit_house')
def stage7(request):
    house = shortcuts.get_object_or_404(House, id=request.session['house'])
    meterForm = forms.MeterForm(initial = {'house': house.pk})
    minCorner,maxCorner = house.getDimension()  
    context = { 'house_id':house.pk,
                'house':house.pk,
                'floor_types':Floor.FLOOR,
                'floors':serializers.serialize("json", Floor.objects.filter(house = house),use_natural_keys=True),
                'house':house,
                'meters':serializers.serialize("json", 
                                               Meter.objects.filter(house = house),
                                               use_natural_keys=True,
                                               relations={
                                                          'energy':(),
                                                          'appliance_link':
                                                          {
                                                            'relations':
                                                            {
                                                                'center':(),
                                                                'appliance':
                                                                {
                                                                    'relations':('energies',)}}}}),
                'meter_modes':json.JSONEncoder().encode(Meter.MODES),
                'energies_used':serializers.serialize("json",list(house.getEnergies())),
                'energies':serializers.serialize("json",Energy.objects.all()),                
                'plan_data':'length:' + str(maxCorner.x - minCorner.x + 4) + ', width:' + str(maxCorner.y - minCorner.y + 6) + ',offsetX:' + str(minCorner.x - 2) + ', offsetY:' + str(minCorner.y - 4),
                'form':meterForm,
                'title':'Meter',
                'appliance_types_categories':ApplianceType.APPLIANCE_CATEGORY,
          }   
    return render(request, 'builder/stage7.html', context)

@permission_required('builder.edit_house')
def meter_add(request):    
    meter = forms.MeterForm(request.POST)
    m = meter.save(commit = False)
    
    m.secure = User.objects.make_random_password(length=12)
    m.save()
    if meter.is_valid():       
        m.save()
        return HttpResponse(1)
    else:
        return HttpResponse(meter.errors)
    
@permission_required('builder.edit_house')
def meter_delete(request, meter):
    Meter.objects.get(pk=meter).delete()   
    return HttpResponse(1)
 
@never_cache
@permission_required('builder.edit_house')
def meters_get(request, house_id):
    return HttpResponse(serializers.serialize("json", Meter.objects.filter(house = house_id),use_natural_keys=True,relations={'energy':(),'appliance_link':{'relations':{'appliance':{'relations':('energies',)}}}}))

@permission_required('builder.edit_house')
def meters_save(request, house_id):
    meters_list = Meter.objects.filter(house=house_id)
    meters = []
    s=''
    for meter in meters_list:
        meters.append(meter.pk)
 
    for i in range(int(request.POST['n'])):
        if (long(request.POST.get('meter_pk' + str(i),0)) > 0):
            m = Meter(pk = long(request.POST['meter_pk' + str(i)]));
            meters.remove(m.pk)
        else:
            m = Meter()
        m.energy = Energy.objects.get(pk=request.POST['meter_energy_pk' + str(i)])
        m.mode = request.POST['meter_mode' + str(i)]
        m.hash = request.POST['meter_hash' + str(i)]
        m.options = request.POST['meter_options' + str(i)]
        if (request.POST.get('meter_appliance_link'+ str(i), -1) == -1):
            m.appliance_link = ApplianceLink.objects.get(pk=request.POST['meter_appliance_link_pk' + str(i)])
        else:
            pass
        m.house=House.objects.get(pk=house_id)
        s += str(m)
        m.save()
    for meter in meters:
        Meter(pk=meter).delete()       
    return HttpResponse(s)
