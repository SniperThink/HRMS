from django.db import models

# Create your models here.
class MasterData(models.Model):
    date = models.DateField(null=True, blank=True)  # Allow NULL values
    day = models.IntegerField(default = 0)
    month = models.IntegerField(default = 0)
    year = models.IntegerField(default = 0)
    voucher_number = models.CharField(max_length=100)
    voucher_type = models.CharField(max_length=100)
    class_name = models.CharField(max_length=100)
    party_name = models.CharField(max_length=255)
    parent_party_name = models.CharField(max_length=255)
    ledger_name = models.CharField(max_length=255)
    parent_ledger_name = models.CharField(max_length=255)
    debit_amount = models.DecimalField(max_digits=15, decimal_places=2)
    credit_amount = models.DecimalField(max_digits=15, decimal_places=2)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    round_off_value = models.DecimalField(max_digits=10, decimal_places=2)
    state_name = models.CharField(max_length=100)
    gst_registration_type_x = models.CharField(max_length=100)
    stock_item_name = models.CharField(max_length=255)
    rate = models.CharField(max_length=50)  # Keeping as CharField due to unit in the rate (e.g., "750.00/R")
    actual_qty = models.CharField(max_length=50)  # Keeping as CharField due to unit (e.g., "1 R")
    qty_number = models.DecimalField(max_digits=15, decimal_places=2, default = 0.00)
    qty_unit = models.CharField(max_length=100, default = 'na')
    address = models.TextField()
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    gst_registration_type_y = models.CharField(max_length=100)
    opening_balance_ledger = models.DecimalField(max_digits=15, decimal_places=2)
    parent = models.CharField(max_length=255)
    base_units = models.CharField(max_length=50)
    opening_qty = models.CharField(max_length=50)  # Keeping as CharField due to unit (e.g., "299 R")
    opening_rate = models.DecimalField(max_digits=10, decimal_places=2)
    opening_amt = models.DecimalField(max_digits=15, decimal_places=2)
    gst_type_of_supply = models.CharField(max_length=100)
    gst_applicable = models.CharField(max_length=100)
    gst_rate = models.IntegerField()
    category = models.CharField(max_length=100)
    # Auto-generated timestamp when a record is created
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Voucher {self.voucher_number} - {self.party_name} - {self.stock_item_name}"
    
    # def save(self, *args, **kwargs):
    #     if self.actual_qty:
    #         parts = self.actual_qty.split()  # Split "2 R" into ['2', 'R']
    #         if len(parts) == 2:  # Ensure we have both number and unit
    #             self.qty_number = float(parts[0])  # Store the numeric value
    #             self.qty_unit = parts[1]  # Store the unit
    #     super().save(*args, **kwargs)  # Call the original save method to save data
    

class PurchaseData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Purchase_data")

    def __str__(self):
        return f"Purchase Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    



class SalaryData(models.Model):
    year = models.IntegerField(null=True, blank=True)
    month = models.CharField(max_length=20, null=True, blank=True)
    date = models.DateField(null=True, blank=True)  # 👈 Add this new field

    name = models.CharField(max_length=100, null=True, blank=True)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    days_present = models.IntegerField(null=True, blank=True)
    absent = models.IntegerField(null=True, blank=True)
    sl_wo_ot = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ot_hours = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    per_hour_rs = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ot_charges = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    late = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    charge = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    amt = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deduct_25th_adv = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    deduct_old_adv = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_old_advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    balance_advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    incentive = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sal_tds = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    advance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.month} {self.year}"


class ContraData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Contra_data")

    def __str__(self):
        return f"Contra Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"
    

class DebitNoteData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="DebitNote_data")

    def __str__(self):
        return f"DebitNote Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


class CreditNoteData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="CreditNote_data")

    def __str__(self):
        return f"CreditNote Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


class JournalData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Journal_data")

    def __str__(self):
        return f"Journal Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


class PaymentData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Payment_data")

    def __str__(self):
        return f"Payment Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


class ReceiptData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Receipt_data")

    def __str__(self):
        return f"Receipt Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


class SalesData(models.Model):
    master_data = models.OneToOneField(MasterData, on_delete=models.CASCADE, related_name="Sales_data")

    def __str__(self):
        return f"Sales Voucher {self.master_data.voucher_number} - {self.master_data.party_name} - {self.master_data.stock_item_name}"    


# from tutorial video

class Country(models.Model): 
    name = models.CharField(max_length=200)

class Gender(models.Model): 
    name = models.CharField(max_length=200)

class CustomerType(models.Model): 
    name = models.CharField(max_length=200)

class Branche(models.Model): 
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=200)

class ProductLine(models.Model): 
    name = models.CharField(max_length=200)

class Payment(models.Model): 
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=200)


class SuperMarketSales(models.Model): 
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField()
    date = models.DateField()
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    gender = models.ForeignKey(Gender, on_delete=models.CASCADE)
    customertype = models.ForeignKey(CustomerType, on_delete=models.CASCADE)
    branche = models.ForeignKey(Branche, on_delete=models.CASCADE)
    productline = models.ForeignKey(ProductLine, on_delete=models.CASCADE)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE)