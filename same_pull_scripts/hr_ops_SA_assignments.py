from locust import HttpUser, task, between

# --- Super Admin ---
SA_USERS = [{"usr": "emp1@erp.in", "pwd": "Agnikul_1"}]

USER_ROLE_MAP = {
    "emp1@erp.in": " (SA)"
}

class SAUser(HttpUser):
    wait_time = between(1, 3)
    host = "http://14.99.126.171"
    user_pool = SA_USERS

    def on_start(self):
        creds = self.user_pool[0]
        self.client.post("/api/method/login", json=creds, name=f"{creds['usr']} - Login")
        self.user_id = creds["usr"]
        self.user_role = USER_ROLE_MAP.get(creds["usr"], "")

    @task
    def onboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id}{self.user_role} - Onboarding Assignments"
        )

    @task
    def deboarding_assignments(self):
        self.client.get(
            "/api/method/core.factory.api.get_data?key=ls_assignments&page=1&limit=20",
            name=f"{self.user_id}{self.user_role} - Deboarding Assignments"
        )
