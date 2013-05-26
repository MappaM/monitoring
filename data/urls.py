from django.conf.urls import patterns, include, url
from data import views
from django.views.generic import RedirectView

urlpatterns = patterns(
    '',

    url(r'^([a-zA-Z0-9]+)/([0-9.,]+)$', views.add),
    url(r'^last/([a-zA-Z0-9]+)/([0-9]+)?/?$', views.get_last),
    url(r'^get/([a-zA-Z0-9]+)/?$', views.get),
    url(r'^meter_([a-zA-Z0-9]+)/instant/([0-9]+)?/?$', views.meter_instant),
    url(r'^meter_([a-zA-Z0-9]+)/consumption/([0-9]+)?/?$', views.meter_consumption),
    url(r'^house_([0-9]+)/all/?$', views.house_all),
    url(r'^house_([0-9]+)/year/?$', views.house_year),

    url(r'^falsify/([a-zA-Z0-9]+)/([0-9.,]+)$', views.falsify),
)