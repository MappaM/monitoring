from django.db import models
from django.contrib.auth.models import User


    
class Profile(models.Model):
    user = models.OneToOneField(User)
    advanced = models.BooleanField(default=True)
    autoscroll = models.BooleanField(default=True)