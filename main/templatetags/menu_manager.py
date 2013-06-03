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

    return context

register.inclusion_tag("main/menu.html", takes_context=True)(menu)