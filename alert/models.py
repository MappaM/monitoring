from django.db import models
from builder.models import Meter
from django.core.mail import send_mail
from monitoring import settings
class AlertModel(models.Model):
    inputs = models.ManyToManyField("self",symmetrical=False,related_name='outputs')
    
    def fire_outputs(self,value,message,parent):
     
        for output in self.outputs.all():
            
            if (hasattr(output, 'alert')):
                output = output.alert
            elif (hasattr(output, 'adc')):
                output = output.adc
            elif (hasattr(output, 'logic')):
                output = output.logic
             
            output.fire(value,message,parent)
            
class AnalogMeter(AlertModel):
    meter = models.ForeignKey(Meter,related_name='analog_meters') 
    
    def getValue(self):
        return self.meter.get_instant(86400)
    
    def get_unit(self):
        return self.meter.energy.unit_instant
    
    def fire(self,value):
        """Fire the chain"""

        if (value == 'NODATA'):
            return
             
        self.fire_outputs(value,"The" + (" overall" if (self.meter.appliance_link == None) else "") + " meter of " + self.meter.energy.title.lower() + " measured " + ("%.2f" % value) +  format(self.meter.energy.unit_instant) + ".",self)

class ADC(AlertModel):
    TYPES = (
             ('GT','Greater than'),
             ('EQ','Equal to'),
             ('LT','Lesser than')
             )
    type = models.CharField(max_length=2,choices=TYPES)
    threshold = models.FloatField()
    lastvalue = models.FloatField(blank=True,default=-1)
    def getMaxAlertModelInput(self):
        return 0    
    
        
    def fire(self, value, message, parent):
        
        if (self.lastvalue == -1):
            self.lastvalue = value
            self.save()
            return
                
        if ((self.type=='GT' or self.type=='EQ') and self.lastvalue < self.threshold and value >= self.threshold):
            self.fire_outputs(value, message + " It exceeds " + ("%.2f" % self.threshold)+parent.get_unit()+".",self)
        elif ((self.type=='LT' or self.type=='EQ') and self.lastvalue > self.threshold and value <= self.threshold):
            self.fire_outputs(value, message + " It is under " + ("%.2f" % self.threshold)+parent.get_unit()+".",self)
        self.lastvalue = value
        self.save();
        
class Logic(AlertModel):
    TYPES = (             
             #('AND','Active if all event are active'),
             ('NOT','Active if the event is not active'),
             #('BUF','Do nothing'),
             ('TIMEL','Active if event occur before the given hour'),
             ('TIMEG','Active if event occur after the given hour'),
            )
    type = models.CharField(max_length=5,choices=TYPES)
    params = models.FloatField()
    def isActive(self):
        if (type == 'AND'):
            for input in self.inputs:
                if not input.isActive():
                    return False
            return True
        elif (type == 'NOT'):
            return not self.inputs[0].isActive()
        
    def fire(self,value,message):
        self.fire_outputs(value, message,self)


class Alert(AlertModel):
    TYPES=(
           ('MAIL','Send an e-mail'),
           ('LOG','Log an entry which will be displayed on the home page'),
          )
    type = models.CharField(max_length=4,choices=TYPES)
    params = models.TextField()
    
    def fire(self, value, message, parent):
       
        if (self.type == 'MAIL'):
            send_mail('USE Monitoring alert', message, settings.MAIL_FROM,
    [self.params], fail_silently=False)
        elif (self.type == 'LOG'):
            l = Log(message = message)
            l.save()
    
class Log(models.Model):
    date = models.DateTimeField(auto_now_add=True, blank=True)
    message = models.TextField()