from django.conf.urls import patterns, include, url
from consumption import views

urlpatterns = patterns(
    '',    
    url(r'^/?$', views.main),
    
  
)
