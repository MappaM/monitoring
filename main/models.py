from django.db import models
from django.contrib.auth.models import User
from builder.models import House

    
class Profile(models.Model):
    user = models.OneToOneField(User)
    advanced = models.BooleanField(default=True)
    autoscroll = models.BooleanField(default=True)
    default_house= models.ForeignKey(House,related_name='default_house',blank=True, null=True)
