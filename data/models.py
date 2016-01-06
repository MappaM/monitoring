from django.db import models
from builder.models import Meter
from builder.models import Energy
import datetime
from django.db.models import Sum,Avg

class ReadingDay(models.Model):
    meter =  models.ForeignKey(Meter,related_name='readingdays')
    date = models.DateField();
    amount = models.FloatField();

class Reading(models.Model):
    meter =  models.ForeignKey(Meter,related_name='readings')
    date = models.DateTimeField();
    amount = models.FloatField();

    def get_day(self, day):
        try:
            rd = ReadingDay.objects.get(date=day,meter=self.meter)
            return rd
        except ReadingDay.DoesNotExist:
            rd = ReadingDay()
            rd.date = day
            rd.meter = self.meter
            rd.amount = 0
            return rd

    def save(self):
        day = datetime.date(self.date.year, self.date.month,self.date.day )
        rd = self.get_day(day)

        m = self.meter
        if (m.energy.type == Energy.TYPE_STATE):
            super(Reading, self).save()
            rd.amount = Reading.objects.filter(meter=self.meter,date__gte=datetime.datetime(self.date.year, self.date.month, self.date.day),date__lt=datetime.datetime(self.date.year, self.date.month, self.date.day) + datetime.timedelta(days=1)).aggregate(Avg('amount'))['amount__avg']

            if (rd.amount == None):
                rd.amount = self.amount
            #Removing last value if the 3 last are identical
            try:
                last = Reading.objects.filter(meter=self.meter,date__lt=self.date).latest('date')
                if (last.amount == self.amount):
                    beforelast = Reading.objects.filter(meter=self.meter,date__lt=self.date).order_by('-date')[1:2].get()
                    if (beforelast.amount == self.amount):
                            last.delete()
            except Reading.DoesNotExist:
                pass
            rd.save()
        else:
            if (m.mode == Meter.MODE_DIFFERENCE):
                today_consum = Reading.objects.filter(meter=self.meter,date__gte=datetime.datetime(self.date.year, self.date.month, self.date.day),date__lt=datetime.datetime(self.date.year, self.date.month, self.date.day) + datetime.timedelta(days=1)).aggregate(total=Sum('amount'))

                if today_consum['total'] == None:
                    rd.amount = self.amount
                else:

                    rd.amount = today_consum['total'] + self.amount
                    #Here we only remove repeating 0 data
                    try:
                        last = Reading.objects.filter(meter=self.meter,date__lt=self.date).latest('date')
                        if (self.amount == 0 and last.amount == self.amount):
                            beforelast = Reading.objects.filter(meter=self.meter,date__lt=self.date).order_by('-date')[1:2].get()
                            if (beforelast.amount == self.amount):
                                last.delete()
                    except Reading.DoesNotExist:
                        pass
            elif (m.mode == Meter.MODE_INSTANT):
                try:
                    last = Reading.objects.filter(meter=self.meter,date__lt=self.date).latest('date')


                    dt = self.date - last.date


                    rd.amount =   float(rd.amount) + ((float(dt.seconds) * float(self.amount)) / float(3600))

                    #Removing last identical value (if it's not the first)
                    if (last.amount == self.amount):
                        beforelast = Reading.objects.filter(meter=self.meter,date__lt=self.date).order_by('-date')[1:2].get()
                        if (beforelast.amount == self.amount):
                            last.delete()
                except Reading.DoesNotExist:
                    rd.amount = 0

            elif (m.mode == Meter.MODE_TOTAL):
                try:
                    lastTotal = Reading.objects.filter(meter=self.meter,date__lt=datetime.datetime(self.date.year, self.date.month, self.date.day)).latest('date').amount

                    rd.amount = (float(self.amount) - float(lastTotal))
                except Reading.DoesNotExist:

                    try:
                        lastTotal = Reading.objects.filter(meter=self.meter).order_by('date')[:1].get()
                        rd.amount = (float(self.amount) -  float(lastTotal.amount))
                    except Reading.DoesNotExist:
                        rd.amount = 0

                #Removing last identical value (if it's not the first)
                try:
                    last = Reading.objects.filter(meter=self.meter,date__lt=self.date).latest('date')
                    if (last.amount == self.amount):
                        beforelast = Reading.objects.filter(meter=self.meter,date__lt=self.date).order_by('-date')[1:2].get()
                        if (beforelast.amount == self.amount):
                            last.delete()
                except Reading.DoesNotExist:
                    pass


            rd.save()


            super(Reading, self).save()

            for a in m.analog_meters.all():
                a.fire(self.meter.get_instant(86400));

    @staticmethod
    def get_instant(meter,delta):
        """Return a list of instant consumption for the given meter during the given time (or since the beginning if no time is given)"""
        if (delta == None):
            liste = Reading.objects.filter(meter=meter).order_by('date')
        else:
            liste = Reading.objects.filter(meter=meter,date__lte=datetime.datetime.now(),date__gte=(datetime.datetime.now() - datetime.timedelta(seconds=int(delta)))).order_by('date')

        import calendar;
        data = []
        last = -1
        count = 0
        for item in liste:
            count += 1
            temps = (int(calendar.timegm(item.date.timetuple()))* 1000)
            if meter.mode == Meter.MODE_INSTANT:
                if meter.energy.short_name == 'switch' and float(item.amount)!=last and last >-1:
                    data.append((temps,last))
                data.append((temps,float(item.amount)))
                last = float(item.amount)
            elif meter.mode == Meter.MODE_TOTAL:
                if last > -1 and count > 1:
                    data.append((temps,((float(item.amount) - last) / (temps - lastTime)) * 3600000))
                last = float(item.amount)
            elif meter.mode == Meter.MODE_DIFFERENCE:
                if (lastTime > -1):
                    data.append((temps,((float(item.amount)) / (temps - lastTime)) * 3600000))
        return data
