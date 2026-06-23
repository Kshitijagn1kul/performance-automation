from locust import HttpUser, task, between
import random

# --- Users per role ---
FL_USERS = [{"usr": "emp23@erp.in", "pwd": "Agnikul_1"}]
SA_USERS = [{"usr": "emp1@erp.in", "pwd": "Agnikul_1"}]
FU_USERS = [{"usr": "emp73@erp.in", "pwd": "Agnikul_1"}]

# --- Map email to role ---
USER_ROLE_MAP: dict[str, str] = {
    "emp23@erp.in": " (FL) ",
    "emp1@erp.in": " (SA) ",
    "emp73@erp.in": " (FU) "
}

class BaseUser(HttpUser):
    abstract = True
    wait_time = between(1, 3)
    host = "http://14.99.126.171"

    def on_start(self):
        creds = random.choice(self.user_pool)

        # Login
        self.client.post("/api/method/login", json=creds, name=f"{creds['usr']} - Login")

        # Get logged-in user ID
        with self.client.get("/api/method/frappe.auth.get_logged_user", catch_response=True) as resp:
            if resp.status_code == 200 and "message" in resp.json():
                self.user_id = creds['usr']
                self.user_role = USER_ROLE_MAP.get(creds['usr'], "Unknown")
                resp.success()
            else:
                self.user_id = creds['usr']
                self.user_role = USER_ROLE_MAP.get(creds['usr'], "Unknown")
                resp.failure("Failed to fetch user_id")


# --- Functional Lead ---
class FLUser(BaseUser):
    user_pool = FL_USERS

    @task
    def onboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Onboarding Assignments"
        )

    @task
    def deboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Deboarding Assignments"
        )


# --- Super Admin ---
class SAUser(BaseUser):
    user_pool = SA_USERS

    @task
    def onboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Onboarding Assignments"
        )

    @task
    def deboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Deboarding Assignments"
        )


# --- Functional User ---
class FUUser(BaseUser):
    user_pool = FU_USERS

    @task
    def onboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Onboarding Assignments"
        )

    @task
    def deboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id} {self.user_role} - Deboarding Assignments"
        )
