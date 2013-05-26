from django.conf.urls import patterns, include, url
from builder import views
from django.views.generic import RedirectView

urlpatterns = patterns(
    '',
    # ex: /builder/
    url(r'^/?$', RedirectView.as_view(url='/builder/stage1')),
    
    url(r'^stage1/?$', views.stage1),
    url(r'^house_(\d+)/delete/?$', views.house_delete),
    
    url(r'^stage2/?$', views.stage2),    
    url(r'^data/people/add/?$', views.people_add),
    url(r'^data/people/show/(\d+)/?$', views.people_show),
    url(r'^data/people/delete/(\d+)/?$', views.people_delete),
    
    url(r'^stage3/?$', views.stage3),
    url(r'^data/house_(\d+)/floors/save/?$', views.floors_save),
    url(r'^data/house_(\d+)/floors/get/?$', views.floors_get),
    
    url(r'^stage4/?$', views.stage4),
    url(r'^data/house_(\d+)/walls/save/?$', views.walls_save),
    url(r'^data/floor_(\d+)/walls/get/?$', views.walls_get),
    
    url(r'^stage5/?$', views.stage5),
    url(r'^data/house_(\d+)/windows/save/?$', views.windows_save),
    url(r'^data/floor_(\d+)/windows/get/?$', views.windows_get),
    
    url(r'^stage6/?$', views.stage6),
    url(r'^data/house_(\d+)/appliances/save/?$', views.appliances_save),
    url(r'^data/floor_(\d+)/appliances/get/?$', views.appliances_links_get),
    url(r'^data/appliances/get/category/([A-Z]{1,2})/?$', views.appliances_types_get),
    
    url(r'^stage7/?$', views.stage7),
    url(r'^data/house_(\d+)/meters/save/?$', views.meters_save),
    url(r'^data/house_(\d+)/meters/get/?$', views.meters_get),
)