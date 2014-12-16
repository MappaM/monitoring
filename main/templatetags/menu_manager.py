from django import template
from builder.models import House
import re

register = template.Library()

def menu(context):
    houses = House.objects.all()
    request = context['request']
    context['houses'] = houses
    p = re.compile('^/([a-z]+)', re.IGNORECASE)
    m = p.match(context['request'].path)
    if m:    
        context['page'] = m.group(1)
    else:
        context['page'] = ''
        
    if len(houses) == 1 and context['page'] != 'builder':
        request.session['house'] = houses[0].id
        
    context['builder_only'] = (not isinstance(request.session.get('house',False),long)) or request.session['house']==0
    if (not context['builder_only'] and not request.session.get('house_has_wall',False)):
        
        house = House.objects.get(id=request.session.get('house'))
        c = 0
        for floor in house.floors.all():
            c += floor.walls.all().count();
        if c == 0:
            context['builder_only'] = True;
        else:
            request.session["house_has_wall"] = False

    return context

register.inclusion_tag("main/menu.html", takes_context=True)(menu)