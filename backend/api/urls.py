from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello_world, name='hello_world'),
    path('test-post/', views.test_post, name='test_post'),
    path('call-webhook/', views.call_webhook, name='call_webhook'),
    path('submit-photography/', views.submit_photography, name='submit_photography'),
    path('receive-webhook-data/', views.receive_webhook_data, name='receive_webhook_data'),
    path('get-webhook-data/', views.get_webhook_data, name='get_webhook_data'),
] 