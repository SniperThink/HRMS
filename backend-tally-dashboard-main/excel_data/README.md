# Salary Data API Documentation

This API provides endpoints to interact with salary data, including uploading, retrieving, and filtering salary information.

## Base URL

All API endpoints are accessible under:
```
/api/excel/
```

## Authentication

The API uses Django's default authentication. Make sure your requests include proper authentication headers.

## Endpoints

### Upload Salary Data

- **URL**: `/api/excel/upload-salary/`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: Excel file containing salary data sheets

- **Success Response**:
  - **Code**: 201 Created
  - **Content**: `{ "message": "[number] records uploaded." }`

- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**: `{ "error": "No file uploaded" }`
  or
  - **Code**: 500 Internal Server Error
  - **Content**: `{ "error": "[error message]" }`

### List Salary Data

- **URL**: `/api/excel/salary-data/`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search term for filtering by name, employee_id, or department
  - `ordering`: Field to sort by (prefixed with `-` for descending order)
  - `page`: Page number for pagination
  - `page_size`: Number of items per page

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: List of salary records with summary fields

### Get Detailed Salary Record

- **URL**: `/api/excel/salary-data/{id}/`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: ID of the salary record

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: Detailed information about the specified salary record

### Get Salary Records by Employee

- **URL**: `/api/excel/salary-data/by_employee/`
- **Method**: `GET`
- **Query Parameters**:
  - `employee_id`: Employee ID to filter records 
  - `name`: Employee name to filter records (partial match supported)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: List of all salary records for the specified employee

- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**: `{ "error": "Either employee_id or name parameter is required" }`

### Get Salary Records by Period

- **URL**: `/api/excel/salary-data/by_period/`
- **Method**: `GET`
- **Query Parameters**:
  - `year`: Year to filter records (e.g., 2022)
  - `month`: Month to filter records (e.g., JAN, FEBRUARY, etc.)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: List of salary records for the specified period

### Search Salary Records

- **URL**: `/api/excel/salary-data/search/`
- **Method**: `GET`
- **Query Parameters**:
  - `q`: Search query to filter by name, employee_id, or department

- **Success Response**:
  - **Code**: 200 OK
  - **Content**: List of salary records matching the search query

## Examples

### Fetching employee's salary history

```javascript
fetch('/api/excel/salary-data/by_employee/?name=John%20Doe')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Fetching salary data for a specific month/year

```javascript
fetch('/api/excel/salary-data/by_period/?year=2022&month=JAN')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Searching for employees in a department

```javascript
fetch('/api/excel/salary-data/search/?q=sales')
  .then(response => response.json())
  .then(data => console.log(data));
``` 