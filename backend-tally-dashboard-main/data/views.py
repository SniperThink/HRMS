import pandas as pd
import re
import calendar
from datetime import date
import math
from decimal import Decimal, InvalidOperation
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from django.core.exceptions import ValidationError
from .models import *
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .serializers import *
from rest_framework.response import Response
from django.db.models import Sum, F
from django.utils import timezone
from datetime import timedelta, date
from calendar import monthrange
from .models import SalaryData

class UploadAndProcessExcelAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        """ Upload and process Excel file, storing structured data in MasterData. """
        # file = request.FILES.get('file')
        # if not file:
        #     return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Load Excel into Pandas DataFrame
            file = r'C:\Users\Dell\Desktop\Prabhav\TallyProject\Scripts\Scripts\Merged_Stock_Ledger_Data.xlsx'
            df = pd.read_excel(file, dtype=str)  # Read everything as string first

            # Clean column names: strip spaces and replace special characters
            df.columns = df.columns.str.strip().str.replace(" ", "_").str.lower()

            # Debugging - Print column names to verify
            print(df.columns.tolist())  
            # Convert Date
            df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', errors='coerce').dt.strftime('%Y-%m-%d')
            df['date'] = df['date'].astype(str)
            df['date'] = df['date'].replace({"naT": None})  # Convert NaT to None (for Django)
            df['date'] = df['date'].replace({"nan": None})  # Convert NaT to None (for Django)
            
            print("1")
            # Convert Voucher Number to String
            df['voucher_number'] = df['voucher_number'].fillna('').astype(str)
            print("2")
            # Convert Decimal Fields
            decimal_fields = ['debit_amount', 'credit_amount', 'amount', 'round_off_value', 
                              'opening_balance_ledger', 'opening_rate', 'opening_amt']
            for field in decimal_fields:
                df[field] = df[field].apply(lambda x: Decimal(str(x)).quantize(Decimal('0.01')) if pd.notnull(x) else Decimal('0.00'))
            print("3")
            # Convert GST Rate to Integer
            df['gst_rate'] = pd.to_numeric(df['gst_rate'], errors='coerce').fillna(0).astype(int)
            print("4")
            # Convert Pincode to String (removing decimals)
            df['pincode'] = df['pincode'].fillna('').astype(str)
            print("5")
            # Fill NaN values for CharFields with empty string
            char_fields = [
                'vch_type', 'class_name', 'party_name', 'parent_partyname', 'ledger_name', 
                'parent_ledgername', 'state_name', 'gst_registration_type_x', 'stock_item_name',
                'rate', 'actual_qty', 'address', 'state', 'country', 'gst_registration_type_y', 
                'parent', 'base_units', 'opening_qty', 'gst_type_of_supply', 'gst_applicable', 'category'
            ]
            df[char_fields] = df[char_fields].fillna('')
            print("6")
            
            # Bulk Insert into MasterData Model
            records = []
            for _, row in df.iterrows():
                parts = row['actual_qty'].split()  # Split "2 R" into ['2', 'R']
                if len(parts) == 2:  # Ensure we have both number and unit
                    qty_number = float(parts[0])  # Store the numeric value
                    qty_unit = parts[1]  # Store the unit
                else:
                    qty_number = 0.00
                    qty_unit = 'na'
                if row['date']:    
                    date_list = row['date'].split('-')
                else:
                    date_list = []    
                if len(date_list) == 3:
                    day = date_list[2]
                    month = date_list[1]
                    year = date_list[0]
                else:
                    day = 0
                    month = 0
                    year = 0
                record = MasterData(
                    date=row['date'],
                    day = day,
                    month = month,
                    year=year,
                    voucher_number=row['voucher_number'],
                    voucher_type=row['vch_type'],
                    class_name=row['class_name'],
                    party_name=row['party_name'],
                    parent_party_name=row['parent_partyname'],
                    ledger_name=row['ledger_name'],
                    parent_ledger_name=row['parent_ledgername'],
                    debit_amount=row['debit_amount'],
                    credit_amount=row['credit_amount'],
                    amount=row['amount'],
                    round_off_value=row['round_off_value'],
                    state_name=row['state_name'],
                    gst_registration_type_x=row['gst_registration_type_x'],
                    stock_item_name=row['stock_item_name'],
                    rate=row['rate'],
                    actual_qty=row['actual_qty'],
                    qty_number=qty_number,
                    qty_unit=qty_unit,
                    address=row['address'],
                    state=row['state'],
                    country=row['country'],
                    pincode=row['pincode'],
                    gst_registration_type_y=row['gst_registration_type_y'],
                    opening_balance_ledger=row['opening_balance_ledger'],
                    parent=row['parent'],
                    base_units=row['base_units'],
                    opening_qty=row['opening_qty'],
                    opening_rate=row['opening_rate'],
                    opening_amt=row['opening_amt'],
                    gst_type_of_supply=row['gst_type_of_supply'],
                    gst_applicable=row['gst_applicable'],
                    gst_rate=row['gst_rate'],
                    category=row['category'],
                )
                records.append(record)
            print("7")
            MasterData.objects.bulk_create(records)  # Efficient bulk insert
            print("8")
            purchase_records = [
                PurchaseData(
                    master_data=record
                )
                for record in records if record.voucher_type == "Purchase"
            ]
            # Bulk Insert PurchaseData
            PurchaseData.objects.bulk_create(purchase_records)

            contra_records = [
                ContraData(master_data=record)
                for record in records if record.voucher_type == "Contra"
            ]
            ContraData.objects.bulk_create(contra_records)

            debitnote_records = [
                DebitNoteData(master_data=record)
                for record in records if record.voucher_type == "Debit Note"
            ]
            DebitNoteData.objects.bulk_create(debitnote_records)

            creditnote_records = [
                CreditNoteData(master_data=record)
                for record in records if record.voucher_type == "Credit Note"
            ]
            CreditNoteData.objects.bulk_create(creditnote_records)

            journal_records = [
                JournalData(master_data=record)
                for record in records if record.voucher_type == "Journal"
            ]
            JournalData.objects.bulk_create(journal_records)

            payment_records = [
                PaymentData(master_data=record)
                for record in records if record.voucher_type == "Payment"
            ]
            PaymentData.objects.bulk_create(payment_records)

            receipt_records = [
                ReceiptData(master_data=record)
                for record in records if record.voucher_type == "Receipt"
            ]
            ReceiptData.objects.bulk_create(receipt_records)

            sales_records = [
                SalesData(master_data=record)
                for record in records if record.voucher_type == "Sales"
            ]
            SalesData.objects.bulk_create(sales_records)

            print("9")
            return Response({'message': 'Data uploaded and processed successfully'}, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UploadSalarySheetsView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def clean_decimal(self, value):
        try:
            if value in [None, '', 'NaN', 'nan'] or str(value).lower() == 'nan':
                return Decimal('0.00')
            return Decimal(str(value))
        except:
            return Decimal('0.00')

    def clean_int(self, value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0

    def get_last_day(self, year, month_abbr):
        try:
            month_abbr = month_abbr.strip().upper()
            month_lookup = {
                'JANUARY': 1, 'JAN': 1, 'FEBRUARY': 2, 'FEB': 2,
                'MARCH': 3, 'MAR': 3, 'APRIL': 4, 'APR': 4,
                'MAY': 5, 'JUNE': 6, 'JUN': 6, 'JULY': 7, 'JUL': 7,
                'AUGUST': 8, 'AUG': 8, 'SEPTEMBER': 9, 'SEPT': 9,
                'OCTOBER': 10, 'OCT': 10, 'NOVEMBER': 11, 'NOV': 11,
                'DECEMBER': 12, 'DEC': 12
            }
            month_number = month_lookup[month_abbr]
            result = date(int(year), month_number, 25)
            print(f"📆 Computed date: {result} for {month_abbr} {year}")
            return result
        except Exception as e:
            print(f"❌ Error in get_last_day for {month_abbr} {year}: {e}")
            return None

    def extract_month_year(self, sheet_name):
        clean = sheet_name.upper().strip().replace('_', ' ').replace('-', ' ')
        tokens = re.findall(r'[A-Z]+|\d{2,4}', clean)
        months_map = {
            'JANUARY': 'JAN', 'FEBRUARY': 'FEB', 'MARCH': 'MAR', 'APRIL': 'APR',
            'MAY': 'MAY', 'JUNE': 'JUN', 'JULY': 'JUL', 'AUGUST': 'AUG',
            'SEPTEMBER': 'SEPT', 'OCTOBER': 'OCT', 'NOVEMBER': 'NOV', 'DECEMBER': 'DEC',
            'JAN': 'JAN', 'FEB': 'FEB', 'MAR': 'MAR', 'APR': 'APR',
            'JUN': 'JUN', 'JUL': 'JUL', 'AUG': 'AUG', 'SEPT': 'SEPT',
            'OCT': 'OCT', 'NOV': 'NOV', 'DEC': 'DEC'
        }
        month = None
        year = None
        for token in tokens:
            token_upper = token.upper()
            if token_upper in months_map:
                month = months_map[token_upper]
            elif token.isdigit():
                year = '20' + token if len(token) == 2 else token
        return month, int(year) if year else None

    def post(self, request):
        try:
            excel_file = request.FILES.get('file')
            if not excel_file:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

            xls = pd.ExcelFile(excel_file)
            sheets = [s for s in xls.sheet_names if 'SAL' in s.upper() and 'POL' not in s.upper() and 'SALESMEN' not in s.upper()]
            print(f"✅ Excel file loaded. Sheets found: {xls.sheet_names}")
            print(f"🔍 Filtered SAL sheets: {sheets}")

            column_map = {
                'NAME': 'name', 'SALERY': 'basic_salary', 'SALARY': 'basic_salary',
                'ABSENT': 'absent', 'DAYS': 'days_present', 'SL_W/O_OT': 'sl_wo_ot',
                'OT': 'ot_hours', 'HOUR_RS': 'per_hour_rs', 'OT_CHARGES': 'ot_charges',
                'CHARGES': 'ot_charges', 'LATE': 'late', 'CHARGE': 'charge',
                'AMT': 'amt', 'SAL+OT': 'total_salary', '25TH_ADV': 'deduct_25th_adv',
                'OLD_ADV': 'deduct_old_adv', 'G_TOTAL': 'grand_total',
                'ADVANCE': 'total_old_advance', 'ADVANCE.1': 'balance_advance',
                'INCENTIVE': 'incentive', 'TDS': 'tds', 'SAL-TDS': 'sal_tds',
                'NET_PAYABLE': 'net_salary', 'NET_SALARY': 'net_salary',
                'NETT_SALRY': 'net_salary'
            }

            records = []

            for sheet in sheets:
                print(f"\n📄 Processing sheet: {sheet}")
                sheet_upper = sheet.strip().upper()

                if sheet_upper == "AUG SAL":
                    fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                    month = str(fallback_df.iloc[5, 1]).strip().upper()  # B6
                    year = str(int(fallback_df.iloc[5, 2]))               # C6
                    print(f"📅 AUG SAL sheet | Extracted month/year from B6/C6: {month} {year}")
                    if len(year) == 2:
                        year = int("20" + year)
                    else:
                        year = int(year)
                    print(f"✅ Extracted fallback month/year: {month} {year}")
                    df = pd.read_excel(xls, sheet_name=sheet, header=7)  # Data starts from row 8
                else:
                    month, year = self.extract_month_year(sheet)
                    if not (month and year):
                        fallback_df = pd.read_excel(xls, sheet_name=sheet, header=None)
                        try:
                            month = str(fallback_df.iloc[1, 1]).strip().upper()
                            year = str(fallback_df.iloc[1, 2]).strip()
                            if len(year) == 2:
                                year = int("20" + year)
                            else:
                                year = int(year)
                            print(f"✅ Extracted fallback month/year from B2 and C2: {month} {year}")
                        except Exception as e:
                            print(f"⚠️ Skipping sheet due to missing month/year even after fallback: {sheet} | Error: {e}")
                            continue
                    df = pd.read_excel(xls, sheet_name=sheet, header=3)

                df.columns = df.columns.str.strip().str.upper().str.replace(" ", "_")
                df = df.rename(columns={col: column_map[col] for col in df.columns if col in column_map})
                df['month'] = month
                df['year'] = year
                computed_date = self.get_last_day(year, month)
                df['date'] = computed_date

                print(f"📋 Sheet {sheet} | Date type in column: {type(df['date'].iloc[0])}")
                df = df.fillna(0)

                if 'name' not in df.columns or 'basic_salary' not in df.columns:
                    print(f"❌ Missing required columns in sheet: {sheet}")
                    continue

                df = df.dropna(subset=['name', 'basic_salary'])

                for _, row in df.iterrows():
                    try:
                        name = row.get('name')
                        if not name or str(name).strip() in ['', '0', 'nan', 'NaN']:
                            name = '-'
                        record = SalaryData(
                            year=row['year'],
                            month=row['month'],
                            date=row['date'] if isinstance(row['date'], date) else self.get_last_day(row['year'], row['month']),
                            name=name,
                            basic_salary=self.clean_decimal(row.get('basic_salary')),
                            days_present=self.clean_int(row.get('days_present')),
                            absent=self.clean_int(row.get('absent')),
                            sl_wo_ot=self.clean_decimal(row.get('sl_wo_ot')),
                            ot_hours=self.clean_decimal(row.get('ot_hours')),
                            per_hour_rs=self.clean_decimal(row.get('per_hour_rs')),
                            ot_charges=self.clean_decimal(row.get('ot_charges')),
                            late=self.clean_decimal(row.get('late')),
                            charge=self.clean_decimal(row.get('charge')),
                            amt=self.clean_decimal(row.get('amt')),
                            total_salary=self.clean_decimal(row.get('total_salary')),
                            deduct_25th_adv=self.clean_decimal(row.get('deduct_25th_adv')),
                            deduct_old_adv=self.clean_decimal(row.get('deduct_old_adv')),
                            grand_total=self.clean_decimal(row.get('grand_total')),
                            total_old_advance=self.clean_decimal(row.get('total_old_advance')),
                            balance_advance=self.clean_decimal(row.get('balance_advance')),
                            incentive=self.clean_decimal(row.get('incentive')),
                            tds=self.clean_decimal(row.get('tds')),
                            sal_tds=self.clean_decimal(row.get('sal_tds')),
                            advance=self.clean_decimal(row.get('advance')),
                            net_salary=self.clean_decimal(row.get('net_salary')),
                        )
                        records.append(record)
                    except Exception as e:
                        print(f"⚠️ Skipped row due to error: {e}")

            print(f"✅ Total records ready to save: {len(records)}")
            SalaryData.objects.bulk_create(records, ignore_conflicts=True)
            return Response({'message': f'{len(records)} rows uploaded'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
class GetRandomDataView(APIView):
    def get(self, request, *args, **kwargs):
        try:
            records = MasterData.objects.filter(
                voucher_number="23", 
                ledger_name="SBI A/c No. 41997004936"
            )

            if not records.exists():
                return Response({'message': 'No records found'}, status=status.HTTP_404_NOT_FOUND)

            # Iterate over records and print each field's name + data type
            for record in records:
                print(f"\n--- Record ID: {record.id} ---")
                for field in record._meta.get_fields():
                    if hasattr(record, field.name):  # Avoid related fields
                        field_value = getattr(record, field.name)
                        print(f"{field.name}: {field_value} ({type(field_value)})")

            return Response({'message': 'Data fetched successfully'}, status=status.HTTP_200_OK)  

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)    


class SuperMarketSalesViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = SuperMarketSales.objects.all()
    serializer_class = SuperMarketSalesSerializer

    def list(self, request):
        queryset = self.queryset
        serializer = self.serializer_class(queryset, many=True)
        return Response(
            serializer.data
        )


class BrancheDataViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = SuperMarketSales.objects.all()
    serializer_class = BrancheDataSerializer

    def list(self, request):
        queryset = SuperMarketSales.objects.values('branche', 'branche__name')\
            .annotate(totalquantity=Sum('quantity'))
        serializer = self.serializer_class(queryset, many=True)
        return Response(
            serializer.data
        )

class YearlySalesDataViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = SalesData.objects.filter(master_data__qty_unit = 'R')
    serializer_class = YearlySalesDataSerializer

    def list(self, request):
        queryset = SalesData.objects.values('master_data__year')\
            .annotate(yearly_rolls_sold=Sum('master_data__qty_number'))
        serializer = self.serializer_class(queryset, many=True)
        return Response(
            serializer.data
        )


class StatelySalesDataViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = SalesData.objects.filter(master_data__stock_item_name = 'Wallpaper')
    serializer_class = StatelySalesDataSerializer

    def list(self, request):
        queryset = self.queryset.values('master_data__state_name')\
            .annotate(stately_rolls_sold=Sum('master_data__qty_number'))\
                .order_by('-stately_rolls_sold')  # Sorting in descending order
        serializer = self.serializer_class(queryset, many=True)
        return Response(
            serializer.data
        )
    

class RevenueViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = SalesData.objects.all()
    serializer_class = RevenueSerializer

    def get_time_filtered_data(self, time_period):
        today = timezone.now().date()
        
        if time_period == 'last_7_days':
            start_date = today - timedelta(days=6)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values('master_data__date').annotate(
                revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
        elif time_period == 'last_30_days':
            start_date = today - timedelta(days=29)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values('master_data__date').annotate(
                revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
        elif time_period == 'last_6_months':
            start_date = (today - timedelta(days=180)).replace(day=1)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                revenue=Sum('master_data__amount'),
                date=F('master_data__date')
            ).order_by('master_data__year', 'master_data__month')
            
        elif time_period == 'last_year':
            start_date = (today - timedelta(days=365)).replace(day=1)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                revenue=Sum('master_data__amount'),
                date=F('master_data__date')
            ).order_by('master_data__year', 'master_data__month')
            
        elif time_period == 'last_5_years':
            start_date = today.replace(year=today.year - 5, month=1, day=1)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values('master_data__year').annotate(
                revenue=Sum('master_data__amount'),
                date=F('master_data__date')
            ).order_by('master_data__year')
            
        else:  # Default to last 7 days
            start_date = today - timedelta(days=6)
            queryset = self.queryset.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today
            ).values('master_data__date').annotate(
                revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
        
        return queryset

    def list(self, request):
        time_period = request.query_params.get('time_period', 'last_7_days')
        queryset = self.get_time_filtered_data(time_period)
        
        # Format the response data
        response_data = []
        for entry in queryset:
            if time_period in ['last_7_days', 'last_30_days']:
                date_str = entry['master_data__date'].strftime('%Y-%m-%d')
                label = entry['master_data__date'].strftime('%d %b')
            elif time_period in ['last_6_months', 'last_year']:
                date_str = f"{entry['master_data__year']}-{entry['master_data__month']:02d}"
                label = date(entry['master_data__year'], entry['master_data__month'], 1).strftime('%b %Y')
            else:  # last_5_years
                date_str = str(entry['master_data__year'])
                label = str(entry['master_data__year'])
            
            response_data.append({
                'id': date_str,
                'label': label,
                'value': float(entry['revenue'])
            })
        
        return Response(response_data)

class RevenueTrendViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = RevenueTrendSerializer

    def get_latest_date(self):
        latest_entry = MasterData.objects.order_by('-date').first()
        return latest_entry.date if latest_entry else timezone.now().date()

    def calculate_trend(self, current_data, previous_data):
        """Calculate percentage change between current and previous periods"""
        current_total = sum(current_data)
        previous_total = sum(previous_data)
        
        if previous_total == 0:
            return 0 if current_total == 0 else 100
        
        return ((current_total - previous_total) / previous_total) * 100

    def get_time_filtered_data(self, time_period):
        today = self.get_latest_date()
        
        if time_period == 'last_7_days':
            # Get last 7 days data
            start_date = today - timedelta(days=6)
            current_queryset = SalesData.objects.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today,
                master_data__voucher_type='Sales'
            ).values('master_data__date').annotate(
                daily_revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
            # Get previous 7 days for trend
            previous_start = start_date - timedelta(days=7)
            previous_end = start_date - timedelta(days=1)
            previous_queryset = SalesData.objects.filter(
                master_data__date__gte=previous_start,
                master_data__date__lte=previous_end,
                master_data__voucher_type='Sales'
            ).values('master_data__date').annotate(
                daily_revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
            labels = []
            data = []
            previous_data = []
            
            # Current period data
            current_date = start_date
            for _ in range(7):  # Ensure exactly 7 data points
                labels.append(current_date.strftime('%d %b'))
                revenue_entry = next(
                    (entry for entry in current_queryset if entry['master_data__date'] == current_date),
                    {'daily_revenue': 0}
                )
                data.append(float(revenue_entry['daily_revenue'] or 0))
                current_date += timedelta(days=1)
            
            # Previous period data for trend calculation
            current_date = previous_start
            for _ in range(7):  # Ensure exactly 7 data points for previous period
                revenue_entry = next(
                    (entry for entry in previous_queryset if entry['master_data__date'] == current_date),
                    {'daily_revenue': 0}
                )
                previous_data.append(float(revenue_entry['daily_revenue'] or 0))
                current_date += timedelta(days=1)

        elif time_period == 'last_30_days':
            # Get last 30 days data
            start_date = today - timedelta(days=29)
            current_queryset = SalesData.objects.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today,
                master_data__voucher_type='Sales'
            ).values('master_data__date').annotate(
                daily_revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
            # Get previous 30 days for trend
            previous_start = start_date - timedelta(days=30)
            previous_end = start_date - timedelta(days=1)
            previous_queryset = SalesData.objects.filter(
                master_data__date__gte=previous_start,
                master_data__date__lte=previous_end,
                master_data__voucher_type='Sales'
            ).values('master_data__date').annotate(
                daily_revenue=Sum('master_data__amount')
            ).order_by('master_data__date')
            
            labels = []
            data = []
            previous_data = []
            
            # Current period data
            current_date = start_date
            for _ in range(30):  # Ensure exactly 30 data points
                labels.append(current_date.strftime('%d %b'))
                revenue_entry = next(
                    (entry for entry in current_queryset if entry['master_data__date'] == current_date),
                    {'daily_revenue': 0}
                )
                data.append(float(revenue_entry['daily_revenue'] or 0))
                current_date += timedelta(days=1)
            
            # Previous period data for trend calculation
            current_date = previous_start
            for _ in range(30):  # Ensure exactly 30 data points for previous period
                revenue_entry = next(
                    (entry for entry in previous_queryset if entry['master_data__date'] == current_date),
                    {'daily_revenue': 0}
                )
                previous_data.append(float(revenue_entry['daily_revenue'] or 0))
                current_date += timedelta(days=1)

        elif time_period == 'last_6_months':
            # Get last 6 months data
            start_date = (today.replace(day=1) - timedelta(days=1)).replace(day=1)  # First day of 6 months ago
            for _ in range(5):  # Go back 5 more months
                start_date = (start_date - timedelta(days=1)).replace(day=1)
            
            current_queryset = SalesData.objects.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                monthly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year', 'master_data__month')
            
            # Get previous 6 months for trend
            previous_start = (start_date - timedelta(days=1)).replace(day=1)
            for _ in range(5):
                previous_start = (previous_start - timedelta(days=1)).replace(day=1)
            previous_end = start_date - timedelta(days=1)
            
            previous_queryset = SalesData.objects.filter(
                master_data__date__gte=previous_start,
                master_data__date__lte=previous_end,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                monthly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year', 'master_data__month')
            
            labels = []
            data = []
            previous_data = []
            
            # Current period data
            current_date = start_date
            for _ in range(6):  # Ensure exactly 6 data points
                labels.append(current_date.strftime('%b %Y'))
                revenue_entry = next(
                    (entry for entry in current_queryset 
                     if entry['master_data__year'] == current_date.year 
                     and entry['master_data__month'] == current_date.month),
                    {'monthly_revenue': 0}
                )
                data.append(float(revenue_entry['monthly_revenue'] or 0))
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            # Previous period data for trend calculation
            current_date = previous_start
            for _ in range(6):  # Ensure exactly 6 data points for previous period
                revenue_entry = next(
                    (entry for entry in previous_queryset 
                     if entry['master_data__year'] == current_date.year 
                     and entry['master_data__month'] == current_date.month),
                    {'monthly_revenue': 0}
                )
                previous_data.append(float(revenue_entry['monthly_revenue'] or 0))
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)

        elif time_period == 'last_year':
            # Get last 12 months data
            start_date = (today.replace(day=1) - timedelta(days=1)).replace(day=1)  # First day of previous month
            for _ in range(11):  # Go back 11 more months
                start_date = (start_date - timedelta(days=1)).replace(day=1)
            
            current_queryset = SalesData.objects.filter(
                master_data__date__gte=start_date,
                master_data__date__lte=today,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                monthly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year', 'master_data__month')
            
            # Get previous year for trend
            previous_start = (start_date - timedelta(days=1)).replace(day=1)
            for _ in range(11):
                previous_start = (previous_start - timedelta(days=1)).replace(day=1)
            previous_end = start_date - timedelta(days=1)
            
            previous_queryset = SalesData.objects.filter(
                master_data__date__gte=previous_start,
                master_data__date__lte=previous_end,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year',
                'master_data__month'
            ).annotate(
                monthly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year', 'master_data__month')
            
            labels = []
            data = []
            previous_data = []
            
            # Current period data
            current_date = start_date
            for _ in range(12):  # Ensure exactly 12 data points
                labels.append(current_date.strftime('%b %Y'))
                revenue_entry = next(
                    (entry for entry in current_queryset 
                     if entry['master_data__year'] == current_date.year 
                     and entry['master_data__month'] == current_date.month),
                    {'monthly_revenue': 0}
                )
                data.append(float(revenue_entry['monthly_revenue'] or 0))
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            
            # Previous period data for trend calculation
            current_date = previous_start
            for _ in range(12):  # Ensure exactly 12 data points for previous period
                revenue_entry = next(
                    (entry for entry in previous_queryset 
                     if entry['master_data__year'] == current_date.year 
                     and entry['master_data__month'] == current_date.month),
                    {'monthly_revenue': 0}
                )
                previous_data.append(float(revenue_entry['monthly_revenue'] or 0))
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)

        elif time_period == 'last_5_years':
            # Get last 5 years data
            start_year = today.year - 4
            current_queryset = SalesData.objects.filter(
                master_data__date__year__gte=start_year,
                master_data__date__year__lte=today.year,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year'
            ).annotate(
                yearly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year')
            
            # Get previous 5 years for trend
            previous_start_year = start_year - 5
            previous_end_year = start_year - 1
            
            previous_queryset = SalesData.objects.filter(
                master_data__date__year__gte=previous_start_year,
                master_data__date__year__lte=previous_end_year,
                master_data__voucher_type='Sales'
            ).values(
                'master_data__year'
            ).annotate(
                yearly_revenue=Sum('master_data__amount')
            ).order_by('master_data__year')
            
            labels = []
            data = []
            previous_data = []
            
            # Current period data
            for year in range(start_year, start_year + 5):  # Ensure exactly 5 data points
                labels.append(str(year))
                revenue_entry = next(
                    (entry for entry in current_queryset if entry['master_data__year'] == year),
                    {'yearly_revenue': 0}
                )
                data.append(float(revenue_entry['yearly_revenue'] or 0))
            
            # Previous period data for trend calculation
            for year in range(previous_start_year, previous_start_year + 5):  # Ensure exactly 5 data points
                revenue_entry = next(
                    (entry for entry in previous_queryset if entry['master_data__year'] == year),
                    {'yearly_revenue': 0}
                )
                previous_data.append(float(revenue_entry['yearly_revenue'] or 0))
        
        else:  # Default to last 7 days
            return self.get_time_filtered_data('last_7_days')
        
        trend = self.calculate_trend(data, previous_data)
        
        return {
            'labels': labels,
            'data': data,
            'trend': round(trend, 2)
        }

    def list(self, request):
        time_period = request.query_params.get('time_period', 'last_7_days')
        response_data = self.get_time_filtered_data(time_period)
        return Response(response_data)

class CurrentDateInfoViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def get_latest_date(self):
        latest_entry = MasterData.objects.order_by('-date').first()
        return latest_entry.date if latest_entry else timezone.now().date()

    def get_week_range(self, date):
        # Get the start of the week (Monday)
        start = date - timedelta(days=date.weekday())
        # Get the current day
        end = date
        return start, end

    def list(self, request):
        latest_date = self.get_latest_date()
        week_start, week_end = self.get_week_range(latest_date)
        
        response_data = {
            'current_date': {
                'date': latest_date.strftime('%d %b %Y'),
                'day': latest_date.strftime('%A')
            },
            'current_week': {
                'start_date': week_start.strftime('%d %b %Y'),
                'end_date': week_end.strftime('%d %b %Y')
            },
            'current_month': {
                'month': latest_date.strftime('%B %Y')
            }
        }
        
        return Response(response_data)

class TopProductsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def get_latest_date(self):
        latest_entry = MasterData.objects.order_by('-date').first()
        return latest_entry.date if latest_entry else timezone.now().date()

    def get_time_filtered_data(self, time_period):
        today = self.get_latest_date()
        
        if time_period == 'last_7_days':
            start_date = today - timedelta(days=6)
        elif time_period == 'last_30_days':
            start_date = today - timedelta(days=29)
        elif time_period == 'last_6_months':
            start_date = (today - timedelta(days=180)).replace(day=1)
        elif time_period == 'last_year':
            start_date = (today - timedelta(days=365)).replace(day=1)
        elif time_period == 'last_5_years':
            start_date = today.replace(year=today.year - 5, month=1, day=1)
        else:  # Default to last 7 days
            start_date = today - timedelta(days=6)

        return start_date

    def list(self, request):
        # Get the number of top products to return (default to 10)
        limit = int(request.query_params.get('limit', 10))
        time_period = request.query_params.get('time_period', 'last_7_days')
        
        # Get the start date based on time period
        start_date = self.get_time_filtered_data(time_period)
        
        # Get top products by revenue for the selected time period
        top_products = MasterData.objects.filter(
            voucher_type='Sales',
            parent__isnull=False,  # Exclude null parent values
            parent__gt='',  # Exclude empty strings
            date__gte=start_date,
            date__lte=self.get_latest_date()
        ).values(
            'parent',
            'stock_item_name'
        ).annotate(
            total_revenue=Sum('amount'),
            total_quantity=Sum('qty_number')
        ).order_by('-total_revenue')[:limit]
        
        # Format the response
        response_data = []
        for product in top_products:
            if product['parent'] and product['total_revenue']:
                response_data.append({
                    'product_name': product['parent'],
                    'stock_item': product['stock_item_name'],
                    'total_revenue': float(product['total_revenue'] or 0),
                    'total_quantity': float(product['total_quantity'] or 0)
                })
        
        return Response(response_data)

