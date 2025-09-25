from locust import HttpUser, task, between
from locust.exception import StopUser
import logging
import random
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# Example user pool
USER_POOL = [
    {"usr": "Administrator", "pwd": "Agnikul_1"},
    {"usr": "emp1@erp.in", "pwd": "Agnikul_1"},
    {"usr": "emp23@erp.in", "pwd": "Agnikul_1"},
]

class ERPUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Pick a random user from pool
        payload = random.choice(USER_POOL)
        success = False

        for i in range(3):  # retry login up to 3 times
            with self.client.post(
                "/api/method/login",
                json=payload,
                name="POST /login",
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    response.success()
                    logging.info(f"Login successful for user: {payload['usr']}")
                    success = True
                    break
                else:
                    # Handle deadlock specifically
                    if "Deadlock" in response.text:
                        logging.warning(f"Deadlock detected for {payload['usr']}, retrying...")
                        time.sleep(2)  # wait before retrying
                        continue

                    # Generic failure handling
                    msg = f"Login attempt {i+1} failed for {payload['usr']}: {response.status_code} - {response.text}"
                    response.failure(msg)
                    logging.error(msg)
                    time.sleep(random.uniform(0.5, 1.5))  # small backoff

        if not success:
            raise StopUser(f"Login failed after 3 retries for user: {payload['usr']}")

    @task
    def get_employees(self):
        self._make_get_request(
            "/api/method/core.factory.api.get_data",
            params={"key": "ls_employees", "page": 1, "limit": 20, "query": ""},
            name="GET /core.factory.api.get_data [employees]"
        )

    @task
    def get_insurance(self):
        self._make_get_request(
            "/api/method/hr_operations.v2.addon.insurance",
            params={"page": 1, "limit": 20, "query": ""},
            name="GET /hr_operations.v2.addon.insurance"
        )

    @task
    def get_conversion_tracker(self):
        self._make_get_request(
            "/api/method/core.factory.api.get_data",
            params={"key": "conversion_tracker", "page": 1, "limit": 20, "query": ""},
            name="GET /core.factory.api.get_data [conversion_tracker]"
        )

    def _make_get_request(self, url, params, name):
        """Helper method to handle GET requests with retries"""
        for attempt in range(3):
            try:
                with self.client.get(url, params=params, name=name, catch_response=True) as response:
                    if response.status_code == 200:
                        response.success()
                        return
                    else:
                        msg = f"{name} failed: {response.status_code} - {response.text}"
                        response.failure(msg)
                        logging.error(msg)
            except Exception as e:
                logging.error(f"{name} attempt {attempt+1} exception: {str(e)}")

            time.sleep(random.uniform(0.5, 1.5))
