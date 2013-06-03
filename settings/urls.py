from django.conf.urls import patterns, url
from settings import views

urlpatterns = patterns(
    '',
    # ex: /builder/
    
    url(r'^/?$', views.main),
    url(r'^appliances?/?$', views.appliances),
    url(r'^save_profile?/?$', views.save_profile),
    url(r'^users?/?$', views.users),
    url(r'^energies?/?$', views.energies),
  
)
