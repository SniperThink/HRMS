from rest_framework import serializers

class RevenueResponseSerializer(serializers.Serializer):
    current_period = serializers.DictField()
    previous_period = serializers.DictField()
    growth_rate = serializers.FloatField()
    period_type = serializers.CharField()
    metadata = serializers.DictField()
