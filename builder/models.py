from django.db import models
from django.db.models import Count
import data
import datetime
import sys

class House(models.Model):
    year_construct = models.IntegerField(verbose_name="Year of construction")
    TYPE_FLAT = "FLAT"
    TYPE_HOUSE_4FACE = "H4"
    TYPE_HOUSE_3FACE = "H3"
    TYPE_HOUSE_2FACE = "H2"
    TYPE_OF_HOUSE = (
                     (TYPE_FLAT, "Flat"),
                     (TYPE_HOUSE_4FACE, "4 Face House"),
                     (TYPE_HOUSE_3FACE, "3 Face House"),
                     (TYPE_HOUSE_2FACE, "2 Face House"),
                )
    type = models.CharField(max_length=4,
                                      choices=TYPE_OF_HOUSE,
                                      default=TYPE_HOUSE_4FACE,
                                      verbose_name = "Type of house")
    LOCATION_URBAN = "URBAN"
    LOCATION_PERIPHERAL = "PERIPHERAL"
    LOCATION_RURAL = "RURAL"
    LOCATION = (
                     (LOCATION_URBAN, "Urban"),
                     (LOCATION_PERIPHERAL, "Peripheral"),
                     (LOCATION_RURAL, "Rural"),

                )
    location = models.CharField(max_length=10,
                                      choices=LOCATION,
                                      default=LOCATION_URBAN)    
    length = models.IntegerField(verbose_name="Maximum length of the house")
    width = models.IntegerField(verbose_name="Maximum width of the house")    
    name = models.CharField(max_length = 64)
    
    def getDimension(self) :
        """Return the real size of the house (not the house.length/width, computed from the position of the walls of each floors"""
        minCorner = Position(x=sys.maxint,y=sys.maxint)
        maxCorner = Position(x=0,y=0)
        for f in self.floors.all():
            floorMinCorner,floorMaxCorner = f.getDimension()
            minCorner.x = min(minCorner.x,floorMinCorner.x)
            minCorner.y = min(minCorner.y,floorMinCorner.y)
            maxCorner.x = max(maxCorner.x,floorMaxCorner.x)
            maxCorner.y = max(maxCorner.y,floorMaxCorner.y) 
        return (minCorner,maxCorner)
    
    def getEnergies(self):
        """Return the energies used in the house"""
        q = ('SELECT e.* FROM builder_energy e ' + 
            'INNER JOIN builder_appliancetype_energies ate ON (ate.energy_id = e.id) '+
            'INNER JOIN builder_appliancetype at ON (ate.appliancetype_id = at.id) '+
            'INNER JOIN builder_appliancelink al ON (al.appliance_id = at.id) ' +
            'INNER JOIN builder_floor f ON (f.id=al.floor_id) '+
            'WHERE f.house_id = %s OR e.type = \'STATE\' ' + 
            'GROUP BY e.id')
        return Energy.objects.raw( q, [self.id])
    
    def get_default_wall_int(self):
        """Return the default size of an internal wall in cm"""
        return 12;
    
    def get_default_insulating_int(self):
        """Return the default size of the isolation of an internal wall in cm"""
        return 3;
    
    def get_default_wall_ext(self):
        """Return the default size of an external wall in cm"""
        if (self.year_construct < 1960):
            return 22;
        else:
            return 28;
        
    def get_default_insulating_ext(self):
        """Return the default size of the isolation of an external wall in cm"""
        if (self.year_construct < 1960):
            return 14;
        else:
            return 18;
        
    class Meta:
        permissions = (
            ("view_house", "Can see house data"),
            ("edit_house", "Can change house data"),
        )
        
class Position(models.Model):
    x = models.FloatField()
    y = models.FloatField()
    def natural_key(self):
        return {"x" : self.x, "y" : self.y}

