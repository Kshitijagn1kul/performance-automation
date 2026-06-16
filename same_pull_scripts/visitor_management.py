from locust import HttpUser, task, between
import os
import csv
import json
from datetime import datetime
from requests.exceptions import RequestException

# ---------------- CONFIG ---------------- #
API_KEY = os.getenv("VISITOR_API_KEY", "627d011a1324aa6")
API_SECRET = os.getenv("VISITOR_API_SECRET", "115f2b70018adf7")
CSV_FILE = "api_responses.csv"
MAX_JSON_LENGTH = 1000  # truncate JSON if too long
REQUEST_TIMEOUT = 10  # seconds

# Ensure CSV has headers if file does not exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", "api_name", "endpoint", "status_code",
            "success", "response_json"
        ])

# ---------------- USER CLASS ---------------- #
class VisitorUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Set authentication headers for all requests"""
        self.headers = {
            "Authorization": f"token {API_KEY}:{API_SECRET}"
        }

    # ---------------- LOGGING FUNCTION ---------------- #
    def log_response(self, api_name, url, response, success, full_json):
        """Log API response to CSV file, truncating JSON if too long."""
        timestamp = datetime.utcnow().isoformat()
        try:
            json_str = json.dumps(full_json)
            if len(json_str) > MAX_JSON_LENGTH:
                json_str = json_str[:MAX_JSON_LENGTH] + "...(truncated)"
            with open(CSV_FILE, mode="a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([timestamp, api_name, url, response.status_code, success, json_str])
        except Exception as e:
            print(f"[LOG ERROR] Failed for {api_name} ({url}): {e}")

    # ---------------- API CALL FUNCTION ---------------- #
    def make_get_request(self, api_name, url):
        """Perform GET request with timeout, handle success/failure, and log full JSON."""
        try:
            with self.client.get(url, headers=self.headers, name=api_name, catch_response=True, timeout=REQUEST_TIMEOUT) as response:
                success = False
                full_json = {}
                try:
                    full_json = response.json()
                    success = response.status_code == 200
                except Exception as e:
                    full_json = {"error": f"Invalid JSON: {e}"}

                if success:
                    response.success()
                else:
                    response.failure(f"HTTP {response.status_code}")

                self.log_response(api_name, url, response, success, full_json)
        except RequestException as e:
            print(f"[REQUEST ERROR] {api_name} ({url}): {e}")
            # Log HTTP 0 for connection errors
            self.log_response(api_name, url, type('Response', (), {'status_code': 0})(), False, {"error": str(e)})

    # ---------------- TASKS ---------------- #
    @task
    def overall_visitors(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=&to_date="
        self.make_get_request("Overall_Visitors", url)

    @task
    def single_date_2025_11_24(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=2025-11-24&to_date=2025-11-24"
        self.make_get_request("Single_Date_2025-11-24", url)

    @task
    def date_range_2025_11_23_to_29(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=2025-11-23&to_date=2025-11-29"
        self.make_get_request("Date_Range_2025-11-23_to_29", url)

    @task
    def date_range_oct_nov_2025(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Date_Range_Oct_Nov_2025", url)

    @task
    def date_range_sep_oct_2025(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=2025-09-30&to_date=2025-10-30"
        self.make_get_request("Date_Range_Sep_Oct_2025", url)

    @task
    def date_range_2023_2024(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=&from_date=2023-12-31&to_date=2024-12-30"
        self.make_get_request("Date_Range_2023_2024", url)

    @task
    def location_sdsc_shar(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=SDSC%20-%20SHAR&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Location_SDSC_SHAR", url)

    @task
    def location_open_workspace(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=Open%20Work%20Space%202%20-%20IITMRP%20E%20Block&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Location_Open_Workspace", url)

    @task
    def location_rocket_factory(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=Rocket%20Factory%20-%20IITMRP%20A%20Block&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Location_Rocket_Factory", url)

    @task
    def location_thaiyur(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=Thaiyur&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Location_Thaiyur", url)

    @task
    def location_tamcoe(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_visitors?location=TAMCOE&from_date=2025-10-31&to_date=2025-11-29"
        self.make_get_request("Location_TAMCOE", url)

    # ---------------- NEW APIs ---------------- #
    @task
    def get_organisation_list(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_org"
        self.make_get_request("Get_Organisation_List", url)

    @task
    def get_employee_list(self):
        url = "/api/method/visitor_management.custom_api.visitor.get_referral"
        self.make_get_request("Get_Employee_List", url)
