from django.conf.urls import patterns, url
from alert import views

urlpatterns = patterns(
    '',    
    url(r'^/?$', views.main),
    url(r'^save/?$', views.save),
    url(r'^get/([0-9]+)/?$', views.get),
  
)
