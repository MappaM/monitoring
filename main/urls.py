from django.conf.urls import patterns, include, url
from main import views


urlpatterns = patterns(
    '',
    url(r'^/?$', views.index),
    url(r'^select_house/([0-9]*)/?$', views.select_house),
    url(r'^login/?$', 'django.contrib.auth.views.login', {'template_name':'main/login.html'}, name='login'),
    url(r'^logout/?$', 'django.contrib.auth.views.logout', {'next_page': '/'}, name='logout'),
    
  
)
