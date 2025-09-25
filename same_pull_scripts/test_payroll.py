from locust import HttpUser, task, between
import random

# --- User Pools ---
EMPLOYEES = [
    {"usr": "emp95@erp.in", "pwd": "Agnikul_1"},   # Employee
]
PL_USERS = [
    {"usr": "emp54@erp.in", "pwd": "Agnikul_1"},   # PL
]
FL_USERS = [
    {"usr": "emp50@erp.in", "pwd": "Agnikul_1"},   # FL
]

# --- Base Class for Login ---
class ERPUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://14.99.126.171"

    def on_start(self):
        creds = random.choice(self.user_pool)
        with self.client.post("/api/method/login", json=creds, catch_response=True) as resp:
            if resp.status_code == 200 and resp.json().get("message") == "Logged In":
                resp.success()
            else:
                resp.failure("Login failed")

# --- Employee Tasks ---
class EmployeeUser(ERPUser):
    user_pool = EMPLOYEES

    @task(2)
    def create_travel_request(self):
        payload = {
            "req_for": "Project",
            "req_name": f"P1-Test-{random.randint(100,999)}",
            "age": "27",
            "phone_number": "7823450987",
            "aadhaar_attachment": "http://14.99.126.171/payroll_desk",
            "accommodation": 0,
            "travel": 1,
            "t_data": {
                "from_location": "Taramani",
                "to_location": "Perungudi",
                "from_date": "24-09-2025",
                "mode": "Train"
            }
        }
        self.client.post("/api/method/payroll_management.api.create_travel_accommodation_requests", json=payload)

    @task(1)
    def track_self_requests(self):
        self.client.get("/api/method/payroll_management.api.track_requests?request_type=Self&from_date=&to_date=&page_size=1000")

    @task(1)
    def leave_tracker(self):
        self.client.get("/api/method/payroll_management.api.get_leave_tracker_details?request=Self&year=2025&user=emp95@erp.in&page_size=1000")

    @task(1)
    def export_reimbursements(self):
        self.client.get("/api/method/payroll_management.api.export_reimbursements")

# --- Project Lead Tasks ---
class PLUser(ERPUser):
    user_pool = PL_USERS

    @task(2)
    def team_track_requests(self):
        self.client.get("/api/method/payroll_management.api.track_requests?request_type=Team&from_date=&to_date=&page_size=1000")

    @task(1)
    def request_approvals(self):
        self.client.get("/api/method/payroll_management.api.request_approvals")

    @task(1)
    def approve_request(self):
        self.client.get("/api/method/payroll_management.api.approve_request?record=RR_0925_5820&status=Approve&reason=Approve&assign_to=")

    @task(1)
    def filter_team_requests(self):
        self.client.get("/api/method/payroll_management.api.track_requests?request_type=Team&from_date=2025-09-01&to_date=2025-09-30&page_size=1000")

# --- Functional Lead Tasks ---
class FLUser(ERPUser):
    user_pool = FL_USERS

    @task(3)
    def view_request_details(self):
        self.client.get("/api/method/payroll_management.api.view_details?doctype=PR_Reimbursement_Requests&name=RR_0925_5820")