class Floor(models.Model):    
    house = models.ForeignKey(House, related_name='floors')
    height = models.FloatField()    
    FLOOR_FLOOR = "FLOOR"
    FLOOR_CRAWL_SPACE = "CRAWL_SPACE"
    FLOOR_SLAB = "SLAB"
    FLOOR_CELLAR = "CELLAR"
    FLOOR_ROOF_ATTIC = "ROOF_ATTIC"
    FLOOR_ROOF_LIVING = "ROOF_LIVING"
    FLOOR = ((FLOOR_FLOOR, "Normal floor"),
             (FLOOR_CRAWL_SPACE, "Crawl space"),
             (FLOOR_SLAB, "Slab"),
             (FLOOR_CELLAR, "Cellar"),
             (FLOOR_ROOF_ATTIC, "Stockage attic"),
             (FLOOR_ROOF_LIVING, "Living attic"))
             
    floor = models.CharField(max_length=12,
                                      choices=FLOOR,
                                      default=FLOOR_FLOOR)
    
    def getDimension(self):
        """Returns the most upperleft position of a wall, and the most bottom down"""
        leftCorner = Position(x=sys.maxint,y=sys.maxint)
        maxCorner = Position(x=0,y=0)
        for w in self.walls.select_related('start','end').all():
            if w.start.x < leftCorner.x : leftCorner.x = w.start.x
            if w.start.x > maxCorner.x : maxCorner.x = w.start.x
            if w.start.y < leftCorner.y : leftCorner.y = w.start.y
            if w.start.y > maxCorner.y : maxCorner.y = w.start.y
            if w.end.x < leftCorner.x : leftCorner.x = w.end.x
            if w.end.x > maxCorner.x : maxCorner.x = w.end.x
            if w.end.y < leftCorner.y : leftCorner.y = w.end.y
            if w.end.y > maxCorner.y : maxCorner.y = w.end.y
        
        return (leftCorner,maxCorner)
    
    def has_meters(self):
        """True if there is meters on this floor"""
        for a in self.appliance_links.all():
            if (a.meter.all().count() > 0):
                return True;
        return False
    
    def has_appliances(self):
        """True if there is appliances on this floor"""
        n = self.appliance_links.aggregate(c = Count('id'));
        return n['c'] > 0
            
   
class Wall(models.Model):
    start = models.OneToOneField(Position,related_name='wall_start')
    end = models.OneToOneField(Position,related_name='wall_end')
    floor = models.ForeignKey(Floor,related_name='walls')           
    insulating_size = models.FloatField()
    wall_size = models.FloatField()     

class Window(models.Model):
    center = models.OneToOneField(Position)
    width = models.FloatField()
    height = models.FloatField()
    floor = models.ForeignKey(Floor)
    WINDOW_SIMPLE = "SIMPLE"
    WINDOW_DOUBLE = "DOUBLE"
    WINDOW_DOUBLE_HE = "HE"
    WINDOW_TRIPLE = "TRIPLE"
    WINDOW_TYPE = ((WINDOW_SIMPLE, "Simple"),
                   (WINDOW_DOUBLE, "Double"),
                   (WINDOW_DOUBLE_HE, "Double with high efficiency"),
                   (WINDOW_TRIPLE, "Triple"))             
             
    type = models.CharField(max_length=6,
                                      choices=WINDOW_TYPE,
                                      default=WINDOW_DOUBLE_HE)
    
    WINDOW_ORIENTATION_H = "H"
    WINDOW_ORIENTATION_V = "V"
    WINDOW_ORIENTATION = ((WINDOW_ORIENTATION_H, "Horizontal"),
                          (WINDOW_ORIENTATION_V, "Vertical"))             
    orientation = models.CharField(max_length=1,
                                      choices=WINDOW_ORIENTATION,
                                      default=WINDOW_ORIENTATION_H)      
        
class Person(models.Model):
    age = models.PositiveSmallIntegerField(max_length=3)
    house = models.ForeignKey(House)
    name = models.CharField(max_length = 32)
    WORK_UNEMPLOYED = "UNEMPLOYED"
    WORK_LABORER = "LABORER"
    WORK_STUDENT = "STUDENT"
    WORK_EMPLOYEE = "EMPLOYEE"
    WORK_FREELANCE = "FREELANCE"
    WORK = ((WORK_UNEMPLOYED, "Unemployed"),
            (WORK_LABORER, "Laborer"),
            (WORK_EMPLOYEE, "Employee"),
            (WORK_STUDENT, "Student"),
            (WORK_FREELANCE, "Freelance"))
    work = models.CharField(max_length=10,
                                      choices=WORK,
                                      default=WORK_UNEMPLOYED)

