from django.conf.urls import patterns, include, url

urlpatterns = patterns('',    
    (r'^builder/', include('builder.urls')),
    (r'^historic/', include('historic.urls')),
    (r'^alert/', include('alert.urls')),
    (r'^data/', include('data.urls')),
    (r'^consumption/', include('consumption.urls')),
    (r'^settings/', include('settings.urls')),
    (r'^', include('main.urls')),
    (r'^$', 'main.views.index'),
)
