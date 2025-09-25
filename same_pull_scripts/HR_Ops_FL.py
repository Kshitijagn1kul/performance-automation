from locust import HttpUser, task, between
import random

# --- Users ---
HR_FL_USERS = [{"usr": "emp23@erp.in", "pwd": "Agnikul_1"}]

class HRUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://14.99.126.171"

    def on_start(self):
        creds = random.choice(HR_FL_USERS)
        self.client.post("/api/method/login", json=creds, name="emp23 - Login")

    @task(1)
    def get_logged_user(self):
        self.client.get("/api/method/frappe.auth.get_logged_user", name="EMP23_FPH_PL - Get Logged User")

    # --- HR OPS Endpoints ---

    @task(1)
    def home(self):
        self.client.get("/api/method/hr_operations.v2.addon.qa")


    @task(1)
    def dashboard(self):
        self.client.get("/api/method/hr_operations.v2.counts.status")
        self.client.get("/api/method/hr_operations.v2.hc.get_headcount")

    @task(1)
    def department_directory(self):
        self.client.get("/api/method/hr_operations.v2.addon.list_depts?query=&page=1")

    @task(1)
    def attendance(self):
        self.client.get("/api/method/hr_operations.v2.timeline.attendance_stats?from_date=2025-09-01&to_date=2025-09-30&page=1&limit=20&query=")

    @task(1)
    def assignments_list(self):
        self.client.get("/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20&query=&assignment_type=Onboarding")
        self.client.get("/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20&query=&assignment_type=Deboarding")

    @task(1)
    def assignments_post(self):
        payload = {
            "key": "assignments",
            "full_name": "Shanmugavel",
            "designation": "Senior Associate",
            "assigned_to": "emp37@erp.in",
            "assignment_type": "Onboarding",
            "department": "Department 1 - AC",
            "due_date": "2025-09-24",
            "status": "In-progress"
        }
        self.client.post("/api/method/core.factory.api.post_data", json=payload)
        

    @task(1)
    def employee_mgmt_counts(self):
        self.client.get("/api/method/hr_operations.v2.counts.status")

    @task(1)
    def employee_assignment_data(self):
        self.client.get("/api/method/core.factory.api.get_data?key=assignment_data&name=HRA_0925_5848")

    @task(1)
    def employee_list(self):
        self.client.get("/api/method/core.factory.api.get_data?key=ls_employees&page=1&limit=20&query=")

    @task(1)
    def reports_onboarding(self):
        self.client.get("/api/method/core.factory.api.get_data?key=ls_reports&page=1&limit=20&query=&assignment_type=Onboarding")

    @task(1)
    def reports_deboarding(self):
        self.client.get("/api/method/core.factory.api.get_data?key=ls_reports&page=1&limit=20&query=&assignment_type=Deboarding")

    @task(1)
    def holiday_calendar(self):
        self.client.get("/api/method/hr_operations.v2.addon.list_holidays?page=1&limit=1&query=2025")

    @task(1)
    def notebook(self):
        self.client.get("/api/method/hr_operations.v2.addon.nb_stats?page=1&limit=20&query=")

    @task(1)
    def notebook_logs(self):
        self.client.get("/api/method/hr_operations.v2.addon.nb_stats?logs=log&page=1&limit=20&query=")
