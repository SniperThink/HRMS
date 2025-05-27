from django.db import models

# Create your models here.
class Revenue(models.Model):
    amount = models.BigIntegerField(help_text="Amount in paise")
    timestamp = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50, default='all')
    
    class Meta:
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['category']),
        ]