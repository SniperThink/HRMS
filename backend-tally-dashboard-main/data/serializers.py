from rest_framework import serializers
from .models import *

class SuperMarketSalesSerializer(serializers.ModelSerializer):

    gender = serializers.SlugRelatedField(
        queryset = Gender.objects.all(),
        slug_field = 'name'
    )

    country = serializers.SlugRelatedField(
        queryset = Country.objects.all(),
        slug_field = 'name'
    )

    customertype = serializers.SlugRelatedField(
        queryset = CustomerType.objects.all(),
        slug_field = 'name'
    )

    branche = serializers.SlugRelatedField(
        queryset = Branche.objects.all(),
        slug_field = 'name'
    )

    # # Use SerializerMethodField instead of SlugRelatedField
    # branche = serializers.SerializerMethodField()

    class Meta:
        model = SuperMarketSales
        fields = ('id', 'unit_price', 'quantity', 'date', 'country', 'gender', 'customertype', 'branche', 'productline', 'payment')

    # def get_branche(self, obj):
    #     return f"{obj.branche.name} - {obj.branche.description}"  # Customize as needed    


class BrancheDataSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='branche')
    label = serializers.CharField(source='branche__name')
    value = serializers.IntegerField(source='totalquantity')


class YearlySalesDataSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='master_data__year')
    label = serializers.CharField(source='master_data__year')
    value = serializers.IntegerField(source='yearly_rolls_sold')

class StatelySalesDataSerializer(serializers.Serializer):
    id = serializers.CharField(source='master_data__state_name')
    label = serializers.CharField(source='master_data__state_name')
    value = serializers.IntegerField(source='stately_rolls_sold')    

class RevenueSerializer(serializers.Serializer):
    id = serializers.CharField(source='master_data__date')
    label = serializers.CharField(source='master_data__date')
    value = serializers.IntegerField(source='stately_rolls_sold')        

class RevenueTrendSerializer(serializers.Serializer):
    id = serializers.CharField()  # Date or period identifier
    label = serializers.CharField()  # Formatted display label
    value = serializers.FloatField()  # Revenue value        