class Energy(models.Model):
    title = models.CharField(max_length = 32)
    short_name = models.CharField(max_length = 12)
    unit = models.CharField(max_length = 8, blank = True, default="")
    unit_instant = models.CharField(max_length = 8, blank = True, default="")
    color = models.CharField(max_length = 15)
    overall = models.BooleanField();
    TYPE_POWER = "POWER"
    TYPE_CONSU = "CONSU"
    TYPE_STATE = "STATE"
    TYPE = ((TYPE_POWER, "Power"),
            (TYPE_CONSU, "Consumable"),
            (TYPE_STATE, "State"))
    type = models.CharField(    max_length=10,
                                choices=TYPE,
                                default=TYPE_POWER)
    lhv = models.FloatField()
    price = models.FloatField()
    def __unicode__(self):
        return self.title

class ApplianceType(models.Model):
    title = models.CharField(max_length = 32)
    APPLIANCE_CATEGORY = (('H','Heater'),
                          ('L','Lights'),
                          ('C','Computing'),
                          ('ET','TV'),
                          ('K','Kitchen'),
                          ('W','Washing'),
                          ('ES','Sound'),
                          ('B','Bathroom'),
                          ('I','Invisible'),)
    APPLIANCE_CATEGORY_VISIBLE = APPLIANCE_CATEGORY[:-1]
    category = models.CharField(max_length=2,
                                      choices=APPLIANCE_CATEGORY,
                                      default='H')
    energies = models.ManyToManyField(Energy,blank=True)
        
class ApplianceLink(models.Model):
    appliance = models.ForeignKey(ApplianceType)
    center = models.OneToOneField(Position)
    floor = models.ForeignKey(Floor,related_name='appliance_links')
    
class Meter(models.Model):        
    energy = models.ForeignKey(Energy)
    
    MODE_TOTAL = "TOT"
    MODE_INSTANT = "INS"
    MODE_DIFFERENCE = "DIF"
    MODES = (
                     (MODE_TOTAL, "Total count"),
                     (MODE_INSTANT, "Instant consumption"),
                     (MODE_DIFFERENCE, "Difference"),
                )
    
    mode = models.CharField(max_length=3,
                                      choices=MODES,
                                      default=MODE_TOTAL,
                                      verbose_name = "Mode of meter")
    hash = models.CharField(max_length=12)
    house =  models.ForeignKey(House)
    appliance_link = models.ForeignKey(ApplianceLink,blank=True,null=True,related_name='meter');
   
    
    def get_instant(self, delta):
        """Return the last instant consumption measured on this meter, return NODATA if no reading received
           @param delta: consider only data which are maximum delta seconds old 
        """
        try:
            latest = self.readings.latest('date')
            import pytz
            if (delta != None and (pytz.utc.localize(datetime.datetime.now()) - latest.date).seconds > float(delta)):
                return 'NODATA'
        except data.models.Reading.DoesNotExist:
            return 'NODATA'
            
        if (self.mode == Meter.MODE_DIFFERENCE):
            try:                
                last = self.readings.order_by('-date')[1:2].get()
                dt = latest.date - last.date
                consumed = latest.amount
                return (consumed / float(dt.seconds)) * 3600.0
            except data.models.Reading.DoesNotExist:
                return 'NODATA'
        elif (self.mode == Meter.MODE_INSTANT or self.energy.type == Energy.TYPE_STATE):
                return latest.amount            
        elif (self.mode == Meter.MODE_TOTAL):
            try:
                last = self.readings.filter(date__lt=latest.date).order_by('-date')[:1].get()
                
                dt = latest.date - last.date
                consumed = latest.amount - last.amount
                return (consumed / float(dt.seconds)) * 3600.0
            except data.models.Reading.DoesNotExist:
                return 'NODATA'