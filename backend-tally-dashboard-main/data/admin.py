from django.contrib import admin
from .models import (
    MasterData, PurchaseData, ContraData, DebitNoteData, CreditNoteData,
    JournalData, PaymentData, ReceiptData, SalesData, SalaryData
)

@admin.register(MasterData)
class MasterDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in MasterData._meta.fields]  # Display all fields
    list_filter = ('date', 'state_name', 'stock_item_name', 'voucher_type')
    search_fields = ('voucher_number', 'party_name', 'ledger_name', 'stock_item_name')
    ordering = ('-date',)

@admin.register(PurchaseData)
class PurchaseDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in PurchaseData._meta.fields]

@admin.register(ContraData)
class ContraDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ContraData._meta.fields]

@admin.register(DebitNoteData)
class DebitNoteDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in DebitNoteData._meta.fields]

@admin.register(CreditNoteData)
class CreditNoteDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in CreditNoteData._meta.fields]

@admin.register(JournalData)
class JournalDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in JournalData._meta.fields]

@admin.register(PaymentData)
class PaymentDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in PaymentData._meta.fields]

@admin.register(ReceiptData)
class ReceiptDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in ReceiptData._meta.fields]

@admin.register(SalesData)
class SalesDataAdmin(admin.ModelAdmin):
    list_display = [field.name for field in SalesData._meta.fields]
    
# @admin.register(SalaryData)
# class SalaryDataAdmin(admin.ModelAdmin):
#     list_display = [field.name for field in SalaryData._meta.fields]
