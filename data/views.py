from data.models import Meter
from data.models import Reading
from datetime import datetime,date,timedelta

from django.http import HttpResponse
from data.models import ReadingDay
from builder.models import Energy
from django.utils import timezone
from django.db.models import Count
import json
import time
import pytz
import calendar
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import permission_required
from django.views.decorators.cache import never_cache
from django.db.models import Sum
import urllib2

#Add : add data to meter
def add(request,hash,value):
    m = get_object_or_404(Meter,hash=hash)
    try:
        latest = m.readings.latest('date')
    except Exception:
        latest = False
    reading = Reading()
    reading.meter = m
    reading.amount = float(value)
    reading.date = timezone.now()
    reading.save()
    if (m.options):
        options = json.loads(m.options);
        if (latest and latest.amount != reading.amount and "onUpdate" in options and "http" in options["onUpdate"]):
            url = options["onUpdate"]["http"]
            for k,v in {"%value%":value,"%hash%":hash}.iteritems():
                url = url.replace(k,str(v))
            try:
                urllib2.urlopen(urllib2.Request(url))
                return HttpResponse("Added successfully\nCalled successfully" + url)
            except Exception:
                return HttpResponse("Added successfully\nError while calling " + url)
                pass

    return HttpResponse("Added successfully")

def get_last(request,hash,delta):
    r = Meter.objects.get(hash=hash).get_instant(delta)
    return HttpResponse(r)

def get(request,hash):
    try:
        r = Meter.objects.get(hash=hash).readings.latest('date')
        return HttpResponse(r.amount)
    except Reading.DoesNotExist:
        return HttpResponse('NODATA')


def meter_instant(request,hash,delta):
    meter = Meter.objects.select_related('energy').get(hash=hash)
    data = Reading.get_instant(meter,delta)
    return HttpResponse(json.dumps(data), content_type="application/json")

def meter_consumption(request,hash,delta):
    meter = Meter.objects.select_related('energy').get(hash=hash)
    list = ReadingDay.objects.filter(meter=meter).order_by('date')
    data = []
    last = -1
    for item in list:
        readingdate = int(time.mktime(item.date.timetuple())* 1000)
        if (last >= readingdate):
            readingdate = last + 1
        last = readingdate
        data.append((readingdate,float(item.amount)))
    return HttpResponse(json.dumps([data]), content_type="application/json")

@permission_required('builder.view_house')
@never_cache
def house_all(request,house_id):
    meters = Meter.objects.annotate(num_r=Count('readingdays')).filter(house = house_id,num_r__gt=0,appliance_link__isnull=True)
    datas = []
    for m in meters :
        list = ReadingDay.objects.filter(meter=m).order_by('date')
        data = []
        for item in list:
            data.append((int(time.mktime(item.date.timetuple())* 1000),float(item.amount)))
        datas.append(data)

    return HttpResponse(json.dumps(datas), content_type="application/json")

@permission_required('builder.view_house')
@never_cache
def house_year(request,house_id):
    meters = Meter.objects.filter(house = house_id,appliance_link__isnull=True).exclude(energy__type=Energy.TYPE_STATE).annotate(num_r=Count('readingdays')).exclude(num_r=0)

    datas = []
    cat = []
    for m in meters:
        datas.append([])

    year, month = datetime.today().timetuple()[:2]

    for delta in range(12):
        cat.append(calendar.month_name[month][:3])
        first   = date(year,month,1)
        last    = date(year,month,calendar.monthrange(year, month)[1])
        month = month - 1;
        if month == 0:
            month = 12
            year = year - 1

        for i,m in enumerate(meters) :
            list = ReadingDay.objects.filter(meter=m, date__lte=last,date__gte=first).aggregate(total=Sum('amount'))
            if (list['total'] != None):
                datas[i].append(list['total'])
            else:
                datas[i].append(0)
    cat.reverse()
    for i in range(len(datas)):
        datas[i].reverse()
    return HttpResponse(json.dumps((cat,datas)), content_type="application/json")

def falsify(request, hash, value):
    m = Meter.objects.get(hash=hash)

    da = 1
    mo = 4
    ye = 2013
    startval = value
    while mo < 5:
        while (da < 31):
            hour = 0
            while hour < 24:
                minutes = 0
                while minutes < 60:
                    reading = Reading()
                    reading.meter = m
                    reading.amount = value

                    reading.date = pytz.utc.localize(datetime(year=ye,month=mo,day=da,hour=hour,minute=minutes))
                    reading.save()
                    minutes += 5

                    import random
                    mult = float((8 - min(abs(7-hour),abs(13-hour),abs(19-hour))) / float(4))
                    if (m.mode == Meter.MODE_TOTAL):
                        value = float(value)  + float(startval) * mult * (float(random.random()) + float(0.5))
                    else:
                        value = float(startval) * mult * (float(random.random()) + float(0.5))


                hour += 1
            if (mo==2 and da == 28):
                mo=3
                da=1
            else:
                da+=1
        mo+=1
    return HttpResponse("Finished")
