from locust import HttpUser, task, between, SequentialTaskSet
import random
import time
import json

HOST = "http://14.99.126.171"

SAMPLE_VISITOR = {
    "visitor_name": "John Doe",
    "mobile": "9876543210",
    "email": "john@example.com",
    "referral": "EMP001",
    "organisation": "ABC Corp",
    "location": "IITMRP E Block",
}


class VisitorFlow(SequentialTaskSet):

    def on_start(self):
        """
        Runs automatic steps before every simulated user.
        This simulates Security guard login or app open.
        """
        pass

    # --------------------------------------------------------------------
    # 1️⃣ GET ORGANISATION LIST
    # --------------------------------------------------------------------
    @task
    def get_organisation_list(self):
        self.client.get(
            "/api/method/visitor_management.custom_api.visitor.get_org", name="get_org"
        )
        time.sleep(random.uniform(0.3, 1))

    # --------------------------------------------------------------------
    # 2️⃣ GET EMPLOYEE LIST
    # --------------------------------------------------------------------
    @task
    def get_employee_list(self):
        self.client.get(
            "/api/method/visitor_management.custom_api.visitor.get_referral",
            name="get_referral",
        )
        time.sleep(random.uniform(0.3, 1))

    # --------------------------------------------------------------------
    # 3️⃣ GENERATE OTP
    # --------------------------------------------------------------------
    @task
    def generate_otp(self):
        payload = {"mobile": SAMPLE_VISITOR["mobile"]}
        self.client.post(
            "/api/method/visitor_management.custom_api.visitor.generate_and_send_otp",
            json=payload,
            name="generate_otp",
        )
        time.sleep(random.uniform(0.5, 1.2))

    # --------------------------------------------------------------------
    # 4️⃣ VERIFY OTP
    # --------------------------------------------------------------------
    @task
    def verify_otp(self):
        # NOTE: You need real OTP; using dummy 0000 for load test
        payload = {"mobile": SAMPLE_VISITOR["mobile"], "otp": "0000"}
        self.client.post(
            "/api/method/visitor_management.custom_api.visitor.verify_otp",
            json=payload,
            name="verify_otp",
        )
        time.sleep(random.uniform(0.5, 1.2))

    # --------------------------------------------------------------------
    # 5️⃣ CREATE VISITOR ENTRY RECORD
    # --------------------------------------------------------------------
    @task
    def create_visitor_entry(self):
        data = {
            "visitor_name": SAMPLE_VISITOR["visitor_name"],
            "mobile": SAMPLE_VISITOR["mobile"],
            "email": SAMPLE_VISITOR["email"],
            "referral": SAMPLE_VISITOR["referral"],
            "organisation": SAMPLE_VISITOR["organisation"],
            "location": SAMPLE_VISITOR["location"],
        }

        self.client.post(
            "/api/method/visitor_management.custom_api.visitor.create_visitor_record",
            json={"data": data},
            name="visitor_entry",
        )
        time.sleep(random.uniform(0.5, 1.5))

    # --------------------------------------------------------------------
    # 6️⃣ GET VISITOR LIST (FILTER)
    # --------------------------------------------------------------------
    @task
    def get_all_visitors(self):
        params = {
            "location": "IITMRP E Block",
            "from_date": "2025-01-01",
            "to_date": "2025-12-31",
        }

        self.client.get(
            "/api/method/visitor_management.custom_api.visitor.get_visitors",
            params=params,
            name="get_visitors",
        )
        time.sleep(random.uniform(0.3, 1.2))

    # --------------------------------------------------------------------
    # 7️⃣ VISITOR EXIT
    # --------------------------------------------------------------------
    @task
    def visitor_exit(self):
        # Load test: using dummy docname
        payload = {"docname": "VIS-0001"}

        self.client.post(
            "/api/method/visitor_management.custom_api.visitor.visitor_exit",
            json=payload,
            name="visitor_exit",
        )
        time.sleep(random.uniform(0.3, 1.5))


class VisitorUser(HttpUser):
    tasks = [VisitorFlow]
    wait_time = between(1, 3)
    host = HOST
