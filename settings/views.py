from django.shortcuts import render
from django.shortcuts import redirect
from django.template import RequestContext
from django.forms.formsets import formset_factory
from django.forms.models import modelformset_factory
from forms import ApplianceTypeForm,UserForm,EnergyForm
from builder.models import ApplianceType,Energy
from django.contrib.auth.decorators import login_required,permission_required
import json
from django.http import HttpResponse
from main.models import Profile
from django.contrib.auth.models import User

@login_required
def main(request):  
    p, created = Profile.objects.get_or_create(user = request.user)
    if created:
        p.save()
    return render(request, 'settings/settings.html', RequestContext(request,{'profile':p}))

@permission_required('builder.edit_house')
def appliances(request):
    ApplianceTypeFormSet = modelformset_factory(ApplianceType, form=ApplianceTypeForm, extra=3, can_delete=True)
    if request.method == 'POST':
        formset = ApplianceTypeFormSet(request.POST,queryset=ApplianceType.objects.all().exclude(category='I'))
        if formset.is_valid():
            formset.save()
            return redirect(request.get_full_path() + "#last")
    else :
        formset = ApplianceTypeFormSet(queryset=ApplianceType.objects.all().exclude(category='I'))
     
    for form in formset:
        form.fields['category'].choices = ApplianceType.APPLIANCE_CATEGORY_VISIBLE

    return render(request, 'settings/list.html', RequestContext(request,{'title':'Appliances','formset':formset}))

@permission_required('users.change_user')
def users(request):
    UserFormSet = modelformset_factory(User, form=UserForm, extra=3, can_delete=True)
    if request.method == 'POST':
        formset = UserFormSet(request.POST)
        if formset.is_valid():
            formset.save()
            return redirect(request.get_full_path() + "#last")
    else :
        formset = UserFormSet()

    return render(request, 'settings/users.html', RequestContext(request,{'formset':formset}))

@permission_required('builder.edit_house')
def energies(request):
    EnergyFormSet = modelformset_factory(Energy, form=EnergyForm, extra=3, can_delete=True)
    
    if request.method == 'POST':
        formset = EnergyFormSet(request.POST)        
        if formset.is_valid():
            formset.save()
            return redirect(request.get_full_path() + "#last")
    else :
        formset = EnergyFormSet()   
    

    return render(request, 'settings/list.html', RequestContext(request,{'title':'Energies','formset':formset}))

@login_required
def save_profile(request):
    data = json.loads(request.POST['data'])
    p = Profile.objects.filter(user = request.user).update(**data)
    return HttpResponse('1')