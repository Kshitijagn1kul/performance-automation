# ✔ 1. Normal Scan – Fast Network
# ✔ 2. Slow Network 3G
# ✔ 3. No Network – Offline
# ✔ 4. Multiple Scans at Same Time
# ✔ 5. Invalid QR
# ✔ 6. Expired QR
# ✔ 7. Duplicate Scan
# ✔ 8. ERP delay simulation
# ✔ 9. Token expiry (if login needed)
# ✔ 10. Retry logic

# locustfile.py
from locust import HttpUser, SequentialTaskSet, task, between
import random, json, time

# --- Test data: replace / extend with real emails or read from file ---
EMPLOYEES = [
    {"emp_email": "emp1@example.com", "emp_id": "AGK001"},
    {"emp_email": "emp2@example.com", "emp_id": "AGK002"},
    {"emp_email": "emp3@example.com", "emp_id": "AGK003"},
]

LOCATION = "Open Work Space 2 - IITMRP E Block"


# --- Example payload constructors ---
def make_employee_details_payload(emp):
    return {"emp_email": emp["emp_email"], "location": LOCATION}


def make_mark_entry_payload_with_laptop():
    return {
        "location": LOCATION,
        "laptop_status": "with",
        "laptop_image": {"laptop": "/path/of/laptop.png", "form": "/path/of/form.png"},
        "mobile": "Yes",
        "no_mobile": 1,
        "mobile_slot": "Slot-12",
        "conf_items": None,
        "additional_laptop": None,
    }


def make_mark_entry_payload_without_laptop():
    return {
        "location": LOCATION,
        "laptop_status": "without",
        "mobile": "No",
        "no_mobile": 0,
        "conf_items": None,
        "additional_laptop": None,
    }


def make_mark_exit_payload_with_return():
    return {
        "location": LOCATION,
        "laptop_status": "with",
        "return_mobile": "Yes",
        "laptop_image": {"laptop": "/path/of/laptop.png", "form": "/path/of/form.png"},
        "conf_items": None,
        "additional_laptop": None,
    }


# --- Sequential flow for each virtual user ---
class EntryExitFlow(SequentialTaskSet):

    def on_start(self):
        # Called when a simulated user starts — do security_login
        # If your API needs credentials, change body accordingly.
        login_payload = {}  # if api expects body, add it here
        with self.client.post(
            "/api/method/visitor_management.custom_api.entry_exit.security_login",
            json=login_payload,
            name="security_login",
            catch_response=True,
        ) as resp:
            # If cookie or token needed, Locust's session will keep cookies automatically.
            if resp.status_code != 200:
                resp.failure(f"login failed: {resp.status_code}")
            else:
                resp.success()

        # small think time after login
        time.sleep(random.uniform(0.5, 1.5))

    @task
    def get_employee_details(self):
        emp = random.choice(EMPLOYEES)
        payload = make_employee_details_payload(emp)
        with self.client.post(
            "/api/method/visitor_management.custom_api.entry_exit.employee_details",
            json=payload,
            name="employee_details",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                # record failure but continue
                resp.failure(f"employee_details {resp.status_code}")
            else:
                # optional: inspect JSON to decide next step
                resp.success()
        time.sleep(random.uniform(0.2, 1.0))

    @task
    def mark_entry_or_exit(self):
        # choose entry or exit randomly (you can bias probability)
        choice = random.choices(["entry", "exit"], weights=[0.6, 0.4])[0]
        emp = random.choice(EMPLOYEES)

        if choice == "entry":
            # randomly with/without laptop
            if random.random() < 0.5:
                payload = {
                    "emp_email": emp["emp_email"],
                    "entry_exit_data": make_mark_entry_payload_with_laptop(),
                }
            else:
                payload = {
                    "emp_email": emp["emp_email"],
                    "entry_exit_data": make_mark_entry_payload_without_laptop(),
                }

            endpoint = "/api/method/visitor_management.custom_api.entry_exit.mark_entry"
            req_name = "mark_entry"
        else:
            # exit payload
            if random.random() < 0.6:
                payload = {
                    "emp_email": emp["emp_email"],
                    "entry_exit_data": make_mark_exit_payload_with_return(),
                }
            else:
                # exit without returning mobile
                payload = {
                    "emp_email": emp["emp_email"],
                    "entry_exit_data": make_mark_entry_payload_without_laptop(),
                }
            endpoint = "/api/method/visitor_management.custom_api.entry_exit.mark_exit"
            req_name = "mark_exit"

        with self.client.post(
            endpoint, json=payload, name=req_name, catch_response=True
        ) as resp:
            if resp.status_code not in (200, 201, 202):
                resp.failure(f"{req_name} failed: {resp.status_code}")
            else:
                resp.success()
        # think time before next iteration / user stops
        time.sleep(random.uniform(1.0, 3.0))


class WebsiteUser(HttpUser):
    tasks = [EntryExitFlow]
    wait_time = between(1, 3)  # adjust to simulate user pacing
    # host can be overridden with CLI: --host http://14.99.126.171
