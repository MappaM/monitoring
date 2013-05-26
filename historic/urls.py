from django.conf.urls import patterns, include, url
from historic import views

urlpatterns = patterns(
    '',
    url(r'^(?:house)?/?$', views.house),
    url(r'^meter/([0-9]+)/?$', views.meter),  
)
