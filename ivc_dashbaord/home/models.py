from django.db import models

# Create your models here.
class InvoiceModel(models.Model):
    inovice_id = models.CharField(max_length=255, unique=True)
    payment = models.CharField(max_length=255)
    balance = models.CharField(max_length=255)

    def __str___(self):
        return self.inovice_id